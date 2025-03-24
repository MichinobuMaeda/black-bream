const { logger } = require("firebase-functions/v2");
const { httpRequest, getPublicMediaUrl } = require("./utils.js");
const { Provider } = require("./provider.js");

class Threads extends Provider {
  /**
   * Threads constructor
   *
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "threads";
  }

  /**
   * Post container
   *
   * @param {{ clientId:string, accessToken:string }} params
   * @param {string} id
   * @param {{ userId, accessToken }} data
   * @returns {Promise<{err: undefined|string, data: object|undefined}>}
   */
  async createContainer({ userId, accessToken }, id, { text, files }) {
    text = text.trim();
    const url = files?.length
      ? `https://graph.threads.net/v1.0/${userId}/threads` +
        "?media_type=IMAGE" +
        `&text=${encodeURIComponent(text)}` +
        `&image_url=${getPublicMediaUrl(id, files[0])}` +
        `&access_token=${accessToken}`
      : `https://graph.threads.net/v1.0/${userId}/threads` +
        "?media_type=TEXT" +
        `&text=${encodeURIComponent(text)}` +
        `&access_token=${accessToken}`;
    logger.info(url);

    const { err, data } = await httpRequest(url, { method: "POST" });

    if (err) {
      return { err: `Failed to create container: ${err}` };
    }

    const json = await data.json();

    return { err: undefined, data: json };
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{ text, files }} data
   * @returns {Promise<{err: undefined|string}>}
   */
  async post(id, data) {
    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { userId, accessToken } = params.data;

    let container = await this.createContainer(params.data, id, data);

    if (container.err) {
      return container;
    }

    const retPublish = await httpRequest(
      `https://graph.threads.net/v1.0/${userId}/threads_publish` +
        `?creation_id=${container.data.id}` +
        `&access_token=${accessToken}`,
      { method: "POST" },
    );

    return { err: retPublish.err };
  }

  /**
   * Refresh access token
   *
   * @returns {Promise<{err: undefined|string}>}
   */
  async refreshAccessToken() {
    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { accessToken, expiredAt } = params.data;

    if (
      accessToken &&
      expiredAt &&
      expiredAt.toDate().getTime() > new Date().getTime() - 1000 * 60 * 60 * 24
    ) {
      const resp = await httpRequest(
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          `&access_token=${accessToken}`,
      );

      if (resp.err) {
        logger.error(resp.err);
        return { err: `Failed to refresh Threads access token: ${resp.err}` };
      }

      const json = await resp.data.json();
      logger.info("Threads access token refreshed");

      const updated = await this.updateParams({
        accessToken: json.access_token,
        expiredAt: new Date(new Date().getTime() + json.expires_in * 1000),
      });

      if (updated.err) {
        logger.error(updated.err);
        return updated;
      }
    }
    return { err: undefined };
  }

  /**
   * Set access token
   *
   * @param {{code:string}} data
   * @returns {Promise<{err: undefined|string}>}
   */

  async setAccessToken({ code }) {
    if (!code) {
      return { err: "No code" };
    }

    logger.log(`setAccessToken(${code})`);

    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { clientId, clientSecret, callBackUrl } = params.data;

    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", callBackUrl);
    formData.append("code", code);

    let oauthResp = await httpRequest(
      "https://graph.threads.net/oauth/access_token",
      {
        method: "POST",
        body: formData,
      },
    );

    if (oauthResp.err) {
      const err = `POST /oauth/access_token: ${oauthResp.err}`;
      logger.error(err);
      return { err };
    }

    const oauthData = await oauthResp.data.json();

    if (!oauthData.access_token) {
      const err = "POST /oauth/access_token: failed to get access token";
      logger.error(err);
      return { err };
    }

    logger.log(
      `setThreadsLongAccessToken() accessToken: ${oauthData.access_token}`,
    );

    const tokenResp = await httpRequest(
      "https://graph.threads.net/access_token" +
        "?grant_type=th_exchange_token" +
        `&client_secret=${clientSecret}` +
        `&access_token=${oauthData.access_token}`,
    );

    if (tokenResp.err) {
      const err = `GET /access_token: ${tokenResp.err}`;
      logger.error(err);
      return { err };
    }

    const newTokenResp = await tokenResp.data.json();

    if (!newTokenResp.access_token) {
      const err = `GET /access_token: failed to get access token`;
      logger.error(err);
      return { err };
    }

    const updated = await this.updateParams({
      accessToken: newTokenResp.access_token,
      userId: oauthData.user_id,
      expiredAt: new Date(
        new Date().getTime() + newTokenResp.expires_in * 1000,
      ),
    });

    if (updated.err) {
      logger.error(updated.err);
      return updated;
    }

    return { err: undefined };
  }
}

module.exports = { Threads };
