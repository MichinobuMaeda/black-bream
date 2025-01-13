const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { onTaskDispatched } = require("firebase-functions/v2/tasks");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getFunctions } = require("firebase-admin/functions");

const post = require("./post");
const account = require("./account");
const deployment = require("./deployment");
const { createUiTestData } = require("./ui_test_data");
const { info } = require("firebase-functions/logger");

const region = "asia-northeast2";
const optOnCall = process.env.FUNCTIONS_EMULATOR
  ? { region }
  : {
      region,
      enforceAppCheck: true,
      consumeAppCheckToken: true,
    };

const app = initializeApp();

exports.post = onTaskDispatched({ region }, async ({ data }) => {
  await post.post(getFirestore(app), data);
});

exports.onPostUpdated = onDocumentUpdated(
  { document: "posts/{postsId}", region },
  async ({ data, location, project }) => {
    if (process.env.FUNCTIONS_EMULATOR) {
      info("On emulator");
    } else {
      const queue = getFunctions(app).taskQueue(
        post.getQueueName(project, location, "post"),
      );
      const { before, after } = data;
      if (before.data().status === "posting") {
        await post.checkCompleted(before);
      } else if (before.data().deletedAt && !after.data().deletedAt) {
        await post.createPosts(queue, after);
      } else if (!before.data().deletedAt && after.data().deletedAt) {
        await post.deletePosts(queue, before);
      } else if (
        before.data().scheduledFor?.toDate().getTime() !==
          after.data().scheduledFor?.toDate().getTime() ||
        before.data().services?.length !== after.data?.length ||
        !(before.data().services ?? []).every((item) =>
          (after.data().services ?? []).includes(item),
        )
      ) {
        await post.deletePosts(queue, before);
        await post.createPosts(queue, after);
      }
    }
  },
);

exports.onPostCreated = onDocumentCreated(
  { document: "posts/{postsId}", region },
  ({ data, location, project }) =>
    process.env.FUNCTIONS_EMULATOR
      ? info("On emulator")
      : post.createPosts(
          getFunctions(app).taskQueue(
            post.getQueueName(project, location, "post"),
          ),
          data,
        ),
);

exports.onServiceAuthUpdated = onDocumentUpdated(
  { document: "service/auth", region },
  async ({ data }) => {
    const db = getFirestore(app);
    const { after } = data;
    await db
      .collection("service")
      .doc("conf")
      .update({
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
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.addAuthUser(
      getAuth(app),
      getFirestore(app),
      data?.uid,
      data?.email,
    ),
  ),
);

exports.updateAuthEmail = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.updateAuthEmail(getAuth(app), data?.uid, data?.email),
  ),
);

exports.removeAuthUser = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.removeAuthUser(getAuth(app), data?.uid),
  ),
);

exports.getAuthUser = onCall(optOnCall, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.getAuthUser(getAuth(app), data?.uid),
  ),
);

exports.onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", region },
  ({ data }) => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    deployment.updateDataV1(auth, db, data, () =>
      deployment.updateDataV2(db, data, null),
    );
  },
);

if (process.env.FUNCTIONS_EMULATOR) {
  exports.uiTestData = onCall({ region }, () =>
    createUiTestData(getAuth(app), getFirestore(app)),
  );
}
