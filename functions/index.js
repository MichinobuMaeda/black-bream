import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { onRequest, onCall } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFunctions } from "firebase-admin/functions";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { Threads } from "./threads.js";
import { Instagram } from "./instagram.js";
import { Tumblr } from "./tumblr.js";
import { Twitter } from "./twitter.js";
import { Post, postAll } from "./post.js";
import * as account from "./account.js";
import * as deployment from "./deployment.js";
import { FeedReader } from "./feedReader.js";
import { FeedHandler } from "./feedHandler.js";
import { handleError, handleUpdate, handleOnCall } from "./utils.js";
import { createUiTestData } from "./ui_test_data.js";

const timeZone = "Asia/Tokyo";
const region = "asia-northeast2";
const optOnCall = process.env.FUNCTIONS_EMULATOR
  ? { region }
  : { region, enforceAppCheck: true };

const app = initializeApp();
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const recordError = handleError(db);
const recordUpdate = handleUpdate(db);
const recordOnCall = handleOnCall(db);

// https://<region>-<project-id>.cloudfunctions.net/public
export const media = onRequest({ region, cors: true }, async (req, res) => {
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

export const post = onTaskDispatched({ region }, async ({ data }) =>
  recordError(new Post(db, bucket, data).post()),
);

const getQueue = (project, location, name) =>
  getFunctions(app).taskQueue(
    `projects/${project}/locations/${location}/functions/${name}`,
  );

export const onPostCreated = onDocumentCreated(
  { document: "posts/{postsId}", region },
  async ({ data, location, project }) => {
    if (process.env.FUNCTIONS_EMULATOR) {
      logger.info("On emulator");
    } else {
      await recordError(
        new Post(db, bucket, data).createPosts(
          getQueue(project, location, "post"),
        ),
      );
    }
  },
);

export const onPostUpdated = onDocumentUpdated(
  { document: "posts/{postsId}", region },
  async ({ data, location, project }) => {
    if (process.env.FUNCTIONS_EMULATOR) {
      logger.info("On emulator");
    } else {
      const { before, after } = data;
      const queue = getQueue(project, location, "post");

      if (after.data().status === "posting") {
        await recordError(new Post(db, bucket, after).checkCompleted());
      } else if (before.data().deletedAt && !after.data().deletedAt) {
        await recordError(new Post(db, bucket, after).createPosts(queue));
      } else if (!before.data().deletedAt && after.data().deletedAt) {
        await recordError(
          new Post(db, bucket, before).deletePosts(queue, before),
        );
      } else if (
        before.data().scheduledFor?.toDate().getTime() !==
        after.data().scheduledFor?.toDate().getTime()
      ) {
        await recordError(
          new Post(db, bucket, before).deletePosts(queue, before),
        );
        await recordError(
          new Post(db, bucket, after).createPosts(queue, after),
        );
      } else if (
        Object.keys(before.data().targets ?? {}).length !==
          Object.keys(after.data().targets ?? {}).length ||
        !Object.keys(before.data().targets ?? {}).every((item) =>
          Object.keys(after.data().targets ?? {}).includes(item),
        )
      ) {
        await recordError(
          new Post(db, bucket, before).deletePosts(queue, before),
        );
        await recordError(
          new Post(db, bucket, after).createPosts(queue, after),
        );
      }
    }
  },
);

export const onServiceConfUpdated = onDocumentUpdated(
  { document: "service/conf", region },
  async () => {
    try {
      await recordUpdate("service/conf");
    } catch (err) {
      await recordError({ err });
    }
  },
);

export const onServiceAuthUpdated = onDocumentUpdated(
  { document: "service/auth", region },
  async ({ data }) => {
    try {
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
      await recordUpdate("service/auth");
    } catch (err) {
      await recordError({ err });
    }
  },
);

export const addAuthUser = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "addAuthUser",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "managers", () =>
      account.addAuthUser(getAuth(app), db, data?.uid, data?.email),
    ),
  ),
);

export const updateAuthEmail = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "updateAuthEmail",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "managers", () =>
      account.updateAuthEmail(getAuth(app), data?.uid, data?.email),
    ),
  ),
);

export const removeAuthUser = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "removeAuthUser",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "managers", () =>
      account.removeAuthUser(getAuth(app), data?.uid),
    ),
  ),
);

export const getAuthUser = onCall(optOnCall, async ({ data, auth }) =>
  recordError(
    account.gateForGroupMembers(db, auth, "managers", () =>
      account.getAuthUser(getAuth(app), data?.uid),
    ),
  ),
);

export const setThreadsAccessToken = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "setThreadsAccessToken",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "admins", () =>
      new Threads(db, bucket).setAccessToken(data),
    ),
  ),
);

export const setTwitterAccessToken = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "setTwitterAccessToken",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "admins", () =>
      new Twitter(db, bucket).setAccessToken(data),
    ),
  ),
);

export const setTumblrAccessToken = onCall(optOnCall, async ({ data, auth }) =>
  recordOnCall(
    "setTumblrAccessToken",
    auth,
    data,
    account.gateForGroupMembers(db, auth, "admins", () =>
      new Tumblr(db, bucket).setAccessToken(data),
    ),
  ),
);

const dailyJob = async () => {
  await recordError(new Threads(db, bucket).refreshAccessToken());
  await recordError(new Instagram(db, bucket).refreshAccessToken());
  await recordError(new FeedReader(db).readAll());
  await recordError(new FeedHandler(db).handleFeeds());
  await recordError(
    postAll(db, bucket, getQueue(app.options.projectId, region, "post")),
  );
};

export const runDaily = onCall({ region }, async () => dailyJob());

export const daily = onSchedule(
  { schedule: "every day 00:11", timeZone, region },
  async () => dailyJob(),
);

export const onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", region },
  async ({ data }) => {
    const auth = getAuth(app);
    await recordError(deployment.updateDataV1(auth, db, data));
    await recordError(deployment.updateDataV2(db, data));
    await recordError(deployment.updateDataV3(db, data));
  },
);

export const uiTestData = onCall(
  { region },
  process.env.FUNCTIONS_EMULATOR
    ? () => createUiTestData(getAuth(app), db)
    : () => {},
);
