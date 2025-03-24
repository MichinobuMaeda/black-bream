const { logger } = require("firebase-functions/v2");
const { getPublicMediaUrl, generateLinkCard, httpRequest } = require("./utils");
const { Provider } = require("./provider.js");

class Tumblr extends Provider {
  /**
   * Tumblr constructor
   *
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "tumblr";
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|string}>}
   */
  async post(id, { text, files }) {
    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { accessToken, blogId } = params.data;

    text = text.trim();
    let body = undefined;

    if (files?.length) {
      const url = getPublicMediaUrl(id, files[0]);
      body = JSON.stringify({
        content: [
          { type: "image", media: { url } },
          { type: "text", text },
        ],
      });
    } else {
      const { data } = await generateLinkCard(text);
      if (data) {
        const url = data.uri;
        text = text.replace(url, "").trim();
        body = JSON.stringify({
          content: [
            { type: "text", text },
            { type: "link", url },
          ],
        });
      } else {
        body = JSON.stringify({ content: [{ type: "text", text }] });
      }
    }

    const { err } = await httpRequest(
      `https://api.tumblr.com/v2/blog/${blogId}/posts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    if (err) {
      return {
        err: `httpRequest: ${err}`,
      };
    }

    return { err: undefined };
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

    const { clientId, clientSecret, accessToken, refreshToken, expiredAt } =
      params.data;

    if (expiredAt.toDate() > new Date(new Date().getTime() + 60 * 1000)) {
      return { err: undefined };
    }

    logger.info(JSON.stringify(params));

    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);

    let oauthResp = await httpRequest(
      "https://api.tumblr.com/v2/oauth2/token",
      { method: "POST", body: formData },
    );

    if (oauthResp.err) {
      const err = `/2/oauth2/token: ${oauthResp.err}`;
      logger.error(err);
      return { err };
    }

    const oauthData = await oauthResp.data.json();

    const updated = await this.updateParams({
      accessToken: oauthData.access_token ?? accessToken,
      refreshToken: oauthData.refresh_token ?? refreshToken,
      expiredAt: oauthData.expires_in
        ? new Date(new Date().getTime() + oauthData.expires_in * 1000)
        : undefined,
    });

    if (updated.err) {
      const err = `service/auth update: ${updated.err}`;
      return { err };
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
    logger.log(JSON.stringify({ code }));

    if (!code || code === "error") {
      const err = `invalid code: ${code}`;
      logger.error(err);
      return { err };
    }

    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { clientId, clientSecret, callBackUrl } = params.data;

    const formData = new FormData();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("redirect_uri", callBackUrl);

    let oauthResp = await httpRequest(
      "https://api.tumblr.com/v2/oauth2/token",
      { method: "POST", body: formData },
    );

    if (oauthResp.err) {
      const err = `/2/oauth2/token: ${oauthResp.err}`;
      logger.error(err);
      return { err };
    }

    const oauthData = await oauthResp.data.json();
    logger.log(JSON.stringify(oauthData));

    if (!oauthData.access_token) {
      const err = "Failed to get new access_token";
      logger.error(err);
      return { err };
    }

    const updated = await this.updateParams({
      accessToken: oauthData.access_token,
      refreshToken: oauthData.refresh_token ?? undefined,
      expiredAt: oauthData.expires_in
        ? new Date(new Date().getTime() + oauthData.expires_in * 1000)
        : undefined,
    });

    if (updated.err) {
      const err = `service/auth update: ${updated.err}`;
      logger.error(err);
      return { err };
    }

    return { err: undefined };
  }
}

module.exports = { Tumblr };
