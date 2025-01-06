/**
 * The key used to store the locale setting in local storage.
 * @constant {string}
 */
const localKeyLocale = "black_bream_locale";

/**
 * Load the locale from the local storage
 *
 * @returns {string}
 */
export const loadLocale = () => {
  return window.localStorage.getItem(localKeyLocale) ?? "ja";
};

/**
 * Save the locale to the local storage
 *
 * @param {string} value
 * @returns {void}
 */
export const saveLocale = (value) => {
  window.localStorage.setItem(localKeyLocale, value);
};

/**
 * The key used to save the user's email in local storage.
 * @constant {string}
 */
const localKeyEmail = "black_bream_email";

/**
 * Load the email from the local storage
 *
 * @returns {string}
 */
export const loadEmail = () => {
  return window.localStorage.getItem(localKeyEmail) ?? "ja";
};

/**
 * Remove the email from the local storage
 *
 * @returns {void}
 */
export const removeEmail = () => {
  window.localStorage.removeItem(localKeyEmail);
};

/**
 * Save the email to the local storage
 *
 * @param {string} value
 * @returns {void}
 */
export const saveEmail = (value) => {
  window.localStorage.setItem(localKeyEmail, value);
};
