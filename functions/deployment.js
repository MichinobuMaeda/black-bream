const { info, error } = require("firebase-functions/logger");

const { createAuthUser } = require("./account");

/**
 * Deploy on workflows
 *
 * @param {Auth} auth
 * @param {FirebaseFirestore.Firestore} db
 * @param {FirebaseFirestore.QueryDocumentSnapshot} deleted
 * @param {function} next
 * @returns {Promise<[string|undefined, number]>}
 */
const updateDataV1 = async (auth, db, deleted, next) => {
  let ver = Number(deleted.get("ver")) || 0;

  if (ver < 1) {
    var err = undefined;

    try {
      const email = deleted.get("email");
      if (!email) {
        error("missing-email");
        return ["missing-email", 0];
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
          invitationSubject: "Invitation from Black bream",
          invitationBody: "Please change your initial password: PASSWORD",
          webAppUrl: process.env.WEB_APP_URL,
          autoSendEmail: process.env.AUTO_SEND_EMAIL,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      info("Created 'service/conf'");

      const user = await db.collection("users").add({
        name: "Primary User",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const uid = user.id;

      const err = await createAuthUser(auth, db, uid, email);
      if (err) {
        return [err, ver];
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

      ver = 1;

      await deleted.ref.set({
        ver,
        err,
        updatedAt: new Date(),
      });
    } catch (e) {
      error(e);
      err = e.toString();
    }
  }

  return next ? next() : [err, ver];
};

module.exports = {
  updateDataV1,
};
