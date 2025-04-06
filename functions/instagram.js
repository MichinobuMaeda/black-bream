import { logger } from "firebase-functions/v2";
import { Provider } from "./provider.js";
import { getPublicMediaUrl, httpRequest } from "./utils.js";

export class Instagram extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "instagram";
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

    const { clientId, accessToken } = params.data;

    if (!files?.length) {
      return { err: "No media files" };
    }

    let uploaded = await httpRequest(
      `https://graph.instagram.com/v22.0/${clientId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: text,
          image_url: getPublicMediaUrl(id, files[0]),
        }),
      },
    );

    if (uploaded.err) {
      const err = `Failed to create container: ${uploaded.err}`;
      logger.error(err);
      return { err };
    }

    const media = await uploaded.data.json();

    logger.info(`Created container: ${media.id}`);

    const posted = await httpRequest(
      `https://graph.instagram.com/v22.0/${clientId}/media_publish`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creation_id: media.id }),
      },
    );

    if (posted.err) {
      const err = `Failed to publish: ${posted.err}`;
      logger.error(err);
      return { err };
    }

    return { err: undefined };
  }
}
