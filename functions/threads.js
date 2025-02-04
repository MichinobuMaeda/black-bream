const { logger } = require("firebase-functions/v2");
const axios = require("axios");

/**
 * Post to Threads
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  try {
    const { userId, accessToken } = params;
    let retContainer = null;

    let url = null;
    if (files?.length) {
      const mediaUrl = `${process.env.PUBLIC_POST_MEDIA_URL}/public/posts/${id}/${files[0]}`;
      url =
        `https://graph.threads.net/v1.0/${userId}/threads` +
        "?media_type=IMAGE" +
        `&text=${encodeURIComponent(text)}` +
        `&image_url=${mediaUrl}` +
        `&access_token=${accessToken}`;
    } else {
      url =
        `https://graph.threads.net/v1.0/${userId}/threads` +
        "?media_type=TEXT" +
        `&text=${encodeURIComponent(text)}` +
        `&access_token=${accessToken}`;
    }

    logger.info(url);
    retContainer = await axios.post(url);

    if (retContainer.status !== 200) {
      return {
        err:
          "Failed to create container:" +
          ` ${retContainer.status} ${retContainer.statusText}`,
      };
    }

    const retPublish = await axios.post(
      `https://graph.threads.net/v1.0/${userId}/threads_publish` +
        `?creation_id=${retContainer.data.id}` +
        `&access_token=${accessToken}`,
    );

    if (retPublish.status !== 200) {
      return {
        err:
          "Failed to publish:" +
          ` ${retPublish.status} ${retPublish.statusText}`,
      };
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

/**
 * Refresh Threads access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @returns
 */
const refreshThreadsAccessToken = async (db) => {
  try {
    const authRef = db.collection("service").doc("auth");
    const doc = await authRef.get();

    if (!doc.exists) {
      return { err: "Not found: service/auth" };
    }

    if (doc.get("deletedAt")) {
      return { err: "Deleted: service/auth" };
    }

    const threads = doc.get("threads");

    if (!threads) {
      return { err: "Not found: service/auth/threads" };
    }

    const { accessToken, expiredAt, deletedAt } = threads;

    if (deletedAt) {
      return { err: "Deleted: service/auth/threads" };
    }

    if (
      accessToken &&
      expiredAt &&
      expiredAt.toDate().getTime() > new Date().getTime() - 1000 * 60 * 60 * 24
    ) {
      const result = await axios.get(
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          `&access_token=${accessToken}`,
      );

      if (result.status === 200) {
        logger.info("Threads access token refreshed");
        await authRef.update({
          "threads.accessToken": result.data.access_token,
          "threads.expiredAt": new Date(
            new Date().getTime() + result.data.expires_in * 1000,
          ),
        });
      } else {
        const err =
          "Failed to refresh Threads access token:" +
          ` ${result.status} ${result.statusText}`;
        logger.error(err);
        return { err };
      }
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.code ?? e.toString() };
  }
};

module.exports = { post, refreshThreadsAccessToken };
