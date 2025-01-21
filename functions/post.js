const { createHash } = require("node:crypto");
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");
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
 * Create posts
 *
 * @param {object} queue
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const createPosts = async (queue, data) => {
  try {
    const delay = 17 * 1000;
    const { id } = data;
    const { targets, scheduledFor } = data.data();
    info(`Enqueue posts: ${id}`);

    let scheduleTime = new Date(
      Math.max(scheduledFor.toDate().getTime(), new Date().getTime()),
    );

    Object.keys(targets).forEach((target) => {
      targets[target] = {
        scheduleTime: new Date(scheduleTime.getTime() + delay),
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
          error(e);
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
    const { targets } = data.data();
    info(`Delete posts: ${id}`);

    await Promise.all(
      Object.entries(targets).map(async ([target, params]) => {
        try {
          await queue.delete(`${id}-${target}`);
          params.status = "deleted";
          params.deletedAt = new Date();
          params.updatedAt = new Date();
        } catch (e) {
          error(e);
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
    error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

/**
 * Post
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 */
const post = async (db, { id, target }) => {
  const postRef = db.collection("posts").doc(id);

  const statusError = async (err) => {
    error(err);

    try {
      await postRef.update({
        status: "posting",
        [`targets.${target}`]: { status: "failed", err, updatedAt: new Date() },
        updatedAt: new Date(),
      });
    } catch (e) {
      error(e);
    }
    return { err, data: undefined };
  };

  try {
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      const err = `Not found: posts/${id}`;
      error(err);
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

    const { text } = postSnap.data();

    switch (target) {
      case "mastodon":
        try {
          // Mastodon: Idempotency keys are stored for up to 1 hour.
          const hash = createHash("sha256");
          hash.update(text);
          const ret = await axios.post(
            params.url,
            {
              status: text,
              sensitive: "false",
              visibility: "public",
              language: "ja",
            },
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${params.token}`,
                "Idempotency-Key": hash.digest("hex"),
              },
            },
          );

          if (ret.status !== 200) {
            return statusError(
              `Failed: ${target} ${ret.status} ${ret.statusText}`,
            );
          }
        } catch (e) {
          return statusError(`Failed: ${target} ${e}`);
        }
        break;
      case "bluesky":
        try {
          const { service, identifier, password } = params;
          const agent = new BskyAgent({ service });
          await agent.login({ identifier, password });
          await agent.post({ text, langs: ["ja"] });
        } catch (e) {
          return statusError(`Failed: ${target} ${e}`);
        }
        break;
      default:
        return statusError(`Not supported target: ${target}`);
    }

    info(`Task dispatched: ${id} ${target} ${text.substring(0, 20)}`);

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
    error(e);
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
