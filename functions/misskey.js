const { logger } = require("firebase-functions/v2");
const {
  getMediaAsUint8Array,
  reduceImageSize,
  getMimeTypes,
} = require("./utils.js");

/**
 * Post to Misskey
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  try {
    const mediaIds = [];
    if (files?.length) {
      const result = await getMediaAsUint8Array(bucket, id, files[0]);

      if (result.err) {
        return { err: result.err, data: undefined };
      }

      const form = new FormData();
      const image = new Blob(
        [await reduceImageSize(new Uint8Array(result.data), 1000 * 1000)],
        { type: getMimeTypes(files[0]) },
      );
      form.append("file", image, files[0]);
      form.append("name", files[0]);
      form.append("isSensitive", false);

      const { status, statusText, data } = await fetch(
        `${params.url}/drive/files/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: form,
        },
      );
      logger.info(`misskey post media: ${status} ${JSON.stringify(data)}`);

      mediaIds.push(data.id);

      if (status !== 200) {
        return { err: `${status} ${statusText}` };
      }
    }

    const visibility = "public";
    const json = mediaIds.length
      ? { visibility, text, mediaIds }
      : { visibility, text };

    const ret = await fetch(`${params.url}/notes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify(json),
    });

    logger.info(
      `misskey post media: ${ret.status} ${JSON.stringify(ret.data)}`,
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
