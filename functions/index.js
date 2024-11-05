const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const { updateData } = require("./deployment");
const { createUiTestData } = require("./ui_test_data");

const app = initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);
const region = "asia-northeast2";

exports.onDataVersionDeleted = onDocumentDeleted(
  { document: "service/dataVersion", region },
  (event) => updateData(auth, db, event.data),
);

// [Caution!!] Don't deploy this function to production
// eslint-disable-next-line no-unused-vars
exports.uiTestData = onCall({ region }, (data, context) =>
  createUiTestData(auth, db),
);
