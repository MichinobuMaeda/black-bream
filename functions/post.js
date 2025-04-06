const { logger } = require("firebase-functions/v2");

const { getDoc, updateDoc } = require("./utils.js");

const { Twitter } = require("./twitter.js");
const { Mastodon } = require("./mastodon.js");
const { Misskey } = require("./misskey.js");
const { Tumblr } = require("./tumblr.js");
const { Bluesky } = require("./bluesky.js");
const { Threads } = require("./threads.js");
const { Instagram } = require("./instagram.js");

const providers = [
  Twitter,
  Mastodon,
  Misskey,
  Tumblr,
  Bluesky,
  Threads,
  Instagram,
];

/**
 * Post
 */
class Post {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   * @param {FirebaseFirestore.QueryDocumentSnapshot|{id:string, target:string}} data
   */
  constructor(db, bucket, data) {
    /** @type {FirebaseFirestore.Firestore} */
    this.db = db;
    /** @type {import("@google-cloud/storage").Bucket} */
    this.bucket = bucket;
    const { id, ref } = data;
    /** @type {FirebaseFirestore.DocumentReference} */
    this.ref = ref || db.collection("posts").doc(id);
    /** @type {Object} */
    this.data = data.data instanceof Function ? { id, ...data.data() } : data;
  }

  /**
   * Create posts
   *
   * @param {Object} queue
   * @returns {Promise<{err: undefined|string, data: string|undefined}>}
   */
  async createPosts(queue) {
    const delay = 9 * 1000;
    const { id, targets, scheduledFor } = this.data;
    logger.info(`Enqueue posts: ${id}`);

    let scheduleTime = new Date(
      Math.max(scheduledFor.toDate().getTime(), new Date().getTime()),
    );

    Object.keys(targets).forEach((target, index) => {
      targets[target] = {
        scheduleTime: new Date(scheduleTime.getTime() + delay * (index + 1)),
      };
    });

    await Promise.all(
      Object.entries(targets).map(async ([target, params]) =>
        queue
          .enqueue(
            { id, target },
            {
              scheduleTime: params.scheduleTime,
              id: `${id}-${target}`,
            },
          )
          .then(() => {
            params.status = "enqueued";
            params.enqueuedAt = new Date();
            params.updatedAt = new Date();
            params.deletedAt = null;
          })
          .catch((e) => {
            logger.error(e);
            params.status = "failed";
            params.err = e.toString();
            params.enqueuedAt = null;
            params.updatedAt = new Date();
            params.deletedAt = null;
          }),
      ),
    );

    const updated = await updateDoc(this.ref, {
      status: "enqueued",
      targets,
      updatedAt: new Date(),
      deletedAt: null,
    });

    if (updated.err) {
      return updated;
    }

    return { err: undefined, data: "enqueued" };
  }

  /**
   * Delete posts
   *
   * @param {Object} queue
   * @returns {Promise<err: undefined|string, data: string|undefined>}
   */
  async deletePosts(queue) {
    const { id, targets } = this.data;
    logger.info(`Delete posts: ${id}`);

    await Promise.all(
      Object.entries(targets).map(async ([target, params]) =>
        queue
          .delete(`${id}-${target}`)
          .then(() => {
            params.status = "deleted";
            params.deletedAt = new Date();
            params.updatedAt = new Date();
          })
          .catch((e) => {
            logger.error(e);
            params.err = e.toString();
            params.updatedAt = new Date();
          }),
      ),
    );

    const updated = await updateDoc(this.ref, {
      status: "deleted",
      targets,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    if (updated.err) {
      return updated;
    }

    return { err: undefined, data: "deleted" };
  }

  /**
   * Set error status for post
   *
   * @param {string} err
   * @returns {Promise<{err: undefined|string}>}
   */
  async setPostStatusError(err) {
    const { target } = this.data;
    logger.error(`${target}: ${err}`);

    const updated = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: {
        status: "failed",
        err,
        updatedAt: new Date(),
      },
      updatedAt: new Date(),
    });

    if (updated.err) {
      logger.error(updated.err);
      return { err: updated.err };
    }

    return { err };
  }

  /**
   * Get post data
   *
   * @returns {Promise<{err: undefined|string, data: object|undefined}>}
   */
  async getPostData() {
    const doc = await getDoc(this.ref);

    if (doc.err) {
      return { err: `Failed to get posts/${this.ref.id}: ${doc.err}` };
    }

    if (!doc.data.exists) {
      return { err: `Not found: posts/${this.ref.id}` };
    }

    if (doc.data.get("deletedAt")) {
      return { err: `Already deleted: posts/${this.ref.id}` };
    }

    return { data: doc.data.data() };
  }

  /**
   * Verify the status of the target
   *
   * @param {Array} targets
   * @returns {{err: undefined|string}}
   */
  verifyTargetStatus(targets) {
    const { id, target } = this.data;

    if (!targets[target]) {
      return { err: `Not found: ${target} in posts/${id}` };
    }

    const { status, deletedAt } = targets[target];

    if (deletedAt) {
      return { err: `Invalid status: ${target} is deleted` };
    }

    if (status !== "enqueued") {
      return { err: `Invalid status: ${target}.status: ${status}` };
    }

    return { err: undefined };
  }

  /**
   * Post
   *
   * @returns {Promise<{err: undefined|string}>}
   */
  async post() {
    const { id, target } = this.data;

    logger.info(`Task: ${id} ${target}`);

    const postData = await this.getPostData();

    if (postData.err) {
      logger.error(postData.err);
      return { err: postData.err };
    }

    const { targets, ...data } = postData.data;

    const verified = this.verifyTargetStatus(targets);

    if (verified.err) {
      return this.setPostStatusError(verified.err);
    }

    const provider = providers
      .map((Provider) => new Provider(this.db, this.bucket))
      .find((provider) => provider.id === target);

    if (!provider) {
      const err = `Unsupported target: ${target}`;
      return this.setPostStatusError(err);
    }

    const posting = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: { status: "posting", updatedAt: new Date() },
      updatedAt: new Date(),
    });

    if (posting.err) {
      const err = `Failed to set posing status: ${posting.err}`;
      return this.setPostStatusError(err);
    }

    const refreshed = await provider.refreshAccessToken();

    if (refreshed.err) {
      return this.setPostStatusError(`${target}: ${refreshed.err}`);
    }

    let posted = await provider.post(id, data);

    if (posted.err) {
      return this.setPostStatusError(`${target}: ${posted.err}`);
    }

    const completed = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: { status: "completed", updatedAt: new Date() },
      updatedAt: new Date(),
    });

    if (completed.err) {
      const err = `Failed to set completed status: ${completed.err}`;
      return this.setPostStatusError(err);
    }

    return { err: undefined, data: "posting" };
  }

  /**
   * Check completed posts
   *
   * @returns {Promise<{err: undefined|string, data: string|undefined}>}
   */
  async checkCompleted() {
    const { targets } = this.data;
    const ended = ["completed", "failed"];

    if (Object.values(targets).some((t) => !ended.includes(t.status))) {
      return { err: undefined, data: undefined };
    }

    const status = Object.values(targets).some((t) => t.status === "failed")
      ? "failed"
      : "completed";

    const updated = await updateDoc(this.ref, {
      status,
      updatedAt: new Date(),
    });

    if (updated.err) {
      logger.error(updated.err);
      return updated;
    }

    return { err: undefined, data: status };
  }
}

module.exports = { Post };
