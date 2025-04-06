const { logger } = require("firebase-functions/v2");
const { BskyAgent } = require("@atproto/api");
const { Provider } = require("./provider.js");
const {
  generateLinkCard,
  getMimeTypes,
  getMediaAsBlob,
  reduceImageSize,
  httpRequest,
} = require("./utils");

const langs = ["ja"];

class Bluesky extends Provider {
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
   * @returns {Promise<{err: undefined|string}>}
   */
  async login(agent, identifier, password) {
    return agent
      .login({ identifier, password })
      .then(() => ({ err: undefined }))
      .catch((e) => ({ err: e.toString() }));
  }

  /**
   * Upload image
   *
   * @param {BskyAgent} agent
   * @param {string} id
   * @param {string} text
   * @param {string} file
   * @returns
   */
  async uploadImage(agent, id, text, file) {
    const blob = await getMediaAsBlob(this.bucket, id, file);

    if (blob.err) {
      return blob;
    }

    return agent
      .uploadBlob(blob.data, { encoding: getMimeTypes(file) })
      .then(({ data }) => ({ data: data.blob }))
      .catch((e) => ({ err: e.toString() }));
  }

  /**
   * Upload thumb image
   *
   * @param {BskyAgent} agent
   * @param {string} thumbUrl
   * @returns {Promise<{data: Buffer|undefined}>}
   */
  async uploadThumb(agent, thumbUrl) {
    const image = await httpRequest(thumbUrl);

    if (image.err) {
      logger.warn(`bluesky: uploadThumb httpRequest ${image.err}`);
      return {};
    }

    const reduced = await reduceImageSize(await image.data.bytes());

    if (reduced.err) {
      logger.warn(`bluesky: uploadThumb reduceImageSize ${reduced.err}`);
      return {};
    }

    return agent
      .uploadBlob(reduced.data, {
        encoding: getMimeTypes(thumbUrl, image.data.headers),
      })
      .then(({ data }) => ({ data: data.blob }))
      .catch((e) => {
        logger.warn(`bluesky: uploadThumb uploadBlob ${e.toString()}`);
        return {};
      });
  }

  /**
   * Generate external
   *
   * @param {BskyAgent} agent
   * @param {string} text
   * @returns {Promise<{data: undefined|{uri:string, title:string, description:string, thumb:Buffer|undefined}}>}
   */
  async generateExternal(agent, text) {
    const card = await generateLinkCard(text);

    if (!card.data) {
      return { data: undefined };
    }

    const { uri, title, description, thumbUrl } = card.data;

    if (thumbUrl) {
      const { data } = await this.uploadThumb(agent, thumbUrl);
      return { data: { uri, title, description, thumb: data } };
    } else {
      return { data: { uri, title, description } };
    }
  }

  /**
   * Request post
   *
   * @param {BskyAgent} agent
   * @param {string} text
   * @param {Object} embed
   * @returns
   */
  async requestPost(agent, text, embed) {
    return agent
      .post({ text, langs, embed })
      .then(() => ({ err: undefined }))
      .catch((e) => ({ err: e.toString() }));
  }

  /**
   * post
   *
   * @param {string } id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|string}>}
   */
  async post(id, { text, files }) {
    const params = await this.getParams();

    if (params.err) {
      logger.error(params.err);
      return params;
    }

    const { service, identifier, password } = params.data;

    let embed = undefined;
    const agent = new BskyAgent({ service });
    const login = await this.login(agent, identifier, password);

    if (login.err) {
      return login;
    }

    if (files?.length) {
      const image = await this.uploadImage(agent, id, text, files[0]);

      if (image.err) {
        return image;
      }

      embed = {
        $type: "app.bsky.embed.images",
        images: [
          {
            alt: text.substring(0, 100),
            image: image.data,
          },
        ],
      };
    }

    if (!embed) {
      const external = await this.generateExternal(agent, text);

      if (external.data) {
        embed = {
          $type: "app.bsky.embed.external",
          external: external.data,
        };
      }
    }

    return this.requestPost(agent, text, embed);
  }
}

module.exports = { Bluesky };
