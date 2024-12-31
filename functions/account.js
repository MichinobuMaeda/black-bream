const { getRandomValues } = require("node:crypto");
const { info, error } = require("firebase-functions/logger");

const passwordLength = 32;
const charSetStd =
  "!#%+23456789:=?@ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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
 * Generate random password
 *
 * @returns {string}
 */
const generatePassword = () => {
  const randoms = new Uint32Array(passwordLength);
  getRandomValues(randoms);
  return randoms
    .map((val) => val % charSetStd.length)
    .reduce((ret, cur) => ret + charSetStd.substring(cur, cur + 1), "");
};

/**
 * Set password of uid
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {function} generatePassword
 * @param {string|null|undefined} uid
 * @returns {Promise<string|null>}
 */
const setPassword = async (auth, db, generatePassword, uid) => {
  try {
    const password = generatePassword();
    const { email } = await auth.getUser(uid);
    if (!email) {
      error("missing-email");
      return "missing-email";
    }

    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();
    if (!doc?.exists) {
      error(`missing-user-doc: ${uid}`);
      return `missing-user-doc: ${uid}`;
    }

    await auth.updateUser(uid, {
      password,
    });

    const conf = await db.collection("service").doc("conf").get();
    const subject =
      conf.get("invitationSubject") ?? "Invitation from Black bream";
    const text = (
      conf.get("invitationBody") ??
      "Please change your initial password: PASSWORD"
    ).replace("PASSWORD", password);

    await db.collection("mail").add({
      to: email,
      message: { subject, text },
      createdAt: new Date(),
    });

    await docRef.update({
      password: "auto",
      updatedAt: new Date(),
    });

    info(`Sent an email to ${email}`);
  } catch (e) {
    error(e);
    return e.toString();
  }

  return null;
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
  try {
    await auth.createUser({
      uid,
      email,
    });

    info(`Create auth user ${uid}, ${email}`);
  } catch (e) {
    error(e);
    return e.toString();
  }

  return null;
};

module.exports = {
  gateForGroupMembers,
  generatePassword,
  setPassword,
  createAuthUser,
};
