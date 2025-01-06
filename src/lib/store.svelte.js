/* global $state, $derived */

let authUser = $state(undefined);
let conf = $state(undefined);
let user = $state(undefined);
let users = $state([]);
let groups = $state([]);
let admin = $derived(
  groups.find((group) => group.id === "admins")?.users.includes(user?.id) ??
    false,
);
let manager = $derived(
  groups.find((group) => group.id === "managers")?.users.includes(user?.id) ??
    false,
);

export const store = {
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
  get user() {
    return user;
  },
  set user(value) {
    user = value;
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
  get admin() {
    return admin;
  },
  get manager() {
    return manager;
  },
};
