const axios = require("axios");
// const parser = require("htmlparser2");
const { WritableStream } = require("htmlparser2/WritableStream");

/**
 * Generate a card object from a link
 *
 * @param {string} text
 * @returns {Promise<object>}
 */
const generateLinkCard = async (text) => {
  try {
    const link = text.match(/https:\/\/\S+/);
    if (!link) {
      return { err: undefined, data: null };
    }

    const data = {
      uri: link[0],
      title: null,
      description: null,
      thumbUrl: null,
    };

    const html = await axios.get(data.uri, { responseType: "stream" });

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
            data.thumbUrl = attrs.content;
          }
        }
      },
      ontext(text) {
        if (!data.title && tagName === "title") {
          data.title = text?.trim();
        }
      },
    });

    const htmlParser = html.data.pipe(parserStream);

    await new Promise((resolve, reject) => {
      htmlParser.on("finish", resolve);
      htmlParser.on("error", reject);
    });

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
 * Get MIME type from URL or headers
 *
 * @param {string} url
 * @param {array} headers
 * @returns
 */
const getMimeTypes = (url, headers) =>
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

module.exports = {
  generateLinkCard,
  getMimeTypes,
};
