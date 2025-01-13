const { info, error } = require("firebase-functions/logger");
const deployment = require("./deployment");

/**
 * Create test data for UI testing.
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<[string|null, number]>}
 */
const createUiTestData = async (auth, db) => {
  info("START: createUiTestData");
  try {
    if (!process.env.FUNCTIONS_EMULATOR) {
      error("This function can only be run in the emulator");
      return { error: "This function can only be run in the emulator" };
    }
    if (
      !process.env.WEB_APP_URL.includes("localhost") &&
      !process.env.WEB_APP_URL.includes("127.0.0.1")
    ) {
      error("This function can only be run at localhost");
      return { error: "This function can only be run at localhost" };
    }

    const emailPrimaryUser = "primary@example.com";
    const passwordPrimaryUser = "password";
    const dataVersionRef = db.collection("service").doc("dataVersion");
    await dataVersionRef.set({ email: emailPrimaryUser });
    const dataVersion = await dataVersionRef.get();

    const { err, data } = await deployment.updateDataV1(
      auth,
      db,
      dataVersion,
      () => deployment.updateDataV2(db, dataVersion, null),
    );

    info(`dataVersion: ${data}`);

    if (err) {
      return { error: err };
    }
    const primary = await auth.getUserByEmail(emailPrimaryUser);
    await auth.updateUser(primary.uid, { password: passwordPrimaryUser });

    info("END  : createUiTestData");
    return { result: "ok" };
  } catch (e) {
    error(e.toString());
    return { error: e.toString() };
  }
};

module.exports = { createUiTestData };
