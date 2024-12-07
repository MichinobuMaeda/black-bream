/**
 * Validate password
 * @param {string} str
 * @returns {boolean}
 */
export const validatePassword = (str) =>
  (typeof str === "string" || str instanceof String) &&
  str.length >= 8 &&
  (str.match(/[a-z]/) ? 1 : 0) +
    (str.match(/[A-Z]/) ? 1 : 0) +
    (str.match(/[0-9]/) ? 1 : 0) +
    (str.match(/[^a-zA-Z0-9]/) ? 1 : 0) >=
    3;
