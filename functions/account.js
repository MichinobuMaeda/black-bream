const { info, error } = require("firebase-functions/logger");

/**
 * Gate for group members
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {AuthData} authData
 * @param {string} group
 * @param {function} action
 * @returns {Promise<object>}
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
 * @param {string|null|undefined} uid
 * @param {string|null|undefined} email
 * @returns {Promise<object>}
 */
const addAuthUser = async (auth, db, uid, email) => {
  if (!uid) {
    error("missing-uid");
    return { err: "missing-uid" };
  }
  if (!email) {
    error("missing-email");
    return { err: "missing-email" };
  }

  const userRef = db.collection("users").doc(uid);

  try {
    const user = await userRef.get();
    if (!user.exists) {
      error(`missing-user-doc ${uid}`);
      return { err: `missing-user-doc ${uid}` };
    }

    await auth.createUser({
      uid,
      email,
    });

    info(`Create auth user ${uid}, ${email}`);
    return { err: undefined };
  } catch (e) {
    error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Update email of uid
 *
 * @param {Auth} auth
 * @param {string|null|undefined} uid
 * @param {string|null|undefined} email
 * @returns {Promise<object>}
 */
const updateAuthEmail = async (auth, uid, email) => {
  if (!uid) {
    error("missing-uid");
    return { err: "missing-uid" };
  }
  if (!email) {
    error("missing-email");
    return { err: "missing-email" };
  }

  try {
    await auth.updateUser(uid, { email });

    info(`Update ${uid} email: ${email}`);
    return { err: undefined };
  } catch (e) {
    error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Remove auth user of uid
 *
 * @param {Auth} auth
 * @param {string|null|undefined} uid
 * @returns {Promise<object>}
 */
const removeAuthUser = async (auth, uid) => {
  if (!uid) {
    error("missing-uid");
    return { err: "missing-uid" };
  }

  try {
    await auth.deleteUser(uid);

    info(`Remove auth user ${uid}`);
    return { err: undefined };
  } catch (e) {
    error(e.code ?? e.toString());
    return { err: e.code ?? e.toString() };
  }
};

/**
 * Get auth user of uid
 *
 * @param {Auth} auth
 * @param {string|null|undefined} uid
 * @returns {Promise<object>}
 */
const getAuthUser = async (auth, uid) => {
  if (!uid) {
    error("missing-uid");
    return { err: "missing-uid", data: undefined };
  }

  try {
    const user = await auth.getUser(uid);

    info(`Remove auth user ${uid}`);
    return { err: undefined, data: user };
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      return { err: undefined, data: null };
    } else {
      error(e.code ?? e.toString());
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
