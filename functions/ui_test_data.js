import { logger } from "firebase-functions/v2";
import * as deployment from "./deployment.js";

/**
 * Create test data for UI testing.
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<[string|null, number]>}
 */
export const createUiTestData = async (auth, db) => {
  logger.info("START: createUiTestData");
  try {
    if (!process.env.FUNCTIONS_EMULATOR) {
      logger.error("This function can only be run in the emulator");
      return { error: "This function can only be run in the emulator" };
    }
    if (
      !process.env.WEB_APP_URL.includes("localhost") &&
      !process.env.WEB_APP_URL.includes("127.0.0.1")
    ) {
      logger.error("This function can only be run at localhost");
      return { error: "This function can only be run at localhost" };
    }

    const emailPrimaryUser = "primary@example.com";
    const passwordPrimaryUser = "password";
    const dataVersionRef = db.collection("service").doc("dataVersion");
    await dataVersionRef.set({ email: emailPrimaryUser });
    const dataVersion = await dataVersionRef.get();

    const retV1 = await deployment.updateDataV1(auth, db, dataVersion);
    if (retV1.err) {
      return { error: retV1.err };
    }

    const retV2 = await deployment.updateDataV2(db, dataVersion);

    if (retV2.err) {
      return { error: retV2.err };
    }

    logger.info(`dataVersion: ${retV2.data}`);

    const retV3 = await deployment.updateDataV3(db, dataVersion);

    if (retV3.err) {
      return { error: retV3.err };
    }

    logger.info(`dataVersion: ${retV3.data}`);

    const user = await auth.getUserByEmail("primary@example.com");
    await auth.updateUser(user.uid, { password: "password" });

    const primary = await auth.getUserByEmail(emailPrimaryUser);
    await auth.updateUser(primary.uid, { password: passwordPrimaryUser });

    await db
      .collection("service")
      .doc("auth")
      .update({
        mastodon: {
          url: "urn:ietf:wg:oauth:2.0:oob",
          token: "mastodon-access-token",
        },
      });

    const err = new Error("Test error");
    await db.collection("logs").add({
      level: "error",
      message: err.message || err.toString() || "Unknown error",
      stack: err.stack || "",
      createdAt: new Date(),
    });

    logger.info("END  : createUiTestData");
    return { result: "ok" };
  } catch (e) {
    logger.error(e.toString());
    return { error: e.toString() };
  }
};
