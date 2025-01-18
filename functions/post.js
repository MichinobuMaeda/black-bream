const axios = require("axios");
const { info, error } = require("firebase-functions/logger");

/**
 * Get queue name from location, project, and function name
 *
 * @param {string} location
 * @param {string} project
 * @param {string} functionName
 * @returns
 */
const getQueueName = (project, location, functionName) =>
  `projects/${project}/locations/${location}/functions/${functionName}`;

/**
 * Post
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 */
const post = async (db, { id, target, text }) => {
  const postRef = db.collection("posts").doc(id);

  const statusError = async (err) => {
    error(err);

    await postRef.update({
      status: "posting",
      [`posted.${target}`]: { err, completedAt: undefined },
      updatedAt: new Date(),
    });

    return { err, data: undefined };
  };

  try {
    const post = await postRef.get();

    if (!post.exists) {
      return statusError(`Not found: posts/${id}`);
    }
    if (post.get("deletedAt")) {
      return statusError(`Deleted: posts/${id}`);
    }

    const auth = await db.collection("service").doc("auth").get();

    if (!auth.exists) {
      return statusError("Not found: service/auth");
    }
    if (!auth.get("deletedAt")) {
      return statusError(`Deleted: service/auth`);
    }

    const params = auth.get(target);

    if (!params) {
      return statusError(`Not found: ${target}`);
    }
    if (!params.deletedAt) {
      return statusError(`Deleted: ${target}`);
    }

    let ret;

    switch (target) {
      case "mastodon":
        ret = await axios.post(
          params.url,
          {
            status: post.text,
          },
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${params.token}`,
            },
          },
        );
        break;
      default:
        return statusError(`Not supported: ${target}`);
    }

    if (ret.status !== 200) {
      return statusError(
        postRef,
        `Failed: ${target} ${ret.status} ${ret.statusText}`,
      );
    }

    info(`Task dispatched: ${id} ${target} ${text.substring(0, 20)}`);

    await postRef.update({
      status: "posting",
      [`posted.${target}`]: { err: undefined, completedAt: new Date() },
      updatedAt: new Date(),
    });

    return { err: undefined, data: "posting" };
  } catch (e) {
    return statusError(e.code ?? e.toString());
  }
};

/**
 * Create posts
 *
 * @param {object} queue
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const createPosts = async (queue, data) => {
  try {
    const { id } = data;
    const { targets, scheduledFor, ...content } = data.data();
    info(`Enqueue posts: ${id}`);
    const requests = [];
    const taskIds = [];
    let scheduleTime = new Date(
      Math.max(scheduledFor.toDate().getTime(), new Date().getTime()),
    );
    targets.forEach((target) => {
      scheduleTime = new Date(scheduleTime.getTime() + 60 * 1000);
      const taskId = `${id}-${target}`;
      taskIds.push(taskId);
      requests.push(
        queue.enqueue({ id, target, ...content }, { scheduleTime, id: taskId }),
      );
    });
    await Promise.all(requests);
    await data.ref.update({
      status: "enqueued",
      taskIds,
      updatedAt: new Date(),
    });
    return { err: undefined, data: "enqueued" };
  } catch (e) {
    error(e);
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
    const { taskIds } = data.data();
    info(`Delete posts: ${id}`);
    await Promise.all(taskIds.map((taskId) => queue.delete(taskId)));
    await data.ref.update({
      status: "deleted",
      taskIds,
      updatedAt: new Date(),
    });
    return { err: undefined, data: "deleted" };
  } catch (e) {
    error(e);
    return { err: e.code ?? e.toString(), data: undefined };
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
    const { posted, taskIds } = data.data();
    if (taskIds.length === Object.keys(posted).length) {
      await data.ref.update({
        status: Object.values(posted).some((target) => target.err)
          ? "failed"
          : "completed",
        updatedAt: new Date(),
      });
    }
    return { err: undefined, data: "completed" };
  } catch (e) {
    error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

module.exports = {
  post,
  getQueueName,
  createPosts,
  deletePosts,
  checkCompleted,
};
