const { logger } = require("firebase-functions/v2");
const { createHash } = require("node:crypto");
const { getMediaAsBlob } = require("./utils.js");

/**
 * Post to Mastodon
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

      const resMedia = await fetch(`${params.url}/v2/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.token}`,
        },
        body: form,
      });
      const { status, statusText } = resMedia;
      const data = await resMedia.json();
      logger.info(`mastodon post media: ${status} ${JSON.stringify(data)}`);

      mediaIds.push(data.id);

      if (status === 202) {
        await new Promise((r) => setTimeout(r, timeout * 1000));
        const res = await fetch(`${params.url}/v1/media/${data.id}`, {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        });
        logger.info(`mastodon get media: ${res.status}`);
        if (res.status === 206) {
          await new Promise((r) => setTimeout(r, timeout * timeout * 1000));
        } else if (res.status !== 200) {
          return { err: `${res.status} ${res.statusText}` };
        }
      } else if (status !== 200) {
        return { err: `${status} ${statusText}` };
      }
    }

    // Mastodon: Idempotency keys are stored for up to 1 hour.
    const hash = createHash("sha256");
    hash.update(text);

    const json = {
      status: text,
      sensitive: false,
      visibility: "public",
      language: "ja",
    };
    if (mediaIds.length) {
      logger.info(`mastodon add media: ${mediaIds.join(",")}`);
      json["media_ids"] = mediaIds;
    }

    const ret = await fetch(`${params.url}/v1/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
        "Idempotency-Key": hash.digest("hex"),
      },
      body: JSON.stringify(json),
    });

    logger.info(
      `mastodon post media: ${ret.status} ${JSON.stringify(ret.data)}`,
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
