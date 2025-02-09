const { logger } = require("firebase-functions/v2");
const { createHash } = require("node:crypto");
const axios = require("axios");
const { getMediaAsBlob } = require("./utils.js");

/**
 * Post to Twitter
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  const timeout = Number(process.env.IMAGE_UPLOAD_TIMEOUT || 5);
  try {
    const mediaIds = [];
    if (files?.length) {
      const blob = await getMediaAsBlob(bucket, id, files[0]);

      const form = new FormData();
      form.append("file", blob.data, files[0]);

      const { status, statusText, data } = await axios.post(
        "https://api.x.com/2/media/upload",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.bearerToken}`,
          },
        },
      );
      logger.info(`twitter post media: ${status} ${JSON.stringify(data)}`);

      mediaIds.push(data.id);

      if (status === 200 && data.processing_info.state === "in_progress") {
        const wait = Math.min(
          data.processing_info.check_after_secs,
          timeout * timeout,
        );
        logger.info(`twitter wait media upload: ${wait} sec.`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else if (status !== 200) {
        return { err: `${status} ${statusText}` };
      }
    }

    // Mastodon: Idempotency keys are stored for up to 1 hour.
    const hash = createHash("sha256");
    hash.update(text);

    const json = {
      text,
      language: "ja",
    };
    if (mediaIds.length) {
      logger.info(`twitter add media: ${mediaIds.join(",")}`);
      json["media_ids"] = mediaIds;
    }

    const ret = await axios.post("https://api.x.com/2/tweets", json, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.bearerToken}`,
      },
    });

    logger.info(
      `twitter post media: ${ret.status} ${JSON.stringify(ret.data)}`,
    );
    if (ret.status !== 200) {
      return { err: `${ret.status} ${ret.statusText}` };
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

module.exports = { post };
