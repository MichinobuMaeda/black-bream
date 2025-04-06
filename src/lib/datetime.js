/**
 * Format a date object to YYYY-MM-DD HH:mm string of the browser timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatDateTime = (date) =>
  date instanceof Date
    ? new Date(
        date.setHours(date.getHours() - new Date().getTimezoneOffset() / 60),
      )
        .toISOString()
        .substring(0, 16)
        .replace("T", " ")
    : null;

/**
 * Format a date object to YYYY-MM-DD(dow)HH:mm string of the browser timezone.
 *
 * @param {Date} date
 * @param {import("../i18n").DaysOfWeek} daysOfWeek
 * @returns
 */
export const formatLongDateTime = (date, daysOfWeek) =>
  date instanceof Date
    ? formatDateTime(date).replace(" ", `(${daysOfWeek.short(date.getDay())})`)
    : null;

/**
 * Get the next schedule from the predefined schedules.
 *
 * @param {Object} preDefined
 * @param {string} base
 * @param {number} [delta] 1 or -1
 */
export const getNextPreDefinedSchedule = (preDefined, base, delta = 1) => {
  const date = new Date(base);
  date.setSeconds(0);
  date.setMinutes(date.getMinutes() + (delta < 0 ? -1 : 1));
  while (
    !preDefined.wd.includes(date.getDay()) ||
    !preDefined.h.includes(date.getHours()) ||
    !preDefined.m.includes(date.getMinutes())
  ) {
    date.setMinutes(date.getMinutes() + (delta < 0 ? -1 : 1));
  }
  const now = new Date();
  return date < now ? now : date;
};
