const {
  onDocumentCreated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { onTaskDispatched } = require("firebase-functions/v2/tasks");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const post = require("./post");
const account = require("./account");
const { updateDataV1 } = require("./deployment");
const { createUiTestData } = require("./ui_test_data");
const { info } = require("firebase-functions/logger");

const region = "asia-northeast2";
const opts = process.env.FUNCTIONS_EMULATOR
  ? { region }
  : {
      region,
      enforceAppCheck: true,
      consumeAppCheckToken: true,
    };

const app = initializeApp();

exports.addAuthUser = onCall(opts, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.addAuthUser(
      getAuth(app),
      getFirestore(app),
      data?.uid,
      data?.email,
    ),
  ),
);

exports.post = onTaskDispatched(opts, async ({ data }) => {
  console.log(`Task dispatched: ${data.id}`);
});

exports.onDataPostCreated = onDocumentCreated(
  { document: "posts/{postsId}", ...opts },
  ({ data, location, project }) => {
    process.env.FUNCTIONS_EMULATOR
      ? info("On emulator")
      : post.createPost(location, project, data);
  },
);

exports.updateAuthEmail = onCall(opts, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.updateAuthEmail(getAuth(app), data?.uid, data?.email),
  ),
);

exports.removeAuthUser = onCall(opts, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.removeAuthUser(getAuth(app), data?.uid),
  ),
);

exports.getAuthUser = onCall(opts, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.getAuthUser(getAuth(app), data?.uid),
  ),
);

exports.onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", ...opts },
  ({ data }) => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    updateDataV1(auth, db, data, null);
  },
);

if (process.env.FUNCTIONS_EMULATOR) {
  exports.uiTestData = onCall(opts, () =>
    createUiTestData(getAuth(app), getFirestore(app)),
  );
}
