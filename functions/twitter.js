const { logger } = require("firebase-functions/v2");
const { createHash } = require("node:crypto");
const axios = require("axios");
const { getMediaAsBlob } = require("./utils.js");

/**
 * Set access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 * @returns {Promise<object>}
 */
const setAccessToken = async (db, { status, code, challenge }) => {
  const expiredAt = new Date(new Date().getTime() + 2 * 3600 * 1000);
  try {
    console.log(JSON.stringify({ status, code, challenge }));

    if (!status || status === "ng") {
      const err = `invalid state: ${status}`;
      console.error(err);
      return { err };
    }

    if (!code || code === "error") {
      const err = `invalid code: ${code}`;
      console.error(err);
      return { err };
    }

    if (!challenge) {
      const err = `invalid challenge: ${challenge}`;
      console.error(err);
      return { err };
    }

    const authRef = db.collection("service").doc("auth");
    const auth = await authRef.get();
    const { clientId, clientSecret, callBackUrl } = auth.get("twitter");

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("code", code);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", callBackUrl);
    formData.append("code_verifier", challenge);

    let oauthResp = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: formData,
    });

    if (oauthResp.status !== 200) {
      const err = `/2/oauth2/token: ${oauthResp.status} ${oauthResp.statusText}`;
      console.error(err);
      return { err };
    }

    const oauthData = await oauthResp.json();
    console.log(JSON.stringify(oauthData));

    await authRef.update({
      "twitter.accessToken": oauthData.access_token,
      "twitter.refreshToken": oauthData.refresh_token,
      "twitter.expiredAt": expiredAt,
      updatedAt: new Date(),
    });

    return { err: undefined };
  } catch (e) {
    return { err: e.toString() };
  }
};

/**
 * Post to Twitter
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  const timeout = Number(process.env.IMAGE_UPLOAD_TIMEOUT || 5);
  try {
    const mediaIds = [];
    if (files?.length) {
      const blob = await getMediaAsBlob(bucket, id, files[0]);

      const form = new FormData();
      form.append("file", blob.data, files[0]);

      const { status, statusText, data } = await axios.post(
        "https://api.x.com/2/media/upload",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.bearerToken}`,
          },
        },
      );
      logger.info(`twitter post media: ${status} ${JSON.stringify(data)}`);

      mediaIds.push(data.id);

      if (status === 200 && data.processing_info.state === "in_progress") {
        const wait = Math.min(
          data.processing_info.check_after_secs,
          timeout * timeout,
        );
        logger.info(`twitter wait media upload: ${wait} sec.`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else if (status !== 200) {
        return { err: `${status} ${statusText}` };
      }
    }

    // Mastodon: Idempotency keys are stored for up to 1 hour.
    const hash = createHash("sha256");
    hash.update(text);

    const json = {
      text,
      language: "ja",
    };
    if (mediaIds.length) {
      logger.info(`twitter add media: ${mediaIds.join(",")}`);
      json["media_ids"] = mediaIds;
    }

    const ret = await axios.post("https://api.x.com/2/tweets", json, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.bearerToken}`,
      },
    });

    logger.info(
      `twitter post media: ${ret.status} ${JSON.stringify(ret.data)}`,
    );
    if (ret.status !== 200) {
      return { err: `${ret.status} ${ret.statusText}` };
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

module.exports = { setAccessToken, post };
