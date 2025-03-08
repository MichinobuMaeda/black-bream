const { logger } = require("firebase-functions/v2");
const { createHash } = require("node:crypto");
const axios = require("axios");
const {
  getMimeTypes,
  getMediaAsUint8Array,
  reduceImageSize,
} = require("./utils.js");

/**
 * Post to Twitter
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (db, bucket, params, id, { text, files }) => {
  const timeout = Number(process.env.IMAGE_UPLOAD_TIMEOUT || 5);
  try {
    const retRefresh = await refreshTwitterAccessToken(db);
    if (retRefresh.err) {
      return { err: retRefresh.err };
    }
    const accessToken = retRefresh.data ?? params.accessToken;

    const media_ids = [];
    if (files?.length) {
      const result = await getMediaAsUint8Array(bucket, id, files[0]);
      const encoding = getMimeTypes(files[0]);

      if (result.err) {
        return { err: result.err, data: undefined };
      }

      const image = await reduceImageSize(
        new Uint8Array(result.data),
        1000 * 1000,
      );

      const form = new FormData();
      form.append("media", new Blob([image], { type: encoding }), files[0]);

      const { status, statusText, data } = await axios.post(
        "https://api.x.com/2/media/upload",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      logger.info(`twitter post media: ${status} ${JSON.stringify(data)}`);

      media_ids.push(data.id);

      if (
        status === 200 &&
        data.processing_info &&
        data.processing_info.state.state === "in_progress"
      ) {
        const wait = Math.min(
          data.processing_info.check_after_secs ?? 0,
          timeout * timeout,
        );
        logger.info(`twitter wait media upload: ${wait} sec.`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else if (status !== 200) {
        return { err: `${status} ${statusText}` };
      }
    }

    text = text.trim();

    // Mastodon: Idempotency keys are stored for up to 1 hour.
    const hash = createHash("sha256");
    hash.update(text);

    const ret = await axios.post(
      "https://api.x.com/2/tweets",
      media_ids.length ? { text, media: { media_ids } } : { text },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    logger.info(
      `twitter post media: ${ret.status} ${JSON.stringify(ret.data)}`,
    );
    if (ret.status !== 201) {
      return { err: `${ret.status} ${ret.statusText}` };
    }

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

/**
 * Set access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 * @returns {Promise<object>}
 */
const setTwitterAccessToken = async (db, { status, code, challenge }) => {
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
    const expiredAt = new Date(
      new Date().getTime() + oauthData.expires_in * 1000,
    );

    await authRef.update({
      "twitter.accessToken": oauthData.access_token ?? null,
      "twitter.refreshToken": oauthData.refresh_token ?? null,
      "twitter.expiredAt": expiredAt,
      updatedAt: new Date(),
    });

    return { err: undefined };
  } catch (e) {
    return { err: e.toString() };
  }
};

/**
 * Refresh access token
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {object} data
 * @returns {Promise<object>}
 */
const refreshTwitterAccessToken = async (db) => {
  try {
    const authRef = db.collection("service").doc("auth");
    const auth = await authRef.get();
    const params = auth.get("twitter");
    const { clientId, clientSecret, accessToken, refreshToken, expiredAt } =
      params;

    if (expiredAt > new Date(new Date().getTime() + 60 * 1000)) {
      return { err: undefined };
    }

    logger.info(JSON.stringify(params));

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("refresh_token", refreshToken);
    formData.append("grant_type", "refresh_token");

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
      "twitter.accessToken": oauthData.access_token ?? accessToken,
      "twitter.refreshToken": oauthData.refresh_token ?? refreshToken,
      "twitter.expiredAt": new Date(
        new Date().getTime() + oauthData.expires_in * 1000,
      ),
      updatedAt: new Date(),
    });

    return { err: undefined, data: oauthData.access_token };
  } catch (e) {
    return { err: e.toString() };
  }
};

module.exports = { post, setTwitterAccessToken };
