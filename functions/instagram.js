const { logger } = require("firebase-functions/v2");

/**
 * Post to Instagram
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  try {
    if (!files?.length) {
      return { err: "No media files" };
    }

    const { clientId, accessToken } = params;

    const mediaUrl = `${process.env.PUBLIC_POST_MEDIA_URL}/public/posts/${id}/${files[0]}`;
    let response = await fetch(
      `https://graph.instagram.com/v22.0/${clientId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caption: text, image_url: mediaUrl }),
      },
    );

    if (response.status !== 200) {
      const err = `Failed to create container: ${response.status} ${response.statusText}`;
      logger.error(err);
      return { err };
    }

    logger.info(`Created container: ${response.data.id}`);

    const { status, statusText } = await fetch(
      `https://graph.instagram.com/v22.0/${clientId}/media_publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creation_id: response.data.id }),
      },
    );

    if (status !== 200) {
      const err = `Failed to publish: ${status} ${statusText}`;
      logger.error(err);
      return { err };
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

module.exports = { post };
