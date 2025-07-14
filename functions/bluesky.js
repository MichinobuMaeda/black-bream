import { logger } from "firebase-functions/v2";
import { CredentialSession, Agent } from "@atproto/api";
import { Provider } from "./provider.js";
import {
  generateLinkCard,
  getMimeTypes,
  getMediaAsBlob,
  reduceImageSize,
  httpRequest,
  joinLines,
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
   * @param {CredentialSession} session
   * @param {string} identifier
   * @param {string} password
   * @returns {Promise<{err: undefined|Error, data: Agent|undefined}>}
   */
  async login(session, identifier, password) {
    return session
      .login({ identifier, password })
      .then(() => ({ data: new Agent(session) }))
      .catch((err) => ({ err }));
  }

  /**
   * Upload image
   *
   * @param {Agent} agent
   * @param {string} id
   * @param {string} file
   * @returns {Promise<{err: undefined|Error, data: Buffer|undefined}>}
   */
  async uploadImage(agent, id, file) {
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
   * @param {Agent} agent
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
   * @param {Agent} agent
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
   * @param {Agent} agent
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
   * @param {{ text:string, title:string, message:string, link:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, title, message, link, files }) {
    return this.getParams().then(({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ service, identifier, password }) =>
            this.login(
              new CredentialSession(new URL(service)),
              identifier,
              password,
            ).then(({ err, data }) =>
              err
                ? { err }
                : {
                    then: (fn) =>
                      files?.length
                        ? this.uploadImage(data, id, files[0]).then(
                            ({ err, data }) =>
                              err
                                ? { err }
                                : fn({
                                    $type: "app.bsky.embed.images",
                                    images: [
                                      {
                                        alt: joinLines(
                                          text,
                                          title,
                                          message,
                                        ).substring(0, 100),
                                        image: data,
                                      },
                                    ],
                                  }),
                          )
                        : this.generateExternal(
                            data,
                            link?.trim() || text?.trim(),
                          ).then(({ data }) =>
                            data
                              ? fn({
                                  $type: "app.bsky.embed.external",
                                  external: data,
                                })
                              : fn(undefined),
                          ),
                  }.then((embed) =>
                    this.requestPost(
                      data,
                      joinLines(
                        embed?.external?.uri && text
                          ? text.replace(embed?.external?.uri, "")
                          : text,
                        title,
                        message,
                        embed?.external?.uri ? undefined : link,
                      ),
                      embed,
                    ),
                  ),
            ),
          ),
    );
  }
}
