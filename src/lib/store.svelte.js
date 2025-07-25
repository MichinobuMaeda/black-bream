/* global $state, $derived */
import { I18n, DaysOfWeek } from "../i18n.js";
import { localstorage } from "./localstorage.js";
import { LocalizedDateTime } from "./datetime.js";

let locale = $state(localstorage.locale.load());

let i18n = $derived(new I18n(locale));
export const t = () => i18n;

let daysOfWeek = $derived(new DaysOfWeek(locale));
export const dow = () => daysOfWeek;

let authUser = $state(undefined);
let conf = $state(undefined);
let auth = $state(undefined);
let users = $state([]);
let groups = $state([]);
let posts = $state([]);
let templates = $state([]);
let generators = $state([]);
let logs = $state([]);
let me = $state(undefined);
let admin = $derived(isMemberOf(me?.id, "admins"));
let manager = $derived(isMemberOf(me?.id, "managers"));
let operator = $derived(isMemberOf(me?.id, "operators"));
let menu = $state(false);
let test = $state(false);

/**
 * Create DateTime object from seed
 *
 * @param {number|string|Date|Timestamp} [seed]
 * @returns {LocalizedDateTime}
 */
export const dt = (seed) => LocalizedDateTime.factory(locale, conf ?? {}, seed);

export const store = {
  get locale() {
    return locale;
  },
  set locale(value) {
    locale = value;
  },
  get authUser() {
    return authUser;
  },
  set authUser(value) {
    authUser = value;
  },
  get conf() {
    return conf;
  },
  set conf(value) {
    conf = value;
  },
  get auth() {
    return auth;
  },
  set auth(value) {
    auth = value;
  },
  get users() {
    return users;
  },
  set users(value) {
    users = value;
  },
  get groups() {
    return groups;
  },
  set groups(value) {
    groups = value;
  },
  get posts() {
    return posts;
  },
  set posts(value) {
    posts = value;
  },
  get templates() {
    return templates;
  },
  set templates(value) {
    templates = value;
  },
  get generators() {
    return generators;
  },
  set generators(value) {
    generators = value;
  },
  get logs() {
    return logs;
  },
  set logs(value) {
    logs = value;
  },
  get me() {
    return me;
  },
  set me(value) {
    me = value;
  },
  get admin() {
    return admin;
  },
  get manager() {
    return manager;
  },
  get operator() {
    return operator;
  },
  get menu() {
    return menu;
  },
  set menu(value) {
    menu = value;
  },
  get test() {
    return test;
  },
  set test(value) {
    test = value;
  },
};

/**
 * Whether the given user is a member of the given group
 *
 * @param {string} userId
 * @param {string} groupId
 * @returns {boolean}
 */
export const isMemberOf = (userId, groupId) =>
  !!store.groups.some(
    (group) => group.id === groupId && group.users.includes(userId),
  );

/**
 * Save the locale to local storage
 */
export const saveLocale = () => {
  if (store.locale !== localstorage.locale.load()) {
    console.log(`Save locale: ${store.locale} to local storage`);
    localstorage.locale.save(store.locale);
  }
};

/**
 * Check if the user name is unique
 *
 * @param {string} name
 * @param {string} [id]
 * @returns {boolean}
 */
export const isUniqueUserName = (name, id = null) =>
  store.users.find(
    (user) => user.id !== id && user.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Check if the group name is unique
 *
 * @param {string} name
 * @param {string} [id]
 * @returns {boolean}
 */
export const isUniqueGroupName = (name, id = null) =>
  store.groups.find(
    (group) => group.id !== id && group.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Groups which user belong to
 *
 * @param {string} uid
 * @returns {array}
 */
export const groupsOfUser = (uid) =>
  store.groups.filter(
    (group) =>
      (manager || !group.deletedAt) && (group.users ?? []).includes(uid),
  );
