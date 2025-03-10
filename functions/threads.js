const { logger } = require("firebase-functions/v2");

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
    retContainer = await fetch(url, { method: "POST" });

    if (retContainer.status !== 200) {
      return {
        err:
          "Failed to create container:" +
          ` ${retContainer.status} ${retContainer.statusText}`,
      };
    }

    const retPublish = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish` +
        `?creation_id=${retContainer.data.id}` +
        `&access_token=${accessToken}`,
      { method: "POST" },
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
 * Set long access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 * @returns {Promise<object>}
 */
const setThreadsLongAccessToken = async (db, { code }) => {
  try {
    console.log(`setThreadsLongAccessToken(${code})`);

    const authRef = db.collection("service").doc("auth");
    const auth = await authRef.get();
    const { clientId, clientSecret, callBackUrl } = auth.get("threads");

    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", callBackUrl);
    formData.append("code", code);

    let oauthResp = await fetch(
      "https://graph.threads.net/oauth/access_token",
      {
        method: "POST",
        body: formData,
      },
    );
    if (oauthResp.status !== 200) {
      const err = `/oauth/access_token: ${oauthResp.status} ${oauthResp.statusText}`;
      console.error(err);
      return { err };
    }
    const oauthData = await oauthResp.json();
    if (!oauthData.access_token) {
      const err = "/oauth/access_token: failed to get access token";
      console.error(err);
      return { err };
    }
    console.log(
      `setThreadsLongAccessToken() accessToken: ${oauthData.access_token}`,
    );

    const exchangeResp = await fetch(
      "https://graph.threads.net/access_token" +
        "?grant_type=th_exchange_token" +
        `&client_secret=${clientSecret}` +
        `&access_token=${oauthData.access_token}`,
    );
    if (exchangeResp.status !== 200) {
      const err = `/access_token: ${exchangeResp.status} ${exchangeResp.statusText}`;
      console.error(err);
      return { err };
    }
    const exchangeData = await exchangeResp.json();
    if (!exchangeData.access_token) {
      const err = `/access_token: failed to get access token`;
      console.error(err);
      return { err };
    }

    await authRef.update({
      "threads.accessToken": exchangeData.access_token,
      "threads.userId": oauthData.user_id,
      "threads.expiredAt": new Date(
        new Date().getTime() + exchangeData.expires_in * 1000,
      ),
      updatedAt: new Date(),
    });

    return { err: undefined };
  } catch (e) {
    return { err: e };
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
      const result = await fetch(
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

module.exports = { post, setThreadsLongAccessToken, refreshThreadsAccessToken };
