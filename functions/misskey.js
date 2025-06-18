import { getMediaAsBlob, httpRequest, joinLines } from "./utils.js";
import { Provider } from "./provider.js";

export class Misskey extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "misskey";
  }

  /**
   * Get media list
   *
   * @param {string} url
   * @param {string} token
   * @param {string} id
   * @param {array|undefined} files
   * @returns {Promise<{err: undefined|Error, data: array|undefined}>}
   */
  async getMediaList(url, token, id, files) {
    return !files?.length
      ? { data: [] }
      : getMediaAsBlob(this.bucket, id, files[0]).then(({ err, data }) =>
          err
            ? { err }
            : {
                then: (fn) => {
                  const form = new FormData();
                  form.append("file", data, files[0]);
                  form.append("name", files[0]);
                  form.append("isSensitive", false);
                  return fn(form);
                },
              }.then((form) =>
                httpRequest(`${url}/drive/files/create`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: form,
                }).then(({ err, data }) =>
                  err
                    ? { err }
                    : data.json().then((json) => ({ data: [json.id] })),
                ),
              ),
        );
  }

  /**
   * post
   *
   * @param {string } id
   * @param {{ text:string, title:string,message:string, link:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(id, { text, title, message, link, files }) {
    return this.getParams().then(({ err, data }) =>
      err
        ? { err }
        : { then: (fn) => fn(data) }.then(({ url, token }) =>
            this.getMediaList(url, token, id, files).then(({ err, data }) =>
              err
                ? { err }
                : httpRequest(`${url}/notes/create`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      visibility: "public",
                      text: joinLines(text, title, message, link),
                      ...(data.length ? { mediaIds: data } : {}),
                    }),
                  }).then(({ err }) => ({ err })),
            ),
          ),
    );
  }
}
