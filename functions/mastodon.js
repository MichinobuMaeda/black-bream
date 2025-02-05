const { logger } = require("firebase-functions/v2");
const { createHash } = require("node:crypto");
const axios = require("axios");
const { getMimeTypes } = require("./utils.js");

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
      const contents = await bucket
        .file(`public/posts/${id}/${files[0]}`)
        .download();

      const form = new FormData();
      form.append(
        "file",
        new Blob([new Uint8Array(contents[0])], {
          type: getMimeTypes(files[0]),
        }),
        files[0],
      );

      const { status, statusText, data } = await axios.post(
        `${params.url}/v2/media`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      );

      mediaIds.push(data.id);

      if (status === 202) {
        await new Promise((r) => setTimeout(r, timeout * 1000));
        const res = await axios.get(`${params.url}/v1/media/${data.id}`, {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        });
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

    const form = new FormData();
    form.append("status", text);
    form.append("sensitive", "false");
    form.append("visibility", "public");
    form.append("language", "ja");
    if (mediaIds.length) {
      form.append("media_ids", mediaIds.join(","));
    }

    const ret = await axios.post(`${params.url}/v1/statuses`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${params.token}`,
        "Idempotency-Key": hash.digest("hex"),
      },
    });

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
