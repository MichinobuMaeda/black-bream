const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onTaskDispatched } = require("firebase-functions/v2/tasks");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getFunctions } = require("firebase-admin/functions");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");

const { Threads } = require("./threads.js");
const { Tumblr } = require("./tumblr.js");
const { Twitter } = require("./twitter.js");
const { Post } = require("./post.js");
const account = require("./account.js");
const deployment = require("./deployment.js");
const { createUiTestData } = require("./ui_test_data.js");

const timeZone = "Asia/Tokyo";
const region = "asia-northeast2";
const optOnCall = process.env.FUNCTIONS_EMULATOR
  ? { region }
  : { region, enforceAppCheck: true };

const app = initializeApp();
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// https://<region>-<project-id>.cloudfunctions.net/public
exports.public = onRequest({ region, cors: true }, async (req, res) => {
  if (req.method === "GET") {
    if (req.path.startsWith("/posts/")) {
      try {
        const downloadURL = await getDownloadURL(
          bucket.file(`public${req.path}`),
        );
        logger.info(`Redirect ${req.path} to ${downloadURL}`);
        res.redirect(downloadURL);
      } catch (e) {
        logger.error(`Server Error: ${req.path} ${e}`);
        res.status(500).send("Server Error");
      }
    } else {
      res.status(404).send("Not Found");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
});

exports.post = onTaskDispatched({ region }, async ({ data }) =>
  new Post(db, bucket, data).post(),
);

const getQueue = (project, location, name) =>
  getFunctions(app).taskQueue(
    `projects/${project}/locations/${location}/functions/${name}`,
  );

exports.onPostCreated = onDocumentCreated(
  { document: "posts/{postsId}", region },
  async ({ data, location, project }) => {
    if (process.env.FUNCTIONS_EMULATOR) {
      logger.info("On emulator");
    } else {
      await new Post(db, bucket, data).createPosts(
        getQueue(project, location, "post"),
      );
    }
  },
);

exports.onPostUpdated = onDocumentUpdated(
  { document: "posts/{postsId}", region },
  async ({ data, location, project }) => {
    if (process.env.FUNCTIONS_EMULATOR) {
      logger.info("On emulator");
    } else {
      const { before, after } = data;
      const queue = getQueue(project, location, "post");

      if (after.data().status === "posting") {
        await new Post(db, bucket, after).checkCompleted();
      } else if (before.data().deletedAt && !after.data().deletedAt) {
        await new Post(db, bucket, after).createPosts(queue);
      } else if (!before.data().deletedAt && after.data().deletedAt) {
        await new Post(db, bucket, before).deletePosts(queue, before);
      } else if (
        before.data().scheduledFor?.toDate().getTime() !==
        after.data().scheduledFor?.toDate().getTime()
      ) {
        await new Post(db, bucket, before).deletePosts(queue, before);
        await new Post(db, bucket, after).createPosts(queue, after);
      } else if (
        Object.keys(before.data().targets ?? {}).length !==
          Object.keys(after.data().targets ?? {}).length ||
        !Object.keys(before.data().targets ?? {}).every((item) =>
          Object.keys(after.data().targets ?? {}).includes(item),
        )
      ) {
        await new Post(db, bucket, before).deletePosts(queue, before);
        await new Post(db, bucket, after).createPosts(queue, after);
      }
    }
  },
);

exports.onServiceAuthUpdated = onDocumentUpdated(
  { document: "service/auth", region },
  async ({ data }) => {
    const { after } = data;
    const confRef = db.collection("service").doc("conf");
    await confRef.update({
      postTargets: Object.entries(after.data())
        .filter(
          ([key]) => !["createdAt", "updatedAt", "deletedAt"].includes(key),
        )
        .filter(([, value]) => !value.deletedAt)
        .map(([key]) => key),
    });
  },
);

exports.addAuthUser = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "managers", () =>
    account.addAuthUser(getAuth(app), db, data?.uid, data?.email),
  ),
);

exports.updateAuthEmail = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "managers", () =>
    account.updateAuthEmail(getAuth(app), data?.uid, data?.email),
  ),
);

exports.removeAuthUser = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "managers", () =>
    account.removeAuthUser(getAuth(app), data?.uid),
  ),
);

exports.getAuthUser = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "managers", () =>
    account.getAuthUser(getAuth(app), data?.uid),
  ),
);

exports.setThreadsAccessToken = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "admins", () =>
    new Threads(db, bucket).setAccessToken(data),
  ),
);

exports.setTwitterAccessToken = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "admins", () =>
    new Twitter(db, bucket).setAccessToken(data),
  ),
);

exports.setTumblrAccessToken = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(db, auth, "admins", () =>
    new Tumblr(db, bucket).setAccessToken(data),
  ),
);

exports.daily = onSchedule(
  { schedule: "every day 00:11", timeZone, region },
  async () => new Threads(db, bucket).refreshAccessToken(),
);

exports.onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", region },
  async ({ data }) => {
    const auth = getAuth(app);
    await deployment.updateDataV1(auth, db, data);
    await deployment.updateDataV2(db, data);
  },
);

if (process.env.FUNCTIONS_EMULATOR) {
  exports.uiTestData = onCall({ region }, () =>
    createUiTestData(getAuth(app), db),
  );
}
