/* global $state, $derived */
import { I18n } from "./i18n.js";

let locale = $state("ja");
let i18n = $derived(new I18n(locale));

export const t = () => i18n;

let authUser = $state(undefined);
let conf = $state(undefined);
let users = $state([]);
let groups = $state([]);
let posts = $state([]);
let user = $derived(
  authUser && users.length && groups.length
    ? users.find(
        (user) =>
          user.id === authUser.uid && !user.deletedAt && !user.restrictedAt,
      )
    : undefined,
);
let admin = $derived(
  groups.find((group) => group.id === "admins")?.users.includes(user?.id) ??
    false,
);
let manager = $derived(
  groups.find((group) => group.id === "managers")?.users.includes(user?.id) ??
    false,
);
let operator = $derived(
  groups.find((group) => group.id === "operators")?.users.includes(user?.id) ??
    false,
);

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
  get user() {
    return user;
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
};
