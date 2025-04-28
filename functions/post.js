import { logger } from "firebase-functions/v2";
import { getDoc, updateDoc } from "./utils.js";
import { Twitter } from "./twitter.js";
import { Mastodon } from "./mastodon.js";
import { Misskey } from "./misskey.js";
import { Tumblr } from "./tumblr.js";
import { Bluesky } from "./bluesky.js";
import { Threads } from "./threads.js";
import { Instagram } from "./instagram.js";

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
export class Post {
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
   * @returns {Promise<{err: undefined|Error, data: string|undefined}>}
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
          .catch((err) => {
            logger.error(err);
            params.status = "failed";
            params.err = err.message;
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

    return { data: "enqueued" };
  }

  /**
   * Delete posts
   *
   * @param {Object} queue
   * @returns {Promise<err: undefined|Error, data: string|undefined>}
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
          .catch((err) => {
            logger.error(err);
            params.err = err.message;
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

    return { data: "deleted" };
  }

  /**
   * Set error status for post
   *
   * @param {string} err
   * @returns {Promise<{err: undefined|Error}>}
   */
  async setPostStatusError(err) {
    const { target } = this.data;

    const updated = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: {
        status: "failed",
        err: err.message,
        updatedAt: new Date(),
      },
      updatedAt: new Date(),
    });

    if (updated.err) {
      return updated;
    }

    return { err };
  }

  /**
   * Get post data
   *
   * @returns {Promise<{err: undefined|Error, data: object|undefined}>}
   */
  async getPostData() {
    const doc = await getDoc(this.ref);

    if (doc.err) {
      return doc;
    }

    if (!doc.data.exists) {
      return { err: new Error(`Not found: posts/${this.ref.id}`) };
    }

    if (doc.data.get("deletedAt")) {
      return { err: new Error(`Already deleted: posts/${this.ref.id}`) };
    }

    return { data: doc.data.data() };
  }

  /**
   * Verify the status of the target
   *
   * @param {Array} targets
   * @returns {{err: undefined|Error}}
   */
  verifyTargetStatus(targets) {
    const { id, target } = this.data;

    if (!targets[target]) {
      return { err: new Error(`Not found: ${target} in posts/${id}`) };
    }

    const { status, deletedAt } = targets[target];

    if (deletedAt) {
      return { err: new Error(`Invalid status: ${target} is deleted`) };
    }

    if (status !== "enqueued") {
      return { err: new Error(`Invalid status: ${target}.status: ${status}`) };
    }

    return {};
  }

  /**
   * Post
   *
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post() {
    const { id, target } = this.data;

    logger.info(`Task: ${id} ${target}`);

    const postData = await this.getPostData();

    if (postData.err) {
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
      return this.setPostStatusError(
        new Error(`Unsupported target: ${target}`),
      );
    }

    const posting = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: { status: "posting", updatedAt: new Date() },
      updatedAt: new Date(),
    });

    if (posting.err) {
      return this.setPostStatusError(posting.err);
    }

    const refreshed = await provider.refreshAccessToken();

    if (refreshed.err) {
      return this.setPostStatusError(refreshed.err);
    }

    let posted = await provider.post(id, data);

    if (posted.err) {
      return this.setPostStatusError(posted.err);
    }

    const completed = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: { status: "completed", updatedAt: new Date() },
      updatedAt: new Date(),
    });

    if (completed.err) {
      return this.setPostStatusError(completed.err);
    }

    return { data: "posting" };
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
      return {};
    }

    const status = Object.values(targets).some((t) => t.status === "failed")
      ? "failed"
      : "completed";

    const updated = await updateDoc(this.ref, {
      status,
      updatedAt: new Date(),
    });

    if (updated.err) {
      return updated;
    }

    return { data: status };
  }
}
