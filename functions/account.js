import { logger } from "firebase-functions/v2";
import { docRef, getDoc } from "./utils.js";

/**
 * Gate for group members
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {AuthData} authData
 * @param {string} group
 * @param {function} action
 * @returns {Promise<{err: undefined|Error}>}
 */
export const gateForGroupMembers = async (db, { uid }, group, action) =>
  !uid
    ? { err: new Error("missing-uid") }
    : getDoc(docRef(db, "users", uid)).then(({ err, data }) =>
        err
          ? { err }
          : !data?.exists
            ? { err: new Error("missing-user-doc") }
            : getDoc(docRef(db, "groups", group)).then(({ err, data }) =>
                err
                  ? { err }
                  : !data.get("users")?.includes(uid)
                    ? { err: new Error("permission-denied") }
                    : action(),
              ),
      );

/**
 * Create auth user of uid
 *
 * @param {import("firebase-admin/auth").Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} uid
 * @param {string} email
 * @returns {Promise<{err: undefined|Error}>}
 */
export const addAuthUser = async (auth, db, uid, email) =>
  !uid
    ? { err: new Error("missing-uid") }
    : !email
      ? { err: new Error("missing-email") }
      : getDoc(docRef(db, "users", uid)).then(({ err, data }) =>
          err
            ? { err }
            : !data?.exists
              ? { err: new Error(`missing-user-doc ${uid}`) }
              : auth
                  .createUser({ uid, email })
                  .then(() => {
                    logger.info(`Create auth user ${uid}, ${email}`);
                    return {};
                  })
                  .catch((err) => ({ err })),
        );

/**
 * Update email of uid
 *
 * @param {import("firebase-admin/auth").Auth} auth
 * @param {string} uid
 * @param {string} email
 * @returns {Promise<{err: undefined|Error}>}
 */
export const updateAuthEmail = async (auth, uid, email) =>
  !uid
    ? { err: new Error("missing-uid") }
    : !email
      ? { err: new Error("missing-email") }
      : auth
          .updateUser(uid, { email })
          .then(() => {
            logger.info(`Update ${uid} email: ${email}`);
            return {};
          })
          .catch((err) => ({ err }));

/**
 * Remove auth user of uid
 *
 * @param {import("firebase-admin/auth").Auth} auth
 * @param {string} uid
 * @returns {Promise<{err: undefined|Error}>}
 */
export const removeAuthUser = async (auth, uid) =>
  !uid
    ? { err: new Error("missing-uid") }
    : auth
        .deleteUser(uid)
        .then(() => {
          logger.info(`Remove auth user ${uid}`);
          return {};
        })
        .catch((err) => ({ err }));

/**
 * Get auth user of uid
 *
 * @param {import("firebase-admin/auth").Auth} auth
 * @param {string} uid
 * @returns {Promise<{err: undefined|Error, data: import("firebase-admin/auth").UserRecord|null}>}
 */
export const getAuthUser = async (auth, uid) =>
  !uid
    ? { err: new Error("missing-uid") }
    : auth
        .getUser(uid)
        .then((user) => {
          logger.info(`getAuthUser(${uid}): {uid: ${uid}}`);
          return { err: undefined, data: user };
        })
        .catch((err) => {
          if (err.code === "auth/user-not-found") {
            logger.info(`getAuthUser(${uid}): auth/user-not-found`);
            return { err: undefined, data: null };
          } else {
            return { err };
          }
        });
