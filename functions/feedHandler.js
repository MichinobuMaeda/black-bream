import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { startOfMinute, addMinutes } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { DEFAULT_TZ } from "./utils.js";

export class FeedHandler {
  /**
   * @constructor
   * @param {FirebaseFirestore.Firestore} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Fetches templates for feeds handler from the database.
   * @returns {Promise<Array>}
   */
  getFeedTemplates() {
    return this.db
      .collection("templates")
      .get()
      .then((snapshot) =>
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (template) =>
              template.feed &&
              template.category &&
              template.targets?.length &&
              !template.deletedAt,
          ),
      );
  }

  /**
   * Unique feed and category pairs from the templates.
   * @param {Array} templates
   * @returns {Array}
   */
  getFeedTargets(templates) {
    return templates
      .map(({ feed, category }) => ({ feed, category }))
      .filter(
        (item, index, self) =>
          !self.some(
            (cmp, i) =>
              item.feed === cmp.feed &&
              item.category === cmp.category &&
              index > i,
          ),
      );
  }

  /**
   * Get a random template for a specific feed and category.
   * @param {Array} templates - The array of template objects.
   * @param {Object} target - The target object containing feed and category.
   * @returns {Object} - A random template object or an empty object if none found.
   */
  getFeedTemplate(templates, { feed, category }) {
    const items = templates.filter(
      (template) => template.feed === feed && template.category === category,
    );

    return items.length ? items[Math.floor(Math.random() * items.length)] : {};
  }

  /**
   * Get feeds based on feed and category.
   * @param {string} feed
   * @param {string} category
   * @returns {Promise<Array>}
   */
  getFeeds(feed, category) {
    return this.db
      .collection("feeds")
      .where("status", "==", "new")
      .get()
      .then((snapshot) =>
        snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item) =>
              item.feed === feed &&
              item.category === category &&
              item.creator &&
              !/(自動|auto)/.test(item.creator) &&
              !item.deletedAt,
          ),
      );
  }

  /**
   * Get the next schedule based on predefined schedules.
   *
   * @param {string} sysTz - The timezone to use for scheduling.
   * @param {TZDate} base - The base date to start from.
   * @param {Object} preDefined - The predefined schedule object
   *    containing arrays of weekdays, hours, and minutes.
   * @returns {TZDate} - The next scheduled date.
   */
  getNextSchedule(sysTz, base, preDefined) {
    if (
      !preDefined?.wd?.length ||
      !preDefined?.h?.length ||
      !preDefined?.m?.length
    ) {
      return base;
    }

    while (
      !preDefined.wd.includes(base.getDay() % 7) ||
      !preDefined.h.includes(base.getHours()) ||
      !preDefined.m.includes(base.getMinutes())
    ) {
      base = addMinutes(base, 1);
    }

    return base;
  }

  /**
   * Get a random feed handle schedule based on predefined schedules.
   *
   * @param {string} sysTz - The timezone to use for scheduling.
   * @param {Object} preDefined - The predefined schedule object
   *    containing arrays of weekdays, hours, and minutes.
   * @returns {TZDate} - A date object representing the scheduled time.
   */
  getFeedHandleSchedule(sysTz, preDefined) {
    let scheduledFor = addMinutes(
      startOfMinute(new TZDate(new Date(), sysTz)),
      1,
    );

    const schIndex = Math.ceil(
      Math.random() *
        ((preDefined?.h?.length ?? 0) + (preDefined?.m?.length ?? 0)),
    );

    for (let i = 0; i < schIndex; i++) {
      scheduledFor = this.getNextSchedule(sysTz, scheduledFor, preDefined);
    }

    return scheduledFor;
  }

  /**
   * Apply the template to the text.
   * @param {string} text - The text to apply the template to.
   * @param {Array} feeds - The array of feed objects to replace the template.
   * @returns {string} - The text with the template applied.
   */
  applyTemplate(text, feeds) {
    return text
      .split("\n")
      .map((line) =>
        /{{\s*title\s*}}/i.test(line)
          ? feeds
              .map((feed) => line.replace(/{{\s*title\s*}}/gi, feed.title))
              .join("\n")
          : line,
      )
      .join("\n");
  }

  /**
   * Handles the feed and category processing.
   *
   * @param {Object} template
   * @param {string} sysTz
   * @param {Object} preDefined
   * @param {Object} target
   * @returns {Promise<{err: undefined|string}>}
   */
  async handleFeedAndCategory(
    { name, text, targets },
    sysTz,
    preDefined,
    { feed, category },
  ) {
    try {
      if (!text || !text.trim() || !targets || !targets.length) {
        logger.warn(
          `Invalid template for feed: ${feed}, category: ${category}`,
        );
        return;
      }

      const feeds = await this.getFeeds(feed, category);
      if (!feeds?.length) {
        return;
      }

      logger.info(JSON.stringify(feeds, null, 2));

      logger.info(
        `Processing feed: ${feed}, category: ${category}, template: ${name}`,
      );

      let scheduledFor = this.getFeedHandleSchedule(sysTz, preDefined);

      await this.db.collection("posts").add({
        text: this.applyTemplate(text, feeds),
        files: [],
        targets: targets.reduce(
          (acc, cur) => ({
            ...acc,
            [cur]: {
              status: "requested",
              createdAt: FieldValue.serverTimestamp(),
            },
          }),
          {},
        ),
        scheduledFor,
        status: "requested",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await Promise.all(
        feeds.map((feed) =>
          this.db.collection("feeds").doc(feed.id).update({
            status: "handled",
            updatedAt: FieldValue.serverTimestamp(),
          }),
        ),
      );
    } catch (error) {
      logger.error(
        `Error processing feed: ${feed}, category: ${category}`,
        error,
      );
      return { err: `Error processing feed: ${feed}, category: ${category}` };
    }
  }

  /**
   * Handles the feeds for the bot.
   * @returns {Promise<{err: undefined|string}>}
   */
  async handleFeeds() {
    const conf = await this.db.collection("service").doc("conf").get();
    const sysTz = conf.get("tz") || DEFAULT_TZ;
    const preDefined = conf.get("preDefinedSchedules");
    const templates = await this.getFeedTemplates();
    const targets = this.getFeedTargets(templates);

    const ret = await Promise.all(
      targets.map(async (target) =>
        this.handleFeedAndCategory(
          this.getFeedTemplate(templates, target),
          sysTz,
          preDefined,
          target,
        ),
      ),
    );
    const err = ret?.filter((r) => r?.err)?.map((r) => r?.err);
    return { err: err.length ? JSON.stringify(err) : undefined };
  }
}
