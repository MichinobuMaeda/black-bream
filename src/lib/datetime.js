import { format, set, add, max } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { Timestamp } from "firebase/firestore";

export const SYSTEM_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";

const DT_SHORT = "yyyy-MM-dd";
const DT_MIDDLE = "yyyy-MM-dd HH:mm";
const DT_LONG = "yyyy-MM-dd(cccccc)HH:mm";

export class LocalizedDateTime {
  /**
   * @param {Date} dt
   * @param {string} locale
   * @param {Object} schedules
   * @constructor
   */
  constructor(dt, locale, schedules) {
    this.dt = dt;
    this.locale = locale;
    this.sch = schedules;
  }

  /**
   * @param {string} locale
   * @param {Object} schedules
   * @param {number|string|Date|Timestamp} [seed]
   * @return {LocalizedDateTime}
   */
  static factory(locale, preDefinedSchedules, seed) {
    console.log("factory", seed);
    return new LocalizedDateTime(
      seed
        ? typeof seed === "number"
          ? new Date(seed > 100000000000 ? seed : seed * 1000)
          : typeof seed === "string"
            ? toZonedTime(seed, SYSTEM_TZ)
            : seed instanceof Date
              ? seed
              : seed instanceof Timestamp
                ? seed.toDate()
                : undefined
        : new Date(),
      locale,
      preDefinedSchedules,
    );
  }

  /**
   * Format date
   *
   * @returns {string}
   */
  formatDate() {
    return format(this.dt, DT_SHORT, { locale: ja });
  }

  /**
   * Format date and time
   *
   * @returns {string}
   */
  formatDateTime() {
    return format(this.dt, DT_MIDDLE, { locale: ja });
  }

  /**
   * Format date with day of week and time
   *
   * @returns {string}
   */
  formatDateTimeLong() {
    return format(this.dt, DT_LONG, {
      locale: this.locale === "ja" ? ja : enUS,
    });
  }

  /**
   * Get the next or previous schedule from the predefined schedules.
   *
   * @param {number} [delta] 1 or -1
   * @returns {LocalizedDateTime}
   */
  getNextOrPreviousSchedule(delta) {
    if (
      this.sch.wd.length === 0 ||
      this.sch.h.length === 0 ||
      this.sch.m.length === 0
    ) {
      return this;
    }

    let base = add(set(this.dt, { seconds: 0, milliseconds: 0 }), {
      minutes: delta < 0 ? -1 : 1,
    });
    while (
      !this.sch.wd.includes(base.getDay() % 7) ||
      !this.sch.h.includes(base.getHours()) ||
      !this.sch.m.includes(base.getMinutes())
    ) {
      base = add(base, { minutes: delta < 0 ? -1 : 1 });
    }

    return new LocalizedDateTime(
      max([base, new Date()]),
      this.locale,
      this.sch,
    );
  }

  /**
   * Get the next schedule from the predefined schedules.
   *
   * @returns {LocalizedDateTime}
   */
  getNextSchedule() {
    return this.getNextOrPreviousSchedule(1);
  }

  /**
   * Get the previous schedule from the predefined schedules.
   *
   * @returns {LocalizedDateTime}
   */
  getPrevSchedule() {
    return this.getNextOrPreviousSchedule(-1);
  }
}
