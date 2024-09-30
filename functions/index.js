const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getRandomValues } = require("node:crypto");
const logger = require("firebase-functions/logger");

const app = initializeApp();
const region = "asia-northeast2";
const charSetStd =
  "!#%+23456789:=?@ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

exports.deploy = onDocumentDeleted(
  { document: "service/{deployment}", region },
  async (event) => {
    const db = getFirestore(app);
    const conf = await db.collection("service").doc("config").get();
    if (!conf.exists) {
      logger.info("'service/conf' not found");
      try {
        const email = event.data.get("email");
        const randoms = new Uint32Array(32);
        getRandomValues(randoms);
        const generated = randoms
          .map((val) => val % charSetStd.length)
          .reduce((ret, cur) => ret + charSetStd.substring(cur, cur + 1), "");
        await db.collection("mail").add({
          to: email,
          message: {
            subject: "Invitation from Black bream",
            text: `Please change your initial password.
Your temporary password is ${generated}`,
          },
        });
      } catch (e) {
        logger.error(e);
      }
    } else {
      logger.info("'service/conf' found");
    }
  },
);
