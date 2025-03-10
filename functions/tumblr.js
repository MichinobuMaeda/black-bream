const { logger } = require("firebase-functions/v2");
const { generateLinkCard } = require("./utils");

/**
 * Post to Tumblr
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (db, bucket, params, id, { text, files }) => {
  try {
    const retRefresh = await refreshTumblrAccessToken(db);
    if (retRefresh.err) {
      return { err: retRefresh.err };
    }
    const accessToken = retRefresh.data ?? params.accessToken;

    text = text.trim();
    let body = undefined;

    if (files?.length) {
      const url = `${process.env.PUBLIC_POST_MEDIA_URL}/public/posts/${id}/${files[0]}`;
      body = {
        content: [
          { type: "image", media: { url } },
          { type: "text", text },
        ],
      };
    } else {
      const result = await generateLinkCard(text);
      if (result.data) {
        const url = result.data.url;
        text = text.replace(url, "").trim();
        body = {
          content: [
            { type: "link", url },
            { type: "text", text },
          ],
        };
      } else {
        body = { content: [{ type: "text", text }] };
      }
    }

    logger.info(
      JSON.stringify({
        url: `https://api.tumblr.com/v2/blog/${params.blogId}/posts`,
        body,
      }),
    );

    const ret = await fetch(
      `https://api.tumblr.com/v2/blog/${params.blogId}/posts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      },
    );

    logger.info(`tumblr post media: ${ret.status} ${JSON.stringify(ret.data)}`);
    if (ret.status !== 201) {
      logger.error(JSON.stringify(ret.json()));
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
const setTumblrAccessToken = async (db, { code }) => {
  try {
    console.log(JSON.stringify({ code }));

    if (!code || code === "error") {
      const err = `invalid code: ${code}`;
      console.error(err);
      return { err };
    }

    const authRef = db.collection("service").doc("auth");
    const auth = await authRef.get();
    const { clientId, clientSecret, callBackUrl } = auth.get("tumblr");

    const formData = new FormData();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("redirect_uri", callBackUrl);

    let oauthResp = await fetch("https://api.tumblr.com/v2/oauth2/token", {
      method: "POST",
      body: formData,
    });

    const oauthData = await oauthResp.json();
    console.log(JSON.stringify(oauthData));

    if (oauthResp.status !== 200) {
      const err = `/v2/oauth2/token: ${oauthResp.status} ${oauthResp.statusText}`;
      console.error(err);
      return { err };
    }

    const expiredAt = new Date(
      new Date().getTime() + oauthData.expires_in * 1000,
    );

    await authRef.update({
      "tumblr.accessToken": oauthData.access_token ?? null,
      "tumblr.refreshToken": oauthData.refresh_token ?? null,
      "tumblr.expiredAt": expiredAt,
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
const refreshTumblrAccessToken = async (db) => {
  try {
    const authRef = db.collection("service").doc("auth");
    const auth = await authRef.get();
    const params = auth.get("tumblr");
    const { clientId, clientSecret, accessToken, refreshToken, expiredAt } =
      params;

    if (expiredAt > new Date(new Date().getTime() + 60 * 1000)) {
      return { err: undefined };
    }

    logger.info(JSON.stringify(params));

    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);

    let oauthResp = await fetch("https://api.tumblr.com/v2/oauth2/token", {
      method: "POST",
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
      "tumblr.accessToken": oauthData.access_token ?? accessToken,
      "tumblr.refreshToken": oauthData.refresh_token ?? refreshToken,
      "tumblr.expiredAt": new Date(
        new Date().getTime() + oauthData.expires_in * 1000,
      ),
      updatedAt: new Date(),
    });

    return { err: undefined, data: oauthData.access_token };
  } catch (e) {
    return { err: e.toString() };
  }
};

module.exports = { post, setTumblrAccessToken };
