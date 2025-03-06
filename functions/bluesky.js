const { logger } = require("firebase-functions/v2");
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");

const {
  generateLinkCard,
  getMimeTypes,
  getMediaAsUint8Array,
  reduceImageSize,
} = require("./utils");

/**
 * Post to Bluesky
 *
 * @param {Bucket} bucket
 * @param {object} params
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const post = async (bucket, params, id, { text, files }) => {
  try {
    const { service, identifier, password } = params;
    const agent = new BskyAgent({ service });
    await agent.login({ identifier, password });

    let image = null;
    let external = undefined;

    if (files?.length) {
      const result = await getMediaAsUint8Array(bucket, id, files[0]);

      if (result.err) {
        return { err: result.err, data: undefined };
      }
      const encoding = getMimeTypes(files[0]);

      const { data } = await agent.uploadBlob(
        reduceImageSize(new Uint8Array(result.data), 1000 * 1000),
        { encoding },
      );

      image = data.blob;
    } else {
      const result = await generateLinkCard(text);

      if (result.data) {
        const { uri, title, description, thumbUrl } = result.data;
        logger.info(uri, title, description, thumbUrl);
        let thumb = undefined;

        if (thumbUrl) {
          const response = await axios.get(thumbUrl, {
            responseType: "arraybuffer",
          });
          const encoding = getMimeTypes(thumbUrl, response.headers);

          if (response.status === 200) {
            const { data } = await agent.uploadBlob(
              reduceImageSize(new Uint8Array(response.data), 1000 * 1000),
              { encoding },
            );
            thumb = data.blob;
          }
        }
        external = { uri, title, description, thumb };
      }
    }

    await agent.post(
      image
        ? {
            text,
            langs: ["ja"],
            embed: {
              $type: "app.bsky.embed.images",
              images: [
                {
                  alt: text.substring(0, 100),
                  image,
                },
              ],
            },
          }
        : external
          ? {
              text,
              langs: ["ja"],
              embed: {
                $type: "app.bsky.embed.external",
                external,
              },
            }
          : { text, langs: ["ja"] },
    );

    return { err: undefined };
  } catch (e) {
    logger.error(e);
    return { err: e.toString() };
  }
};

module.exports = { post };
