import { logger } from "firebase-functions/v2";
import { getMimeTypes, getMediaAsBlob, sleep, httpRequest } from "./utils.js";
import { Provider } from "./provider.js";

export class Twitter extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "twitter";
  }

  /**
   * Upload image
   *
   * @param {string} accessToken
   * @param {string} id
   * @param {string} file
   * @returns Promise<{err: undefined|Error, data: string|undefined}>
   */
  async uploadImage(accessToken, id, file) {
    const timeout = Number(process.env.IMAGE_UPLOAD_TIMEOUT || 5);

    const blob = await getMediaAsBlob(this.bucket, id, file);

    if (blob.err) {
      return blob;
    }

    const form = new FormData();
    form.append("media_category", "tweet_image");
    form.append("media_type", getMimeTypes(file));
    form.append("media", blob.data, file);
    logger.info(
      `twitter post media: ${file} ${getMimeTypes(file)} ${blob.data.size} bytes`,
    );

    const resp = await httpRequest("https://api.twitter.com/2/media/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (resp.err) {
      const message = await resp.data.text();
      return { err: `${resp.err} ${message}` };
    }

    const json = await resp.data.json();
    logger.info(
      `twitter post media: ${resp.data.status} ${JSON.stringify(json.data)}`,
    );

    if (
      json.data.processing_info &&
      json.data.processing_info.state === "in_progress" &&
      json.data.processing_info.check_after_secs
    ) {
      const wait = Math.min(
        json.data.processing_info.check_after_secs,
        timeout * timeout,
      );
      logger.info(`twitter wait media upload: ${wait} sec.`);
      await new sleep(wait);
    }

    return { data: json.data };
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, files }) {
    const params = await this.getParams();

    if (params.err) {
      return params;
    }

    const { accessToken } = params.data;

    const media_ids = [];

    if (files?.length) {
      const image = await this.uploadImage(accessToken, id, files[0]);

      if (image.err) {
        return image;
      }
      media_ids.push(image.data.id);
    }

    text = text.trim();

    const resp = await httpRequest("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(
        media_ids.length ? { text, media: { media_ids } } : { text },
      ),
    });

    if (resp.err) {
      return { err: resp.err };
    }

    return { err: undefined };
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

    const { clientId, clientSecret, refreshToken, expiredAt } = params.data;

    if (expiredAt.toDate() > new Date(new Date().getTime() + 60 * 1000)) {
      return {};
    }

    logger.info(JSON.stringify(params));

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("refresh_token", refreshToken);
    formData.append("grant_type", "refresh_token");

    let resp = await httpRequest("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: formData,
    });

    if (resp.err) {
      return { err: resp.err };
    }

    const oauthData = await resp.data.json();

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

    return { data: oauthData.access_token };
  }

  /**
   * Set access token
   *
   * @param {{status:string, code:string, challenge:string}} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async setAccessToken({ status, code, challenge }) {
    logger.log(JSON.stringify({ status, code, challenge }));

    if (!status || status === "ng") {
      return { err: new Error(`invalid status: ${status}`) };
    }

    if (!code || code === "error") {
      return { err: new Error(`invalid code: ${code}`) };
    }

    if (!challenge) {
      return { err: new Error(`invalid challenge: ${challenge}`) };
    }

    const params = await this.getParams();

    if (params.err) {
      return params;
    }

    const { clientId, clientSecret, callBackUrl } = params.data;

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("code", code);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", callBackUrl);
    formData.append("code_verifier", challenge);

    let resp = await httpRequest("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: formData,
    });

    if (resp.err) {
      return { err: resp.err };
    }

    const oauthData = await resp.data.json();
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
