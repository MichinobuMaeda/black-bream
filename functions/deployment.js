const { logger } = require("firebase-functions/v2");

const { createAccount } = require("./account");

/**
 * Deploy on workflows
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.QueryDocumentSnapshot} deleted
 * @returns {Promise<[string|null, number]>}
 */
const updateDataV1 = async (auth, db, deleted) => {
  var ver = 0;
  var err = null;

  try {
    await db
      .collection("service")
      .doc("conf")
      .set({
        desc: `## Privacy Policy

This website is for my personal use only. If you would like to create a website with similar functionality, please contact me at the email address below.

site.manager@example.com
`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    logger.info("Created 'service/conf'");
    const email = deleted.get("email");
    if (!email) {
      logger.error("undefined: email");
      return ["undefined: email", 0];
    }
    const [err, uid] = await createAccount(auth, db, "Primary User", email);
    if (err) {
      return [err, ver];
    }
    db.collection("groups")
      .doc("admins")
      .set({
        name: "System Administrators",
        users: [uid],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    db.collection("groups")
      .doc("managers")
      .set({
        name: "Managers",
        users: [uid],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    ver = 1;
  } catch (e) {
    logger.error(e);
    err = e.toString();
  }
  return [err, ver];
};

/**
 * Deploy on workflows
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.QueryDocumentSnapshot} deleted
 * @returns {Promise<[string|null, number]>}
 */
const updateData = async (auth, db, deleted) => {
  var err = null;
  var ver = 0;
  var org = 0;

  try {
    org = deleted.get("ver") ?? 0;
    ver = org;
    logger.info(`Current dataVersion: ${ver}`);

    if (ver == 0) {
      [err, ver] = await updateDataV1(auth, db, deleted);
    }

    // if (err == null && ver == 1) {
    //   [err, ver] = await deployDataV2(...);
    // }
  } catch (e) {
    logger.error(e);
    err = e.toString();
  }
  try {
    await deleted.ref.set({
      ver,
      err,
      updatedAt: new Date(),
    });
  } catch (e) {
    logger.error(e);
    err = err ?? e.toString();
  }

  return [err, ver];
};

module.exports = {
  updateData,
};
