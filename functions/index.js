const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const account = require("./account");
const { updateDataV1 } = require("./deployment");
const { createUiTestData } = require("./ui_test_data");

const region = "asia-northeast2";

const app = initializeApp();

exports.addAuthUser = onCall({ region }, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.addAuthUser(
      getAuth(app),
      getFirestore(app),
      data?.uid,
      data?.email,
    ),
  ),
);

exports.updateAuthEmail = onCall({ region }, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.updateAuthEmail(getAuth(app), data?.uid, data?.email),
  ),
);

exports.deleteAuthUser = onCall({ region }, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.deleteAuthUser(getAuth(app), data?.uid),
  ),
);

exports.getAuthUser = onCall({ region }, ({ data, auth }) =>
  account.gateForGroupMembers(getFirestore(app), auth, "managers", () =>
    account.getAuthUser(getAuth(app), data?.uid),
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
exports.uiTestData = onCall({ region }, () =>
  createUiTestData(getAuth(app), getFirestore(app)),
);
