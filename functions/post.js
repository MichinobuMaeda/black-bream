const { info, error } = require("firebase-functions/logger");
const { getFunctions } = require("firebase-admin/functions");
const { google } = require("googleapis");

/**
 * Get the URL of a given v2 cloud function.
 * https://firebase.google.com/docs/functions/task-functions?gen=2nd
 *
 * @param {string} location the function's location
 * @param {string} project the project ID
 * @param {string} name the function's name
 * @return {Promise<object>} The URL of the function
 */
const getFunctionUrl = async (location, project, name) => {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const url =
      "https://cloudfunctions.googleapis.com/v2beta/" +
      `projects/${project}/locations/${location}/functions/${name}`;

    const client = await auth.getClient();
    const res = await client.request({ url });
    const uri = res.data?.serviceConfig?.uri;
    if (!uri) {
      error(`Unable to retrieve uri for function at ${url}`);
      return {
        err: `Unable to retrieve uri for function at ${url}`,
        data: undefined,
      };
    }
    info(`uri: ${uri}`);
    return { err: undefined, data: uri };
  } catch (e) {
    error(e.code ?? e.toString());
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

/**
 * Create post
 *
 * @param {string} location
 * @param {string} project
 * @param {FirebaseFirestore.QueryDocumentSnapshot} data
 * @returns {Promise<object>}
 */
const createPost = async (location, project, data) => {
  try {
    const { id } = data;
    const name = "post";
    const queue = getFunctions().taskQueue(name);
    const uri = await getFunctionUrl(location, project, name);
    const requests = [];
    requests.push(queue.enqueue({ id }, { uri }));
    await Promise.all(requests);
    await data.ref.update({ status: "queued" });
    return { err: undefined, data: "queued" };
  } catch (e) {
    error(e.code ?? e.toString());
    return { err: e.code ?? e.toString(), data: undefined };
  }
};

module.exports = {
  createPost,
};
