import { Timestamp } from "firebase-admin/firestore";
import { Provider } from "./provider.js";
import { getPublicMediaUrl, httpRequest, joinLines } from "./utils.js";

export class Instagram extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "instagram";
  }

  /**
   * post
   *
   * @param {string } id
   * @param {{ text:string, title:string, message:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, title, message, files }) {
    return !files?.length
      ? { err: new Error("No media files") }
      : this.getParams().then(({ err, data }) =>
          err
            ? { err }
            : { then: (fn) => fn(data) }.then(({ clientId, accessToken }) =>
                httpRequest(
                  `https://graph.instagram.com/v24.0/${clientId}/media`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      caption: joinLines(text, title, message),
                      image_url: getPublicMediaUrl(id, files[0]),
                    }),
                  },
                ).then(({ err, data }) => err
                    ? data.json().then((message) => {
                        console.log("Instagram API error: media", message);
                        return { err };
                    })
                    : data.json().then((media) =>
                        this.waitForMediaStatus(media.id, clientId, accessToken)
                          .then(({ err }) => err
                            ? { err }
                            : httpRequest(
                                `https://graph.instagram.com/v24.0/${clientId}/media_publish`,
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ creation_id: media.id }),
                                },
                              ).then(({ err, data }) => err ? data.json().then((message) => {
                                  console.log("Instagram API error: media_publish", message);
                                  return { err };
                                }) : {}
                              )
                          )
                      )
                ),
              ),
        );
  }

  /**
   * Wait for media container to be ready
   *
   * @param {string} mediaId - The media container ID
   * @param {string} clientId - The Instagram client ID
   * @param {string} accessToken - The access token
   * @param {number} maxAttempts - Maximum number of polling attempts (default: 30)
   * @param {number} delayMs - Delay between attempts in milliseconds (default: 2000)
   * @returns {Promise<{err: undefined|Error}>}
   */
  async waitForMediaStatus(mediaId, clientId, accessToken, maxAttempts = 30, delayMs = 2000) {
    const checkStatus = async (attempt) =>  (attempt >= maxAttempts)
     ? { err: new Error("Media processing timeout") }
     : httpRequest(
        `https://graph.instagram.com/v24.0/${mediaId}?fields=status_code`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ).then(async ({ err, data }) => (err)
        ? { err }
        : data.json().then(async (status) => (status.status_code === "FINISHED")
          ? {}
          : (status.status_code === "ERROR")
            ? { err: new Error("Media processing failed") }
            : new Promise(resolve => setTimeout(resolve, delayMs))
                .then(() => checkStatus(attempt + 1))
    ));

    return checkStatus(0);
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
                : expiredAt.toMillis() >
                    new Date().getTime() + 1000 * 60 * 60 * 24 * 10
                  ? {}
                  : httpRequest(
                      "https://graph.instagram.com/refresh_access_token" +
                        "?grant_type=ig_refresh_token" +
                        `&access_token=${accessToken}`,
                    ).then(({ err, data }) =>
                      err
                        ? { err }
                        : data
                            .json()
                            .then((json) =>
                              this.updateParams({
                                accessToken: json.access_token,
                                expiredAt: Timestamp.fromMillis(
                                  new Date().getTime() + json.expires_in * 1000,
                                ),
                              }).then(({ err }) => ({ err })),
                            )
                            .catch((err) => ({ err })),
                    ),
          ),
    );
  }
}
