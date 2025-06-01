import { format, startOfMinute, add, max } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { Timestamp } from "firebase/firestore";

export const DEFAULT_TZ = "Asia/Tokyo";

const DT_SHORT = "yyyy-MM-dd";
const DT_MIDDLE = "yyyy-MM-dd HH:mm";
const DT_LONG = "yyyy-MM-dd(cccccc)HH:mm";

export class LocalizedDateTime {
  /**
   * @param {TZDate} dt
   * @param {string} locale
   * @param {string} tz
   * @param {Object} sch
   * @constructor
   */
  constructor(dt, locale, tz, sch) {
    /** @type {TZDate} */
    this.dt = dt;
    /** @type {string} */
    this.locale = locale;
    /** @type {string} */
    this.tz = tz;
    /** @type {Object} */
    this.sch = sch;
  }

  /**
   * @param {string} locale
   * @param {Object} conf
   * @param {number|string|Date|Timestamp} [seed]
   * @return {LocalizedDateTime}
   */
  static factory(locale, { tz, preDefinedSchedules }, seed) {
    console.log("factory", seed);
    return new LocalizedDateTime(
      seed
        ? typeof seed === "number"
          ? new TZDate(
              seed > 100000000000 ? seed : seed * 1000,
              tz || DEFAULT_TZ,
            )
          : typeof seed === "string"
            ? /^\d+\D\d+\D\d+$/.test(seed)
              ? new TZDate(
                  Number(seed.split(/\D/)[0]),
                  Number(seed.split(/\D/)[1]) - 1,
                  Number(seed.split(/\D/)[2]),
                  tz || DEFAULT_TZ,
                )
              : /^\d+\D\d+\D\d+\D\d+\D\d+$/.test(seed)
                ? new TZDate(
                    Number(seed.split(/\D/)[0]),
                    Number(seed.split(/\D/)[1]) - 1,
                    Number(seed.split(/\D/)[2]),
                    Number(seed.split(/\D/)[3]),
                    Number(seed.split(/\D/)[4]),
                    tz || DEFAULT_TZ,
                  )
                : /^\d+\D\d+\D\d+\D\d+\D\d+\D\d+/.test(seed)
                  ? new TZDate(
                      Number(seed.split(/\D/)[0]),
                      Number(seed.split(/\D/)[1]) - 1,
                      Number(seed.split(/\D/)[2]),
                      Number(seed.split(/\D/)[3]),
                      Number(seed.split(/\D/)[4]),
                      Number(seed.split(/\D/)[5]),
                      tz || DEFAULT_TZ,
                    )
                  : undefined
            : seed instanceof Date
              ? new TZDate(seed, tz || DEFAULT_TZ)
              : seed instanceof Timestamp
                ? new TZDate(seed.toDate(), tz || DEFAULT_TZ)
                : undefined
        : new TZDate(new Date(), tz || DEFAULT_TZ),
      locale,
      tz || DEFAULT_TZ,
      preDefinedSchedules ?? {},
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

    let base = add(startOfMinute(this.dt), {
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
      this.tz,
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
