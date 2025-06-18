import { logger } from "firebase-functions/v2";
import {
  getPublicMediaUrl,
  generateLinkCard,
  httpRequest,
  joinLines,
} from "./utils.js";
import { Provider } from "./provider.js";

export class Tumblr extends Provider {
  /**
   * @constructor
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
   * @param {{ text:string, title:string, message:string, link:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, title, message, link, files }) {
    const params = await this.getParams();

    if (params.err) {
      return params;
    }

    const { accessToken, blogId } = params.data;

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
      const { data } = await generateLinkCard(link || text);
      if (data) {
        const url = data.uri;
        body = JSON.stringify({
          content: [
            {
              type: "text",
              text: joinLines(text?.replace(url, ""), title, message),
            },
            { type: "link", url },
          ],
        });
      } else {
        body = JSON.stringify({
          content: [
            { type: "text", text: joinLines(text, title, message, link) },
          ],
        });
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
      return { err };
    }

    return {};
  }

  /**
   * Refresh access token
   *
   * @returns {Promise<{err: undefined|Error}>}
   */
  async refreshAccessToken() {
    const params = await this.getParams();

    if (params.err) {
      return params;
    }

    const { clientId, clientSecret, accessToken, refreshToken, expiredAt } =
      params.data;

    if (expiredAt.toDate() > new Date(new Date().getTime() + 60 * 1000)) {
      return {};
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
      return { err: oauthResp.err };
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
      return updated;
    }

    return {};
  }

  /**
   * Set access token
   *
   * @param {{code:string}} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async setAccessToken({ code }) {
    logger.log(JSON.stringify({ code }));

    if (!code || code === "error") {
      return { err: new Error(`invalid code: '${code}'`) };
    }

    const params = await this.getParams();

    if (params.err) {
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
      return { err: oauthResp.err };
    }

    const oauthData = await oauthResp.data.json();
    logger.log(JSON.stringify(oauthData));

    if (!oauthData.access_token) {
      return { err: new Error("Failed to get new access_token") };
    }

    const updated = await this.updateParams({
      accessToken: oauthData.access_token,
      refreshToken: oauthData.refresh_token ?? undefined,
      expiredAt: oauthData.expires_in
        ? new Date(new Date().getTime() + oauthData.expires_in * 1000)
        : undefined,
    });

    if (updated.err) {
      return updated;
    }

    return {};
  }
}
