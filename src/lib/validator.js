/**
 * Validate email
 * https://emailregex.com/
 *
 * @param {string} str
 * @returns {boolean}
 */
export const validateEmail = (str) =>
  (typeof str === "string" || str instanceof String) &&
  str.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );

/**
 * Validate password
 *
 * @param {string} str
 * @returns {boolean}
 */
export const validatePassword = (str) =>
  (typeof str === "string" || str instanceof String) &&
  str.length >= 8 &&
  str.match(/[a-z]/) &&
  str.match(/[A-Z]/) &&
  str.match(/[0-9]/) &&
  str.match(/[^a-zA-Z0-9]/);
