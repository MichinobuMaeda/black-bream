/**
 * Format a date object to an ISO string with the browser timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatISO = (date) =>
  date instanceof Date
    ? new Date(
        date.setHours(date.getHours() - new Date().getTimezoneOffset() / 60),
      )
        .toISOString()
        .substring(0, 16)
    : null;

/**
 * Format a date object with the browser timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatDateTime = (date) =>
  date instanceof Date ? formatISO(date).replace("T", " ") : null;

/**
 * Get the next schedule from the predefined schedules.
 *
 * @param {object} preDefined
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
