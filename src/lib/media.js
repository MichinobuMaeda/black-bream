import mammoth from "mammoth";
import * as cheerio from "cheerio";

const mimeTypeList = {
  html: "text/html",
  htm: "text/html",
  text: "text/plain",
  txt: "text/plain",
  css: "text/css",
  csv: "text/csv",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  xhtml: "application/xhtml+xml",
  pdf: "application/pdf",
  epub: "application/epub+zip",
  zip: "application/zip",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  odp: "application/vnd.oasis.opendocument.presentation",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odt: "application/vnd.oasis.opendocument.text",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Get file extension from filename
 *
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop() : "";
};

/**
 * Convert filename to mime type
 *
 * @param {string} filename
 * @param {string} [defaultMimeType]
 * @returns {string}
 */
export const getMimeTypeFromExtension = (
  extension,
  defaultMimeType = "application/octet-stream",
) => (extension in mimeTypeList ? mimeTypeList[extension] : defaultMimeType);

/**
 * Get mime type from file
 *
 * @param {Document} document
 * @param {Blob} source
 * @param {string} mimeType
 * @param {number} maxSize
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export const reduceImageSize = async (
  document,
  source,
  mimeType,
  maxSize,
  quality = 1.0,
) => {
  if (source.size <= maxSize) {
    return source;
  }
  try {
    const img = new Image();
    img.src = URL.createObjectURL(source);
    console.log("img.src", img.src);
    await img.decode();
    const canvas = document.createElement("canvas");

    const rate = maxSize / source.size;
    const width = Math.ceil(img.width * rate);
    const height = Math.floor(img.height * rate);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) =>
      ctx.canvas.toBlob(resolve, mimeType, quality),
    );

    console.log({
      mimeType,
      rate,
      from: source.size,
      to: blob.size,
      width,
      height,
    });

    return blob;
  } catch (error) {
    console.error("Error reducing image size:", error);
    return source;
  }
};

/**
 * Recursively get all text nodes from a Cheerio node.
 * @param {cheerio.CheerioAPI} dom
 * @param {cheerio.Cheerio<cheerio.Element>} node
 * @returns {Array<string>}
 */
function getAllTextNodes(dom, node) {
  let texts = [];
  node.contents().each((_, child) => {
    if (child.type === "text") {
      const text = dom(child).text();
      if (text) {
        texts.push(text);
      }
    } else {
      if (dom(child).contents().length) {
        texts = texts.concat(getAllTextNodes(dom, dom(child)));
      }
    }
  });
  return texts;
}

/**
 * @typedef {Object} DocxToTableResultCol
 * @property {Array<string>} texts
 */

/**
 * @typedef {Object} DocxToTableResultRow
 * @property {Array<{DocxToTableResultCol}>} cols
 */

/**
 * @typedef {Object} DocxToTableResult
 * @property {Array<DocxToTableResultRow>} rows
 */

/**
 *
 * @param {*} file
 * @returns {Promise<{data: DocxToTableResult|undefined, err: string|undefined}>}
 */
export const docxToTable = async (file) => {
  try {
    const rows = [];
    const buffer = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const dom = cheerio.load(value);

    dom("tr").each((_, tr) => {
      const cols = [];
      rows.push({ cols });
      dom("td", null, tr).each((_, td) => {
        const texts = getAllTextNodes(dom, td);
        cols.push({ texts });
      });
    });

    return { data: rows };
  } catch (e) {
    console.error(`parseDocx: ${e.toString()}`);
    return { err: e.toString() };
  }
};
