import { httpRequest, getPublicMediaUrl } from "./utils.js";
import { Provider } from "./provider.js";

export class Threads extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "threads";
  }

  /**
   * Post container
   *
   * @param {{ clientId:string, accessToken:string }} params
   * @param {string} id
   * @param {{ userId, accessToken }} data
   * @returns {Promise<{err: undefined|Error, data: object|undefined}>}
   */
  async createContainer({ userId, accessToken }, id, { text, files }) {
    return httpRequest(
      files?.length
        ? `https://graph.threads.net/v1.0/${userId}/threads` +
            "?media_type=IMAGE" +
            `&text=${encodeURIComponent(text.trim())}` +
            `&image_url=${getPublicMediaUrl(id, files[0])}` +
            `&access_token=${accessToken}`
        : `https://graph.threads.net/v1.0/${userId}/threads` +
            "?media_type=TEXT" +
            `&text=${encodeURIComponent(text.trim())}` +
            `&access_token=${accessToken}`,
      { method: "POST" },
    ).then(({ err, data }) =>
      err
        ? { err }
        : data
            .json()
            .then((data) => ({ data }))
            .catch((err) => ({ err })),
    );
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{text: string, files:array}} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, files }) {
    return this.getParams().then(({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ userId, accessToken }) =>
            this.createContainer(data, id, { text, files }).then(
              ({ err, data }) =>
                err
                  ? { err }
                  : httpRequest(
                      `https://graph.threads.net/v1.0/${userId}/threads_publish` +
                        `?creation_id=${data.id}` +
                        `&access_token=${accessToken}`,
                      { method: "POST" },
                    ).then(({ err }) => ({ err })),
            ),
          ),
    );
  }

  /**
   * Refresh access token
   *
   * @returns {Promise<{err: undefined|Error}>}
   */
  async refreshAccessToken() {
    return this.getParams().then(({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ accessToken, expiredAt }) =>
            !accessToken
              ? { err: new Error("No access token") }
              : !expiredAt
                ? { err: new Error("No expiredAt") }
                : expiredAt.toDate().getTime() >
                    new Date().getTime() + 1000 * 60 * 60 * 24 * 10
                  ? {}
                  : httpRequest(
                      "https://https://graph.threads.net/refresh_access_token" +
                        "?grant_type=th_refresh_token" +
                        `&access_token=${accessToken}`,
                    ).then(({ err, data }) =>
                      err
                        ? { err }
                        : data
                            .json()
                            .then((json) =>
                              this.updateParams({
                                accessToken: json.access_token,
                                expiredAt: new Date(
                                  new Date().getTime() + json.expires_in * 1000,
                                ),
                              }).then(({ err }) => ({ err })),
                            )
                            .catch((err) => ({ err })),
                    ),
          ),
    );
  }

  /**
   * Post access token request
   *
   * @param {string} code
   * @param {string} clientId
   * @param {string} clientSecret
   * @param {string} callBackUrl
   * @returns {Promise<{err: undefined|Error, data: Object|undefined}>}
   */
  async postAccessTokenRequest(code, clientId, clientSecret, callBackUrl) {
    const form = new FormData();
    form.append("client_id", clientId);
    form.append("client_secret", clientSecret);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", callBackUrl);
    form.append("code", code);

    return httpRequest("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      body: form,
    }).then(({ err, data }) =>
      err
        ? { err }
        : data
            .json()
            .then((data) =>
              !data.access_token
                ? {
                    err: new Error(
                      "POST /oauth/access_token: failed to get access token",
                    ),
                  }
                : { data },
            )
            .catch((err) => ({ err })),
    );
  }

  /**
   * Get new access token
   *
   * @param {string} clientSecret
   * @param {string} accessToken
   * @returns {Promise<{err: undefined|Error, data: Object|undefined}>}
   */
  async getNewAccessToken(clientSecret, accessToken) {
    return httpRequest(
      "https://graph.threads.net/access_token" +
        "?grant_type=th_exchange_token" +
        `&client_secret=${clientSecret}` +
        `&access_token=${accessToken}`,
    ).then(({ err, data }) =>
      err
        ? { err }
        : data
            .json()
            .then((data) =>
              !data.access_token
                ? {
                    err: new Error(
                      "GET /access_token: failed to get access token",
                    ),
                  }
                : { data },
            )
            .catch((err) => ({ err })),
    );
  }

  /**
   * Set access token
   *
   * @param {{code:string}} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async setAccessToken({ code }) {
    return !code
      ? { err: new Error("No code") }
      : this.getParams().then(({ err, data }) =>
          err
            ? { err }
            : { then: (fn) => fn(data) }.then(
                ({ clientId, clientSecret, callBackUrl }) =>
                  this.postAccessTokenRequest(
                    code,
                    clientId,
                    clientSecret,
                    callBackUrl,
                  ).then(({ err, data }) =>
                    err
                      ? { err }
                      : { then: (fn) => fn(data) }.then(
                          ({ access_token, user_id }) =>
                            this.getNewAccessToken(
                              clientSecret,
                              access_token,
                            ).then(({ err, data }) =>
                              err
                                ? { err }
                                : this.updateParams({
                                    accessToken: data.access_token,
                                    userId: user_id,
                                    expiredAt: new Date(
                                      new Date().getTime() +
                                        data.expires_in * 1000,
                                    ),
                                  }),
                            ),
                        ),
                  ),
              ),
        );
  }
}
