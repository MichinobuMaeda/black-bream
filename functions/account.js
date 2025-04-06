const { logger } = require("firebase-functions/v2");

/**
 * Gate for group members
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {AuthData} authData
 * @param {string} group
 * @param {function} action
 * @returns {Promise<Object>}
 */
const gateForGroupMembers = async (db, { uid }, group, action) => {
  if (!uid) {
    return { err: "missing-uid", data: undefined };
  }
  const user = await db.collection("users").doc(uid).get();
  if (!user?.exists) {
    return { err: "missing-user-doc", data: undefined };
  }
  const doc = await db.collection("groups").doc(group).get();
  if (!doc.get("users")?.includes(uid)) {
    return { err: "permission-denied", data: undefined };
  }
  return await action();
};

/**
 * Create auth user of uid
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} uid
 * @param {string} email
 * @returns {Promise<Object>}
 */
const addAuthUser = async (auth, db, uid, email) => {
  if (!uid) {
    logger.error("missing-uid");
    return { err: "missing-uid" };
  }
  if (!email) {
    logger.error("missing-email");
    return { err: "missing-email" };
  }

  const userRef = db.collection("users").doc(uid);

  try {
    const user = await userRef.get();
    if (!user.exists) {
      logger.error(`missing-user-doc ${uid}`);
      return { err: `missing-user-doc ${uid}` };
    }

    await auth.createUser({
      uid,
      email,
    });

    logger.info(`Create auth user ${uid}, ${email}`);
    return { err: undefined };
  } catch (e) {
    logger.error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Update email of uid
 *
 * @param {Auth} auth
 * @param {string} uid
 * @param {string} email
 * @returns {Promise<Object>}
 */
const updateAuthEmail = async (auth, uid, email) => {
  if (!uid) {
    logger.error("missing-uid");
    return { err: "missing-uid" };
  }
  if (!email) {
    logger.error("missing-email");
    return { err: "missing-email" };
  }

  try {
    await auth.updateUser(uid, { email });

    logger.info(`Update ${uid} email: ${email}`);
    return { err: undefined };
  } catch (e) {
    logger.error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Remove auth user of uid
 *
 * @param {Auth} auth
 * @param {string} uid
 * @returns {Promise<Object>}
 */
const removeAuthUser = async (auth, uid) => {
  if (!uid) {
    logger.error("missing-uid");
    return { err: "missing-uid" };
  }

  try {
    await auth.deleteUser(uid);

    logger.info(`Remove auth user ${uid}`);
    return { err: undefined };
  } catch (e) {
    logger.error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Get auth user of uid
 *
 * @param {Auth} auth
 * @param {string} uid
 * @returns {Promise<Object>}
 */
const getAuthUser = async (auth, uid) => {
  if (!uid) {
    logger.error("missing-uid");
    return { err: "missing-uid", data: undefined };
  }

  try {
    const user = await auth.getUser(uid);

    logger.info(`Remove auth user ${uid}`);
    return { err: undefined, data: user };
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      return { err: undefined, data: null };
    } else {
      logger.error(e.code ?? e.toString());
      return { err: e.code ?? e.toString(), data: undefined };
    }
  }
};

module.exports = {
  gateForGroupMembers,
  addAuthUser,
  updateAuthEmail,
  removeAuthUser,
  getAuthUser,
};
