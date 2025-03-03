/* global $state, $derived */
import { I18n } from "./i18n.js";

let locale = $state("ja");
let i18n = $derived(new I18n(locale));

export const t = () => i18n;

let authUser = $state(undefined);
let conf = $state(undefined);
let auth = $state(undefined);
let users = $state([]);
let groups = $state([]);
let posts = $state([]);
let templates = $state([]);
let user = $state(undefined);
let admin = $state(false);
let manager = $state(false);
let operator = $state(false);

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
  get user() {
    return user;
  },
  set user(value) {
    user = value;
  },
  get admin() {
    return admin;
  },
  set admin(value) {
    admin = value;
  },
  get manager() {
    return manager;
  },
  set manager(value) {
    manager = value;
  },
  get operator() {
    return operator;
  },
  set operator(value) {
    operator = value;
  },
};
