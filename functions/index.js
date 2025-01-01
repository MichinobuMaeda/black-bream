const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const { gateForGroupMembers, createAuthUser } = require("./account");
const { updateDataV1 } = require("./deployment");
const { createUiTestData } = require("./ui_test_data");

const region = "asia-northeast2";

const app = initializeApp();

exports.addAuthUser = onCall({ region }, ({ data, auth }) =>
  gateForGroupMembers(getFirestore(app), "managers", auth, () =>
    createAuthUser(getAuth(app), getFirestore(app), data?.uid, data?.email),
  ),
);

exports.onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", region },
  ({ data }) => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    updateDataV1(auth, db, data, null);
  },
);

// [Caution!!] Don't deploy this function to production
// eslint-disable-next-line no-unused-vars
exports.uiTestData = onCall({ region }, (_) =>
  createUiTestData(getAuth(app), getFirestore(app)),
);
