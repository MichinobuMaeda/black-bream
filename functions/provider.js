const { getDoc, updateDoc } = require("./utils.js");

class Provider {
  /**
   * Provider constructor
   *
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
   * @returns {Promise<{err: undefined|string}, data>}
   */
  async getParams() {
    const authRef = this.db.collection("service").doc("auth");
    const auth = await getDoc(authRef);

    if (auth.err) {
      return { err: `service/auth ${auth.err}` };
    }

    if (!auth.data.exists) {
      const err = "service/auth not found";
      return { err };
    }

    if (auth.data.get("deletedAt")) {
      const err = "service/auth is deleted";
      return { err };
    }

    const data = auth.data.get(this.id);

    if (!data) {
      const err = `service/auth/${this.id} not found`;
      return { err };
    }

    if (data.deletedAt) {
      const err = `service/auth/${this.id} is deleted`;
      return { err };
    }

    return { err: undefined, data };
  }

  /**
   * Update the params of the provider
   *
   * @param {object} data
   * @returns
   */
  async updateParams(data) {
    const authRef = this.db.collection("service").doc("auth");
    const update = {};
    Object.entries(data).forEach(([key, value]) => {
      update[`${this.id}.${key}`] = value;
    });
    update.updatedAt = new Date();

    const updated = await updateDoc(authRef, update);

    if (updated.err) {
      const err = `service/auth update: ${updated.err}`;
      return { err };
    }

    return { err: undefined };
  }

  /**
   * post
   *
   * @param {object} params
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
   * @param {object} data
   * @returns {Promise<{err: undefined|string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async setAccessToken(data) {
    return { err: undefined };
  }
}

module.exports = { Provider };
