import { logger } from "firebase-functions/v2";
import { addAuthUser } from "./account.js";

/**
 * Update data to version 1
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.QueryDocumentSnapshot} deleted
 * @returns {Promise<Object>}
 */
export const updateDataV1 = async (auth, db, deleted) => {
  let ver = Number(deleted.get("ver")) || 0;

  if (ver < 1) {
    var err = undefined;

    try {
      const email = deleted.get("email");
      if (!email) {
        logger.error("missing-email");
        return { err: "missing-email", data: ver };
      }

      await db
        .collection("service")
        .doc("conf")
        .set({
          desc: `## Privacy Policy

This website is for my personal use only.
If you would like to create a website with similar functionality,
please contact me at the email address below.

site.manager@example.com
`,
          webAppUrl: process.env.WEB_APP_URL,
          autoSendEmail: process.env.AUTO_SEND_EMAIL,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      logger.info("Created 'service/conf'");

      const user = await db.collection("users").add({
        name: "Primary User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const uid = user.id;

      const { err } = await addAuthUser(auth, db, uid, email);
      if (err) {
        return { err, data: ver };
      }

      await db
        .collection("groups")
        .doc("admins")
        .set({
          name: "System Administrators",
          users: [uid],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await db
        .collection("groups")
        .doc("managers")
        .set({
          name: "Managers",
          users: [uid],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await db
        .collection("groups")
        .doc("operators")
        .set({
          name: "Operators",
          users: [uid],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await deleted.ref.set({
        ver: 1,
        err: err ?? null,
        updatedAt: new Date(),
      });
    } catch (e) {
      logger.error(e.code ?? e.toString());
      err = e.code ?? e.toString();
      return { err: err, data: ver };
    }
  }

  return { err: undefined, data: 1 };
};

/**
 * Update data to version 2
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.QueryDocumentSnapshot} deleted
 * @returns {Promise<Object>}
 */
export const updateDataV2 = async (db, deleted) => {
  let ver = Number(deleted.get("ver")) || 0;

  if (ver < 2) {
    var err = undefined;

    try {
      await db.collection("service").doc("auth").set({
        createdAt: new Date(),
      });
      logger.info("Created 'service/auth'");

      await deleted.ref.set({
        ver: 2,
        err: err ?? null,
        updatedAt: new Date(),
      });
    } catch (e) {
      logger.error(e.code ?? e.toString());
      err = e.code ?? e.toString();
      return { err: e.code ?? e.toString(), data: ver };
    }
  }

  return { err: undefined, data: 2 };
};
