const { logger } = require("firebase-functions/v2");

const twitter = require("./twitter.js");
const mastodon = require("./mastodon.js");
const misskey = require("./misskey.js");
const bluesky = require("./bluesky.js");
const threads = require("./threads.js");
const instagram = require("./instagram.js");

/**
 * Get queue name from location, project, and function name
 *
 * @param {string} location
 * @param {string} project
 * @param {string} functionName
 * @returns {string}
 */
const getQueueName = (project, location, functionName) =>
  `projects/${project}/locations/${location}/functions/${functionName}`;

/**
 * Create posts
 *
 * @param {object} queue
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const createPosts = async (queue, data) => {
  try {
    const delay = 11 * 1000;
    const { id } = data;
    const { targets, scheduledFor } = data.data();
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
      Object.entries(targets).map(async ([target, params]) => {
        try {
          await queue.enqueue(
            { id, target },
            {
              scheduleTime: params.scheduleTime,
              id: `${id}-${target}`,
            },
          );
          params.status = "enqueued";
          params.enqueuedAt = new Date();
          params.updatedAt = new Date();
          params.deletedAt = null;
        } catch (e) {
          logger.error(e);
          params.status = "failed";
          params.err = e.toString();
          params.enqueuedAt = null;
          params.updatedAt = new Date();
          params.deletedAt = null;
        }
      }),
    );

    await data.ref.update({
      status: "enqueued",
      targets,
      updatedAt: new Date(),
      deletedAt: null,
    });

    return { err: undefined, data: "enqueued" };
  } catch (e) {
    logger.error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

/**
 * Delete posts
 *
 * @param {object} queue
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const deletePosts = async (queue, data) => {
  try {
    const { id } = data;
    const { targets } = data.data();
    logger.info(`Delete posts: ${id}`);

    await Promise.all(
      Object.entries(targets).map(async ([target, params]) => {
        try {
          await queue.delete(`${id}-${target}`);
          params.status = "deleted";
          params.deletedAt = new Date();
          params.updatedAt = new Date();
        } catch (e) {
          logger.error(e);
          params.err = e.toString();
          params.updatedAt = new Date();
        }
      }),
    );

    await data.ref.update({
      status: "deleted",
      targets,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    return { err: undefined, data: "deleted" };
  } catch (e) {
    logger.error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

/**
 * Post
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Bucket} bucket
 * @param {object} data
 */
const post = async (db, bucket, { id, target }) => {
  logger.info(`Task: ${id} ${target}`);
  const postRef = db.collection("posts").doc(id);

  const statusError = async (err) => {
    logger.error(err);

    try {
      await postRef.update({
        status: "posting",
        [`targets.${target}`]: { status: "failed", err, updatedAt: new Date() },
        updatedAt: new Date(),
      });
    } catch (e) {
      logger.error(e);
    }
    return { err, data: undefined };
  };

  try {
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      const err = `Not found: posts/${id}`;
      logger.error(err);
      return { err, data: undefined };
    }
    if (postSnap.get("deletedAt")) {
      return statusError(`Deleted: posts/${id}`);
    }

    const { status, deletedAt } = postSnap.get("targets")[target];

    if (status !== "enqueued") {
      return statusError(`Invalid status: ${target}.status: ${status}`);
    }

    if (deletedAt) {
      return statusError(`Invalid status: ${target} is deleted`);
    }

    const auth = await db.collection("service").doc("auth").get();

    if (!auth.exists) {
      return statusError("Not found: service/auth");
    }
    if (auth.get("deletedAt")) {
      return statusError(`Deleted: service/auth`);
    }

    const params = auth.get(target);

    if (!params) {
      return statusError(`Not found: ${target} in service/auth`);
    }
    if (params.deletedAt) {
      return statusError(`Deleted: ${target} in service/auth`);
    }

    let ret = null;

    switch (target) {
      case "twitter":
        ret = await twitter.post(db, bucket, params, id, postSnap.data());
        break;
      case "mastodon":
        ret = await mastodon.post(bucket, params, id, postSnap.data());
        break;
      case "misskey":
        ret = await misskey.post(bucket, params, id, postSnap.data());
        break;
      case "bluesky":
        ret = await bluesky.post(bucket, params, id, postSnap.data());
        break;
      case "threads":
        ret = await threads.post(bucket, params, id, postSnap.data());
        break;
      case "instagram":
        ret = await instagram.post(bucket, params, id, postSnap.data());
        break;
      default:
        return statusError(`Unsupported target: ${target}`);
    }

    if (ret?.err) {
      return statusError(`${target}: ${ret?.err}`);
    }

    await postRef.update({
      status: "posting",
      [`targets.${target}`]: { status: "completed", updatedAt: new Date() },
      updatedAt: new Date(),
    });

    return { err: undefined, data: "posting" };
  } catch (e) {
    return statusError(e.code ?? e.toString());
  }
};

/**
 * Check completed posts
 *
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const checkCompleted = async (data) => {
  try {
    let { status, targets } = data.data();

    if (
      Object.values(targets).every((target) =>
        ["completed", "failed"].includes(target.status),
      )
    ) {
      status = Object.values(targets).some(
        (target) => target.status === "failed",
      )
        ? "failed"
        : "completed";
      await data.ref.update({
        status,
        updatedAt: new Date(),
      });
    }

    return { err: undefined, data: status };
  } catch (e) {
    logger.error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

module.exports = {
  getQueueName,
  createPosts,
  deletePosts,
  post,
  checkCompleted,
};
