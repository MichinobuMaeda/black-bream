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
   * @returns {Promise<{err: undefined|Error}>}
   */
  async waitMediaUpload(url, token, medias) {
    return {
      then: (fn) => fn(Number(process.env.IMAGE_UPLOAD_TIMEOUT) || 5),
    }.then((timeout) =>
      sleep(timeout).then(() =>
        httpRequest(`${url}/v1/media/${medias[0]}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ err, data }) =>
          err
            ? { err }
            : data.status === 206
              ? sleep(timeout * timeout).then(() => ({}))
              : {},
        ),
      ),
    );
  }

  /**
   * Get media list
   *
   * @param {string} url
   * @param {string} token
   * @param {string} id
   * @param {array} [files]
   * @returns {Promise<{err: undefined|Error, data: array|undefined}>}
   */
  async getMediaList(url, token, id, files = []) {
    return !files.length
      ? { data: [] }
      : getMediaAsBlob(this.bucket, id, files[0]).then(({ err, data }) =>
          err
            ? { err }
            : {
                then: (fn) => {
                  const form = new FormData();
                  form.append("file", data, files[0]);
                  return fn(form);
                },
              }.then((form) =>
                httpRequest(`${url}/v2/media`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: form,
                }).then(({ err, data }) =>
                  err
                    ? { err }
                    : { then: (fn) => fn(data.status) }.then((status) =>
                        data
                          .json()
                          .then((json) =>
                            status === 202
                              ? this.waitMediaUpload(url, token, [
                                  json.id,
                                ]).then(({ err }) =>
                                  err ? { err } : { data: [json.id] },
                                )
                              : { data: [json.id] },
                          )
                          .catch((err) => ({ err })),
                      ),
                ),
              ),
        );
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
    return medias
      .reduce(
        (acc, media) => acc.update(media),
        createHash("sha256").update(text),
      )
      .digest("hex");
  }

  /**
   * Request to post
   *
   * @param {string} url
   * @param {string} token
   * @param {string} text
   * @param {array} medias
   * @returns {Promise<{err: undefined|Error}>}
   */
  async requestPost(url, token, text, medias) {
    return httpRequest(`${url}/v1/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": this.generateIdempotencyKey(text.trim(), medias),
      },
      body: JSON.stringify({
        status: text.trim(),
        sensitive: false,
        visibility: "public",
        language: "ja",
        ...(medias.length && { media_ids: medias }),
      }),
    }).then(({ err }) => ({ err }));
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, files }) {
    return this.getParams().then(async ({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ url, token }) =>
            this.getMediaList(url, token, id, files).then(
              async ({ err, data }) =>
                err ? { err } : this.requestPost(url, token, text, data),
            ),
          ),
    );
  }
}
