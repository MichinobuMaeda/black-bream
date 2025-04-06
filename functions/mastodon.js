import { logger } from "firebase-functions/v2";
import { createHash } from "node:crypto";
import { getMediaAsBlob, httpRequest, sleep } from "./utils.js";
import { Provider } from "./provider.js";

export class Mastodon extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "mastodon";
  }

  /**
   * Wait for media upload
   *
   * @param {string} url
   * @param {string} token
   * @param {array} medias
   * @returns {Promise<{err: undefined|string}>}
   */
  async waitMediaUpload(url, token, medias) {
    const timeout = Number(process.env.IMAGE_UPLOAD_TIMEOUT) || 5;
    await sleep(timeout);

    const getResp = await httpRequest(`${url}/v1/media/${medias[0]}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (getResp.err) {
      return getResp;
    }

    if (getResp.data.status === 206) {
      await sleep(timeout * timeout);
    }

    return { err: undefined };
  }

  /**
   * Get media list
   *
   * @param {string} url
   * @param {string} token
   * @param {string} id
   * @param {array} [files]
   * @returns {Promise<{err: undefined|string, data: array|undefined}>}
   */
  async getMediaList(url, token, id, files = []) {
    if (!files.length) {
      return { data: [] };
    }

    const blob = await getMediaAsBlob(this.bucket, id, files[0]);

    if (blob.err) {
      return blob;
    }

    const form = new FormData();
    form.append("file", blob.data, files[0]);

    const postResp = await httpRequest(`${url}/v2/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (postResp.err) {
      return postResp;
    }

    const medias = [(await postResp.data.json()).id];
    logger.info(`mastodon post media: ${medias[0]}`);

    if (postResp.data.status === 202) {
      const waitResp = await this.waitMediaUpload(url, token, medias);

      if (waitResp.err) {
        return waitResp;
      }
    }

    return { data: medias };
  }

  /**
   * Generate idempotency key for Mastodon post
   * Idempotency keys are stored for up to 1 hour.
   *
   * @param {string} text
   * @param {array} medias
   * @returns {string}
   */
  generateIdempotencyKey(text, medias) {
    const hash = createHash("sha256");
    hash.update(text);
    medias.forEach((media) => {
      hash.update(media);
    });
    return hash.digest("hex");
  }

  /**
   * Request to post
   *
   * @param {string} url
   * @param {string} token
   * @param {string} text
   * @param {array} medias
   * @returns {Promise<{err: undefined|string}>}
   */
  async requestPost(url, token, text, medias) {
    text = text.trim();
    const postResp = await httpRequest(`${url}/v1/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": this.generateIdempotencyKey(text, medias),
      },
      body: JSON.stringify({
        status: text,
        sensitive: false,
        visibility: "public",
        language: "ja",
        ...(medias.length && { media_ids: medias }),
      }),
    });

    return { err: postResp.err };
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

    const { url, token } = params.data;

    const mediaResp = await this.getMediaList(url, token, id, files);

    if (mediaResp.err) {
      return mediaResp;
    }

    return this.requestPost(url, token, text, mediaResp.data);
  }
}
