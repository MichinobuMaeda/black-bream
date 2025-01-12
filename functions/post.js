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
const post = async (db, { id, service, text }) => {
  try {
    info(`Task dispatched: ${id} ${service} ${text.substring(0, 20)}`);
    const ts = new Date();
    await db
      .collection("posts")
      .doc(id)
      .update({ status: "posted", [`posted.${service}`]: ts, updatedAt: ts });
    return { err: undefined, data: "posted" };
  } catch (e) {
    error(e);
    return { err: e.code ?? e.toString(), data: undefined };
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
    const { services, scheduledFor, ...content } = data.data();
    info(`Enqueue posts: ${id}`);
    const requests = [];
    const taskIds = [];
    let scheduleTime = new Date(
      Math.max(scheduledFor.toDate().getTime(), new Date().getTime()),
    );
    services.forEach((service) => {
      scheduleTime = new Date(scheduleTime.getTime() + 60 * 1000);
      const taskId = `${id}-${service}`;
      taskIds.push(taskId);
      requests.push(
        queue.enqueue(
          { id, service, ...content },
          { scheduleTime, id: taskId },
        ),
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

module.exports = {
  post,
  getQueueName,
  createPosts,
  deletePosts,
};
