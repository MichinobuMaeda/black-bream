import { logger } from "firebase-functions/v2";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getDoc, updateDoc } from "./utils.js";
import { Twitter } from "./twitter.js";
import { Mastodon } from "./mastodon.js";
import { Misskey } from "./misskey.js";
import { Tumblr } from "./tumblr.js";
import { Bluesky } from "./bluesky.js";
import { Threads } from "./threads.js";
import { Instagram } from "./instagram.js";
import { WordPress } from "./wordpress.js";
import { nanoid } from "nanoid";

const providers = [
  Twitter,
  Mastodon,
  Misskey,
  Tumblr,
  Bluesky,
  Threads,
  Instagram,
  WordPress,
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
   * Generate the schedule time for posts
   * @returns {number} milliseconds
   */
  generateScheduleTime() {
    return Timestamp.fromMillis(
      Math.max(
        Timestamp.now().toMillis(),
        this.data.scheduledFor?.toMillis() || Timestamp.now().toMillis(),
        ...Object.values(this.data.targets || {})
          .filter((params) => params.scheduleTime)
          .map((params) => params.scheduleTime.toMillis()),
      ) +
        9 * 1000,
    );
  }

  /**
   * Create posts
   *
   * @param {Object} queue
   * @returns {Promise<{err: undefined|Error, data: string|undefined}>}
   */
  async createPosts(queue) {
    const { id, scheduledFor, targets } = this.data;
    if (!scheduledFor) {
      return { err: new Error("scheduledFor is required") };
    }

    const conf = await this.db.collection("service").doc("conf").get();
    const queuingThresholdDays = Number(
      conf.get("queuingThresholdDays")?.queuingThresholdDays || 3,
    );

    if (
      Timestamp.now().toMillis() + queuingThresholdDays * 24 * 3600 * 1000 <
      scheduledFor.toMillis()
    ) {
      return { warn: "scheduledFor is too far in the future" };
    }
    logger.info(`Enqueue posts: ${id}`);

    Object.keys(targets).forEach((target) => {
      targets[target] = {
        scheduleTime: this.generateScheduleTime(),
        queueId: nanoid(),
      };
    });

    await Promise.all(
      Object.entries(targets).map(async ([target, params]) =>
        queue
          .enqueue(
            { id, target },
            {
              scheduleTime: params.scheduleTime.toDate(),
              id: params.queueId,
            },
          )
          .then(() => {
            params.status = "enqueued";
            params.enqueuedAt = FieldValue.serverTimestamp();
            params.updatedAt = FieldValue.serverTimestamp();
            params.deletedAt = null;
          })
          .catch((err) => {
            logger.error(err);
            params.status = "failed";
            params.err = err.message;
            params.enqueuedAt = null;
            params.updatedAt = FieldValue.serverTimestamp();
            params.deletedAt = null;
          }),
      ),
    );

    const updated = await updateDoc(this.ref, {
      status: "enqueued",
      targets,
      updatedAt: FieldValue.serverTimestamp(),
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
      Object.values(targets).map(async (params) =>
        queue
          .delete(params.queueId)
          .then(() => {
            params.status = "deleted";
            params.deletedAt = FieldValue.serverTimestamp();
            params.updatedAt = FieldValue.serverTimestamp();
          })
          .catch((err) => {
            logger.error(err);
            params.err = err.message;
            params.updatedAt = FieldValue.serverTimestamp();
          }),
      ),
    );

    const updated = await updateDoc(this.ref, {
      status: "deleted",
      targets,
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: FieldValue.serverTimestamp(),
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
        err: `${err}`,
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
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

    if (status === "completed") {
      return {
        data: status,
        warn: new Error(`Invalid status: ${target}.status: ${status}`),
      };
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

    if (verified.warn) {
      return { data: verified.data, warn: `${verified.warn}` };
    }

    this.provider = providers
      .map((Provider) => new Provider(this.db, this.bucket))
      .find((provider) => provider.id === target);

    if (!this.provider) {
      return this.setPostStatusError(
        new Error(`Unsupported target: ${target}`),
      );
    }

    const posting = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: {
        status: "posting",
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (posting.err) {
      return this.setPostStatusError(posting.err);
    }

    const refreshed = await this.provider.refreshAccessToken();

    if (refreshed.err) {
      return this.setPostStatusError(refreshed.err);
    }

    let posted = await this.provider.post(id, data);

    if (posted.err) {
      return this.setPostStatusError(posted.err);
    }

    const completed = await updateDoc(this.ref, {
      status: "posting",
      [`targets.${target}`]: {
        status: "completed",
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
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
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (updated.err) {
      return updated;
    }

    return { data: status };
  }
}

export const postAll = async (db, bucket, queue) =>
  db
    .collection("posts")
    .where("status", "==", "requested")
    .get()
    .then((snapshot) =>
      Promise.all(
        snapshot.docs.map((doc) =>
          new Post(db, bucket, doc).createPosts(queue),
        ),
      ).then((results) => {
        const errors = results
          .filter((result) => result.err)
          .map((result) => result.err);
        return errors.length ? { err: JSON.stringify(errors) } : {};
      }),
    );
