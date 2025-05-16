import { FieldValue } from "firebase-admin/firestore";
import { docRef, getDoc, updateDoc } from "./utils.js";

export class Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    /** @type {string} */
    this.id = "";
    this.db = db;
    this.bucket = bucket;
  }

  /**
   * Get the params of the provider
   *
   * @returns {Promise<{err: undefined|Error}, data>}
   */
  async getParams() {
    return getDoc(docRef(this.db, "service", "auth")).then(({ err, data }) =>
      err
        ? { err }
        : !data.exists
          ? { err: new Error("service/auth not found") }
          : data.get("deletedAt")
            ? { err: new Error("service/auth is deleted") }
            : { then: (fn) => fn(data.get(this.id)) }.then((data) =>
                !data
                  ? { err: new Error(`service/auth/${this.id} not found`) }
                  : data.deletedAt
                    ? { err: new Error(`service/auth/${this.id} is deleted`) }
                    : { data },
              ),
    );
  }

  /**
   * Update the params of the provider
   *
   * @param {Object} data
   * @returns
   */
  async updateParams(data) {
    const update = {};
    Object.entries(data).forEach(([key, value]) => {
      update[`${this.id}.${key}`] = value;
    });
    update[`${this.id}.updatedAt`] = FieldValue.serverTimestamp();

    const updated = await updateDoc(docRef(this.db, "service", "auth"), update);

    if (updated.err) {
      return updated;
    }

    return { err: undefined };
  }

  /**
   * post
   *
   * @param {Object} params
   * @param {string} id
   * @param {{ text:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async post(params, id, { text, files }) {
    return { err: undefined };
  }

  /**
   * Refresh access token
   *
   * @returns {Promise<{err: undefined|string}>}
   */
  async refreshAccessToken() {
    return { err: undefined };
  }

  /**
   * Set access token
   *
   * @param {Object} data
   * @returns {Promise<{err: undefined|string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async setAccessToken(data) {
    return { err: undefined };
  }
}
