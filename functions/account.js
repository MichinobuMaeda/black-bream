const { getRandomValues } = require("node:crypto");
const { logger } = require("firebase-functions/v2");

const charSetStd =
  "!#%+23456789:=?@ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Deploy on workflows
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {String} name
 * @param {String} email
 * @returns {Promise<[string|null, string|null]>}
 */
const createAccount = async (auth, db, name, email) => {
  const randoms = new Uint32Array(32);
  getRandomValues(randoms);
  const password = randoms
    .map((val) => val % charSetStd.length)
    .reduce((ret, cur) => ret + charSetStd.substring(cur, cur + 1), "");

  let user;

  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
      email,
      password,
    });
  } catch (e) {
    if (e.code != "auth/user-not-found") {
      logger.error(e);
      return [e.toString(), null];
    }
  }
  if (!user) {
    try {
      user = await auth.createUser({
        email,
        password,
      });
    } catch (e) {
      logger.error(e);
      return [e.toString(), null];
    }
  }
  try {
    db.collection("users").doc(user.uid).set({
      name: "Primary User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection("mail").add({
      to: email,
      message: {
        subject: "Invitation from Black bream",
        text: `Please change your initial password.
Your temporary password is ${password}`,
      },
    });
    logger.info(`Sent an email to ${email}`);
  } catch (e) {
    logger.error(e);
    return [e.toString(), null];
  }

  return [null, user.uid];
};

module.exports = {
  createAccount,
};
