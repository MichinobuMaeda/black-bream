import { logger } from "firebase-functions/v2";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
import { decode } from "html-entities";
import { httpRequest } from "./utils.js";

const linkToId = (link) =>
  crypto
    .createHash("sha256")
    .update(link)
    .digest("base64")
    .replace(/[^0-9A-Za-z]/g, "");

export class FeedReader {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Returns a promise that resolves to an array of unique feed URLs.
   * @returns {Promise<Array<string>>}
   */
  async getFeedUrls() {
    return this.db
      .collection("templates")
      .get()
      .then((snapshot) =>
        snapshot.docs
          .map((doc) => doc.get("feed"))
          .filter(
            (feed, index, self) =>
              feed && !self.some((f, i) => f === feed && i < index),
          ),
      );
  }

  /**
   * Reads an RSS feed from a URL.
   *
   * @param {string} url - The URL of the RSS feed.
   * @returns {Promise<{err: undefined|string}>}
   */
  async readFeed(url) {
    logger.info(`Reading feed: ${url}`);
    const { data, err } = await httpRequest(url);
    if (err) {
      logger.error(`${url} ${err}`);
      return { err: `${url} ${err}` };
    }

    const xml = await data.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      allowBooleanAttributes: true,
    });
    const output = parser.parse(xml);
    let items = [];

    if (output.rss) {
      const feed = output.rss.channel;
      items = feed.item.map((item) => ({
        title: decode(item.title),
        link: item.link,
        description: decode(item.description),
        pubDate: Timestamp.fromDate(new Date(item.pubDate)),
        category: decode(item.category),
      }));
    } else if (output.feed) {
      const feed = output.feed;
      items = feed.entry.map((item) => ({
        title: decode(item.title["#text"]),
        link: item.link["@_href"],
        description: decode(item.summary["#text"]),
        pubDate: Timestamp.fromDate(new Date(item.updated)),
        category: decode(item.category["@_term"]),
      }));
    } else {
      console.error("Invalid feed format", url);
    }

    await Promise.all(
      items.map(async (item) => {
        const id = linkToId(item.link);
        const ref = this.db.collection("feeds").doc(id);
        const data = {
          ...item,
          feed: url,
          status: "new",
          updatedAt: FieldValue.serverTimestamp(),
        };
        const doc = await ref.get();
        logger.info(`Feed item ${item.link}`);

        if (doc.exists) {
          await ref.update(data);
        } else {
          await ref.set({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }),
    );
  }

  /**
   * Get feeds from service/conf and read them
   * @returns {Promise<{err: undefined|string}>}
   */
  async readAll() {
    const ret = await Promise.all(
      (await this.getFeedUrls()).map((feed) => this.readFeed(feed)),
    );
    const err = ret?.filter((r) => r?.err)?.map((r) => r?.err);
    return { err: err.length ? JSON.stringify(err) : undefined };
  }
}
