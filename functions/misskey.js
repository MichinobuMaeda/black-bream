import { logger } from "firebase-functions/v2";
import { getMediaAsBlob, httpRequest } from "./utils.js";
import { Provider } from "./provider.js";

export class Misskey extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "misskey";
  }

  /**
   * Get media list
   *
   * @param {string} url
   * @param {string} token
   * @param {string} id
   * @param {array|undefined} files
   * @returns {Promise<{err: undefined|string, data: array|undefined}>}
   */
  async getMediaList(url, token, id, files) {
    if (!files?.length) {
      return { err: undefined, data: [] };
    }

    const blob = await getMediaAsBlob(this.bucket, id, files[0]);

    if (blob.err) {
      return blob;
    }

    const form = new FormData();
    form.append("file", blob.data, files[0]);
    form.append("name", files[0]);
    form.append("isSensitive", false);

    const { err, data } = await httpRequest(`${url}/drive/files/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (err) {
      return { err };
    }

    const mediaId = (await data.json()).id;
    logger.info(`misskey post media: ${mediaId}`);

    return { err: undefined, data: [mediaId] };
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

    const { url, token } = params.data;

    const medias = await this.getMediaList(url, token, id, files);

    if (medias.err) {
      return medias;
    }

    text = text.trim();
    const visibility = "public";
    const json = medias.data.length
      ? { visibility, text, mediaIds: medias.data }
      : { visibility, text };

    const { err } = await httpRequest(`${url}/notes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(json),
    });

    return { err };
  }
}
