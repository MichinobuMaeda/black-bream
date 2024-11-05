const { logger } = require("firebase-functions/v2");

const { updateData } = require("./deployment");
const { createAccount } = require("./account");

/**
 * Create test data for UI testing.
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<[string|null, number]>}
 */
const createUiTestData = async (auth, db) => {
  logger.info("START: createUiTestData");
  try {
    if (!process.env.FUNCTIONS_EMULATOR) {
      logger.error("This function can only be run in the emulator");
      return { error: "This function can only be run in the emulator" };
    }

    const refConf = db.collection("service").doc("conf");
    const conf = await refConf.get();
    if (conf.exists) {
      logger.error("service/conf already exists");
      return { error: "service/conf already exists" };
    }
    await refConf.set({
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [err, uid] = await createAccount(
      auth,
      db,
      "Primary User",
      "primary@example.com",
    );
    if (err) {
      logger.error(err);
      return { error: err };
    }
    await auth.updateUser(uid, { password: "password" });
    db.collection("groups")
      .doc("admins")
      .set({
        users: [uid],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    db.collection("groups")
      .doc("managers")
      .set({
        users: [uid],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const refDataVersion = db.collection("service").doc("dataVersion");
    await refDataVersion.set({
      ver: 1,
      err: null,
      updatedAt: new Date(),
    });
    const dataVersion = await refDataVersion.get();

    await updateData(auth, db, dataVersion);

    logger.info("END  : createUiTestData");
    return { result: "ok" };
  } catch (e) {
    logger.error(e.toString());
    return { error: e.toString() };
  }
};

module.exports = { createUiTestData };
