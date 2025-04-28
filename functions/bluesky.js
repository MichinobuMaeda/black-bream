import { logger } from "firebase-functions/v2";
import { BskyAgent } from "@atproto/api";
import { Provider } from "./provider.js";
import {
  generateLinkCard,
  getMimeTypes,
  getMediaAsBlob,
  reduceImageSize,
  httpRequest,
} from "./utils.js";

const langs = ["ja"];

export class Bluesky extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "bluesky";
  }

  /**
   * Login
   *
   * @param {BskyAgent} agent
   * @param {string} identifier
   * @param {string} password
   * @returns {Promise<{err: undefined|Error, data: BskyAgent|undefined}>}
   */
  async login(agent, identifier, password) {
    return agent
      .login({ identifier, password })
      .then(() => ({ data: agent }))
      .catch((err) => ({ err }));
  }

  /**
   * Upload image
   *
   * @param {BskyAgent} agent
   * @param {string} id
   * @param {string} text
   * @param {string} file
   * @returns {Promise<{err: undefined|Error, data: Buffer|undefined}>}
   */
  async uploadImage(agent, id, text, file) {
    return getMediaAsBlob(this.bucket, id, file).then(({ err, data }) =>
      err
        ? { err }
        : agent
            .uploadBlob(data, { encoding: getMimeTypes(file) })
            .then(({ data }) => ({ data: data.blob }))
            .catch((err) => ({ err })),
    );
  }

  warn(message) {
    logger.warn(message);
    return {};
  }

  /**
   * Upload thumb image
   *
   * @param {BskyAgent} agent
   * @param {string} thumbUrl
   * @returns {Promise<{data: Buffer|undefined}>}
   */
  async uploadThumb(agent, thumbUrl) {
    return httpRequest(thumbUrl).then(({ err, data }) =>
      err
        ? this.warn(`bluesky: uploadThumb httpRequest ${err}`)
        : { then: (fn) => fn(getMimeTypes(thumbUrl, data.headers)) }.then(
            (encoding) =>
              data.bytes().then((bytes) =>
                reduceImageSize(bytes).then(({ err, data }) =>
                  err
                    ? this.warn(`bluesky: uploadThumb reduceImageSize ${err}`)
                    : agent
                        .uploadBlob(data, { encoding })
                        .then(({ data }) => ({ data: data.blob }))
                        .catch((err) =>
                          this.warn(`bluesky: uploadThumb uploadBlob ${err}`),
                        ),
                ),
              ),
          ),
    );
  }

  /**
   * @typedef {Object} LinkCardData
   * @property {string} uri
   * @property {string} title
   * @property {string} description
   * @property {Buffer<ArrayBufferLike>|undefined} thumb
   */

  /**
   * Generate external
   *
   * @param {BskyAgent} agent
   * @param {string} text
   * @returns {Promise<{data: undefined|LinkCardData}>}
   */
  async generateExternal(agent, text) {
    return generateLinkCard(text).then(async ({ err, data }) =>
      err
        ? { err }
        : !data
          ? {}
          : { then: (fn) => fn(data) }.then(
              ({ uri, title, description, thumbUrl }) =>
                thumbUrl
                  ? this.uploadThumb(agent, thumbUrl).then(({ data }) => ({
                      data: { uri, title, description, thumb: data },
                    }))
                  : { data: { uri, title, description } },
            ),
    );
  }

  /**
   * Request post
   *
   * @param {BskyAgent} agent
   * @param {string} text
   * @param {Object} embed
   * @returns {Promise<{err: undefined|Error}>}
   */
  async requestPost(agent, text, embed) {
    return agent
      .post({ text, langs, embed })
      .then(() => ({ err: undefined }))
      .catch((err) => ({ err }));
  }

  /**
   * post
   *
   * @param {string } id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, files }) {
    return this.getParams().then(({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ service, identifier, password }) =>
            this.login(new BskyAgent({ service }), identifier, password).then(
              ({ err, data }) =>
                err
                  ? { err }
                  : {
                      then: (fn) =>
                        files?.length
                          ? this.uploadImage(data, id, text, files[0]).then(
                              ({ err, data }) =>
                                err
                                  ? { err }
                                  : fn({
                                      $type: "app.bsky.embed.images",
                                      images: [
                                        {
                                          alt: text.substring(0, 100),
                                          image: data,
                                        },
                                      ],
                                    }),
                            )
                          : this.generateExternal(data, text).then(
                              ({ data }) =>
                                data
                                  ? fn({
                                      $type: "app.bsky.embed.external",
                                      external: data,
                                    })
                                  : fn(undefined),
                            ),
                    }.then((embed) => this.requestPost(data, text, embed)),
            ),
          ),
    );
  }
}
