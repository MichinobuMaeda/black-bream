import { logger } from "firebase-functions/v2";
import {
  getMimeTypes,
  getMediaAsBlob,
  httpRequest,
  joinLines,
} from "./utils.js";
import { Provider } from "./provider.js";

export class WordPress extends Provider {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   * @param {import("@google-cloud/storage").Bucket} bucket
   */
  constructor(db, bucket) {
    super(db, bucket);
    this.id = "wordpress";
  }

  /**
   * Upload image
   *
   * @param {string} service
   * @param {string} auth
   * @param {string} id
   * @param {string} file
   * @returns Promise<{err: undefined|Error, data: string|undefined}>
   */
  async uploadImage(service, auth, id, file) {
    const blob = await getMediaAsBlob(this.bucket, id, file);

    if (blob.err) {
      return blob;
    }

    const mediaType = getMimeTypes(file);

    // const form = new FormData();
    // form.append("media", blob.data, file);
    logger.info(
      `wordpress post media: ${file} ${mediaType} ${blob.data.size} bytes`,
    );

    const name = new Date().toISOString().replace(/\D/g, "");
    const ext = file.replace(/.*\./, "");

    const resp = await httpRequest(`${service}/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": `${mediaType}`,
        "Content-Disposition": `attachment; filename=${name}.${ext}`,
      },
      body: Buffer.from(await blob.data.arrayBuffer(), "binary"),
    });

    if (resp.err) {
      const message = await resp.data.text();
      return { err: `${resp.err} ${message}` };
    }

    const json = await resp.data.json();
    logger.info(
      `wordpress upload media: ${resp.data.status} ${JSON.stringify(json)}`,
    );

    return { data: json };
  }

  /**
   * post
   *
   * @param {string} id
   * @param {{ text:string, title:string, message:string, link:string, files: array|undefined }} data
   * @returns {Promise<{err: undefined|Error}>}
   */
  async post(
    id,
    { text, title, message, link, files, date, categories, author },
  ) {
    const params = await this.getParams();

    if (params.err) {
      return params;
    }

    const { service, identifier, password, category } = params.data;
    const auth = Buffer.from(`${identifier}:${password}`).toString("base64");

    const medias = [];

    if (files?.length) {
      const image = await this.uploadImage(service, auth, id, files[0]);

      if (image.err) {
        return image;
      }
      medias.push(image.data);
    }

    const content =
      joinLines(text, message, link)
        .split("\n")
        .map(
          (line) => `
<!-- wp:paragraph -->
<p>${line}</p>
<!-- /wp:paragraph -->`,
        )
        .join("\n") +
      medias
        .map(
          (media) => `
<!-- wp:image {"id":${media.id},"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large">
  <img src="${media.source_url}" alt="" class="wp-image-${media.id}"/>
</figure>
<!-- /wp:image -->`,
        )
        .join("\n");

    const body = {
      title,
      content,
      status: "publish",
      categories: categories?.length ? categories : [category],
    };
    if (date) {
      body.date = date;
    }
    if (author) {
      body.author = author;
    }

    const resp = await httpRequest(`${service}/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    if (resp.err) {
      return { err: resp.err };
    }

    return { err: undefined };
  }
}
