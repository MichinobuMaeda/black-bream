import { logger } from "firebase-functions/v2";
import sharp from "sharp";
import { WritableStream } from "htmlparser2/WritableStream";
import { getDownloadURL } from "firebase-admin/storage";

const mediaSizeLimit = 1000 * 1000;

/**
 * Generate a card object} from a link
 *
 * @param {string} text
 * @returns {Promise<Object>}
 */
export const generateLinkCard = async (text) => {
  try {
    const link = text.match(/https:\/\/\S+/);
    if (!link) {
      return { err: undefined, data: null };
    }

    const data = {
      uri: link[0],
      title: "",
      description: "",
      thumbUrl: "",
    };

    const html = await fetch(data.uri);

    if (html.status !== 200) {
      return { err: undefined, data: null };
    }

    let tagName = null;

    const parserStream = new WritableStream({
      onopentag(name, attrs) {
        tagName = name;

        if (name === "meta") {
          if (
            !data.title &&
            (attrs.property === "og:title" || attrs.name === "twitter:title")
          ) {
            data.title = attrs.content;
          } else if (
            !data.description &&
            (attrs.property === "og:description" ||
              attrs.name === "description" ||
              attrs.name === "twitter:description")
          ) {
            data.description = attrs.content;
          } else if (
            !data.thumbUrl &&
            (attrs.property === "og:image" || attrs.name === "twitter:image")
          ) {
            data.thumbUrl = new URL(attrs.content, data.uri).href;
          }
        }
      },
      ontext(text) {
        if (!data.title && tagName === "title") {
          data.title = text?.trim();
        }
      },
    });

    parserStream.write(await html.text());

    return { err: undefined, data };
  } catch (e) {
    return { err: e.toString(), data: undefined };
  }
};

const mimeTypeList = {
  ".html": "text/html",
  ".htm": "text/html",
  ".text": "text/plain",
  ".txt": "text/plain",
  ".css": "text/css",
  ".csv": "text/csv",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".xhtml": "application/xhtml+xml",
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
  ".zip": "application/zip",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Get MIME type} from URL or headers
 *
 * @param {string} url
 * @param {Object} [headers]
 * @returns {string}
 */
export const getMimeTypes = (url, headers = {}) =>
  headers["content-type"]?.replace(/;.*/, "") ??
  Object.entries(mimeTypeList).reduce(
    (acc, [key, value]) => (url.toLowerCase().endsWith(key) ? value : acc),
    undefined,
  ) ??
  Object.entries(mimeTypeList).reduce(
    (acc, [key, value]) =>
      url.toLowerCase().replace(/#.*/, "").endsWith(key) ? value : acc,
    undefined,
  ) ??
  Object.entries(mimeTypeList).reduce(
    (acc, [key, value]) =>
      url.toLowerCase().replace(/\?.*/, "").endsWith(key) ? value : acc,
    undefined,
  ) ??
  "application/octet-stream";

/**
 * Get download URL of a media file
 *
 * @param {import("@google-cloud/storage").Bucket} bucket
 * @param {string} id
 * @param {string} file
 * @returns {Promise<string>}
 */
export const getMediaDownloadUrl = (bucket, id, file) =>
  getDownloadURL(bucket.file(`public/posts/${id}/${file}`));

/**
 * Get media file as a Uint8Array
 *
 * @param {import("@google-cloud/storage").Bucket} bucket
 * @param {string} id
 * @param {string} file
 * @returns {Promise<{err: string|undefined, data: Uint8Array|undefined}>}
 */
export const getMediaAsUint8Array = async (bucket, id, file) => {
  try {
    const contents = await bucket.file(`public/posts/${id}/${file}`).download();
    return { err: undefined, data: new Uint8Array(contents[0]) };
  } catch (e) {
    logger.error(e);
    return { err: e.toString(), data: undefined };
  }
};

/**
 * Reduce image file size
 *
 * @param {Uint8Array} bin
 * @param {number} [maxSize]
 * @returns {Promise<{err: undefined|string, data: Uint8Array|undefined}>}
 */
export const reduceImageSize = async (bin, maxSize = mediaSizeLimit) => {
  try {
    const image = sharp(bin);
    const { width, height, size } = await image.metadata();

    if (size <= maxSize) {
      return { data: bin };
    }

    const data = new Uint8Array(
      await image
        .resize(
          Math.min(1024, Math.floor((width / size) * maxSize)),
          Math.min(1024, Math.floor((height / size) * maxSize)),
          { fit: "inside" },
        )
        .toBuffer(),
    );

    logger.info(`Image size reduced} from ${size} to ${data.length}`);

    return { data };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

/**
 * Get media file as a reduced-size Blob data
 *
 * @param {import("@google-cloud/storage").Bucket} bucket
 * @param {string} id
 * @param {string} file
 * @param {number} [maxSize]
 * @returns {Promise<{err: undefined|string, data: Blob|undefined}>}
 */
export const getMediaAsBlob = async (
  bucket,
  id,
  file,
  maxSize = mediaSizeLimit,
) => {
  const image = await getMediaAsUint8Array(bucket, id, file);
  if (image.err) {
    return image;
  }
  const reduced = await reduceImageSize(image.data, maxSize);
  if (reduced.err) {
    return reduced;
  }
  return {
    err: undefined,
    data: new Blob([reduced.data], { type: getMimeTypes(file) }),
  };
};

/**
 * HTTP request
 *
 * @param {string} url
 * @param {object} options
 * @returns {Promise<{err: undefined|string, data: any}>}
 */
export const httpRequest = async (url, options) =>
  fetch(url, options)
    .then((res) =>
      200 <= res.status && res.status < 300
        ? { err: undefined, data: res }
        : { err: `${res.status} ${res.statusText}`, data: undefined },
    )
    .catch((e) => ({ err: e.toString(), data: undefined }));

/**
 * Get public media URL
 *
 * @param {string} id
 * @param {string} file
 * @returns {string}
 */
export const getPublicMediaUrl = (id, file) =>
  `${process.env.PUBLIC_POST_MEDIA_URL}/media/posts/${id}/${file}`;

/**
 * Sleep
 *
 * @param {number} sec
 * @returns {Promise<void>}
 */
export const sleep = (sec) =>
  new Promise((resolve) => setTimeout(resolve, sec * 1000));

/**
 * Get Firestore document
 *
 * @param {FirebaseFirestore.DocumentReference} ref
 * @returns
 */
export const getDoc = async (ref) =>
  ref
    .get()
    .then((doc) => ({ data: doc }))
    .catch((e) => ({ err: e.toString() }));

export const updateDoc = async (ref, data) =>
  ref
    .update(data)
    .then(() => ({}))
    .catch((e) => ({ err: e.toString() }));
