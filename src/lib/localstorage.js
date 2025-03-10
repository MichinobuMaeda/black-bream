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
  return window.localStorage.getItem(localKeyEmail);
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

/**
 * The key used to store the twitter auth state code in local storage.
 * @constant {string}
 */
const localKeyTwitterState = "black_bream_twitter_state";

/**
 * Load the twitter auth state code from the local storage
 *
 * @returns {string}
 */
export const loadTwitterState = () => {
  return window.localStorage.getItem(localKeyTwitterState);
};

/**
 * Save the twitter auth state code to the local storage
 *
 * @param {string} value
 * @returns {void}
 */
export const saveTwitterState = (value) => {
  window.localStorage.setItem(localKeyTwitterState, value);
};

/**
 * The key used to store the twitter auth challenge code in local storage.
 * @constant {string}
 */
const localKeyTwitterChallenge = "black_bream_twitter_challenge";

/**
 * Load the twitter auth state code from the local storage
 *
 * @returns {string}
 */
export const loadTwitterChallenge = () => {
  return window.localStorage.getItem(localKeyTwitterChallenge);
};

/**
 * Save the twitter auth state code to the local storage
 *
 * @param {string} value
 * @returns {void}
 */
export const saveTwitterChallenge = (value) => {
  window.localStorage.setItem(localKeyTwitterChallenge, value);
};

/**
 * The key used to store the tumblr auth state code in local storage.
 * @constant {string}
 */
const localKeyTumblrState = "black_bream_tumblr_state";

/**
 * Load the tumblr auth state code from the local storage
 *
 * @returns {string}
 */
export const loadTumblrState = () => {
  return window.localStorage.getItem(localKeyTumblrState);
};

/**
 * Save the tumblr auth state code to the local storage
 *
 * @param {string} value
 * @returns {void}
 */
export const saveTumblrState = (value) => {
  window.localStorage.setItem(localKeyTumblrState, value);
};
