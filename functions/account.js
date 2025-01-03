const { info, error } = require("firebase-functions/logger");

/**
 * Gate for group members
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {AuthData} authData
 * @param {string} group
 * @param {function} action
 * @returns {any}
 */
const gateForGroupMembers = async (db, { uid }, group, action) => {
  if (!uid) {
    return ["missing-uid", undefined];
  }
  const user = await db.collection("users").doc(uid).get();
  if (!user?.exists) {
    return ["missing-user-doc", undefined];
  }
  const doc = await db.collection("groups").doc(group).get();
  if (!doc.get("users")?.includes(uid)) {
    return ["permission-denied", undefined];
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
 * @returns {Promise<string|null>}
 */
const createAuthUser = async (auth, db, uid, email) => {
  if (!uid) {
    error("missing-uid");
    return "missing-uid";
  }
  if (!email) {
    error("missing-email");
    return "missing-email";
  }

  const userRef = db.collection("users").doc(uid);

  try {
    const user = await userRef.get();
    if (!user.exists) {
      error(`missing-user-doc ${uid}`);
      return `missing-user-doc ${uid}`;
    }

    await auth.createUser({
      uid,
      email,
    });

    await userRef.update({
      email: true,
      updatedAt: new Date(),
    });

    info(`Create auth user ${uid}, ${email}`);
  } catch (e) {
    error(e);
    return e.toString();
  }

  return null;
};

/**
 * Remove auth user of uid
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {string|null|undefined} uid
 * @returns {Promise<string|null>}
 */
const removeAuthUser = async (auth, db, uid) => {
  if (!uid) {
    error("missing-uid");
    return "missing-uid";
  }

  try {
    await auth.deleteUser(uid);

    info(`Remove auth user ${uid}`);
  } catch (e) {
    error(e);
    return e.toString();
  }

  return null;
};

module.exports = {
  gateForGroupMembers,
  createAuthUser,
  removeAuthUser,
};
