const { createHash } = require("node:crypto");
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");
const { info, error } = require("firebase-functions/logger");
const { generateLinkCard, getMimeTypes } = require("./utils");

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
 * Post to Mastodon
 *
 * @param {object} params
 * @param {string} text
 * @returns {Promise<object>}
 */
const postMastodon = async (params, text) => {
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
      return { err: `${ret.status} ${ret.statusText}` };
    }

    return { err: undefined };
  } catch (e) {
    return { err: e.toString() };
  }
};

/**
 * Post to Bluesky
 * @param {object} params
 * @param {string} text
 * @returns {Promise<object>}
 */
const postBluesky = async (params, text) => {
  try {
    const { service, identifier, password } = params;
    const agent = new BskyAgent({ service });

    let external = undefined;
    const result = await generateLinkCard(text);

    if (result.data) {
      const { thumbUrl, ...card } = result.data;
      let thumb = undefined;
      if (thumbUrl) {
        const response = await axios.get(thumbUrl, {
          responseType: "arraybuffer",
        });
        const encoding = getMimeTypes(thumbUrl, response.headers);
        if (response.status === 200) {
          const { data } = await agent.uploadBlob(
            new Uint8Array(await response.data),
            { encoding },
          );
          thumb = data;
        }
      }
      external = {
        thumb,
        ...card,
      };
    }

    await agent.login({ identifier, password });
    await agent.post(
      external
        ? {
            text,
            langs: ["ja"],
            embed: {
              $type: "app.bsky.embed.external",
              external,
            },
          }
        : { text, langs: ["ja"] },
    );

    return { err: undefined };
  } catch (e) {
    return { err: e.toString() };
  }
};

/**
 * Post to Threads
 *
 * @param {object} params
 * @param {string} text
 * @returns {Promise<object>}
 */
const postThreads = async (params, text) => {
  try {
    const { userId, accessToken } = params;
    const retContainer = await axios.post(
      `https://graph.threads.net/v1.0/${userId}/threads` +
        "?media_type=TEXT" +
        `&text=${encodeURIComponent(text)}` +
        `&access_token=${accessToken}`,
    );

    if (retContainer.status !== 200) {
      return {
        err:
          "Failed to create container:" +
          ` ${retContainer.status} ${retContainer.statusText}`,
      };
    }

    const retPublish = await axios.post(
      `https://graph.threads.net/v1.0/${userId}/threads_publish` +
        `?creation_id=${retContainer.data.id}` +
        `&access_token=${accessToken}`,
    );

    if (retPublish.status !== 200) {
      return {
        err:
          "Failed to publish:" +
          ` ${retPublish.status} ${retPublish.statusText}`,
      };
    }

    return { err: undefined };
  } catch (e) {
    return { err: e.toString() };
  }
};

/**
 * Post
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 */
const post = async (db, { id, target }) => {
  info(`Task: ${id} ${target}`);
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
    let ret = null;

    switch (target) {
      case "mastodon":
        ret = await postMastodon(params, text);
        break;
      case "bluesky":
        ret = await postBluesky(params, text);
        break;
      case "threads":
        ret = await postThreads(params, text);
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
    error(e);
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

/**
 * Refresh Threads access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @returns
 */
const refreshThreadsAccessToken = async (db) => {
  try {
    const authRef = db.collection("service").doc("auth");
    const doc = await authRef.get();

    if (!doc.exists) {
      return { err: "Not found: service/auth" };
    }

    if (doc.get("deletedAt")) {
      return { err: "Deleted: service/auth" };
    }

    const threads = doc.get("threads");

    if (!threads) {
      return { err: "Not found: service/auth/threads" };
    }

    const { accessToken, expiredAt, deletedAt } = threads;

    if (deletedAt) {
      return { err: "Deleted: service/auth/threads" };
    }

    if (
      accessToken &&
      expiredAt &&
      expiredAt.toDate().getTime() > new Date().getTime() - 1000 * 60 * 60 * 24
    ) {
      const result = await axios.get(
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          `&access_token=${accessToken}`,
      );

      if (result.status === 200) {
        info("Threads access token refreshed");
        await authRef.update({
          "threads.accessToken": result.data.access_token,
          "threads.expiredAt": new Date(
            new Date().getTime() + result.data.expires_in * 1000,
          ),
        });
      } else {
        const err =
          "Failed to refresh Threads access token:" +
          ` ${result.status} ${result.statusText}`;
        error(err);
        return { err };
      }
    }

    return { err: undefined };
  } catch (e) {
    error(e);
    return { err: e.code ?? e.toString() };
  }
};

module.exports = {
  getQueueName,
  createPosts,
  deletePosts,
  post,
  checkCompleted,
  refreshThreadsAccessToken,
};
