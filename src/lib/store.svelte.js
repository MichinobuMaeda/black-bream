/* global $state, $derived, $effect */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import { messages } from "./i18n.svelte";

const localeKeyEmail = "black_bream_email";
const localeKey = "black_bream_locale";

import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (import.meta.env.DEV) {
  console.log("connect to emulator");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem(localeKeyEmail);
  if (email) {
    console.log(`signInWithEmailLink(${email})`);
    await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem(localeKeyEmail);
    if (window.location.href.includes("?")) {
      window.location.replace(window.location.href.split("?")[0]);
    }
  }
}

console.log("init auth");
auth.onAuthStateChanged((user) => {
  authUser = user;
  console.log(`authUser: ${authUser?.uid ?? authUser}`);
});

console.log("init conf");
onSnapshot(doc(db, "service", "conf"), (doc) => {
  conf = doc.data();
  console.log(`conf: ${conf === undefined ? "undefined" : "loaded"}`);
});

let authUser = $state(undefined);
let conf = $state(undefined);
let user = $state(undefined);
let users = $state([]);
let groups = $state([]);
let locale = $state(localStorage.getItem(localeKey) ?? "ja");

let admin = $derived(
  groups.find((group) => group.id === "admins")?.users.includes(user?.id) ??
    false,
);
let manager = $derived(
  groups.find((group) => group.id === "managers")?.users.includes(user?.id) ??
    false,
);

/** @type {import("firebase/auth").Unsubscribe|null} */
let usersUnsub = null;

/** @type {import("firebase/auth").Unsubscribe|null} */
let groupsUnsub = null;

/**
 * Unsubscribe user data
 * @return {Promise<string|null>}
 */
async function unsubscribeUserData() {
  try {
    console.log("unsubscribeUserData()");

    if (usersUnsub) {
      usersUnsub();
      usersUnsub = null;
      users = [];
    }

    if (groupsUnsub) {
      groupsUnsub();
      groupsUnsub = null;
      groups = [];
    }

    if (authUser) {
      await signOut(auth);
    }

    return null;
  } catch (error) {
    console.error(`unsubscribeUserData: ${error}`);
    return "error";
  }
}

/**
 * Subscribe user data
 */
function subscribeUserData() {
  console.log("subscribeUserData()");

  usersUnsub = onSnapshot(
    collection(db, "users"),
    (snap) => {
      users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    (error) => {
      console.error(`groups: ${error}`);
      unsubscribeUserData();
      users = [];
    },
  );

  groupsUnsub = onSnapshot(
    collection(db, "groups"),
    (snap) => {
      groups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    (error) => {
      console.error(`groups: ${error}`);
      unsubscribeUserData();
      groups = [];
    },
  );
}

export const store = {
  get authUser() {
    return authUser;
  },
  get conf() {
    return conf;
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
  get users() {
    return users;
  },
  get groups() {
    return groups;
  },
  get locale() {
    return locale;
  },
  set locale(value) {
    locale = value;
  },
};

let localizedMessage = $derived(messages[locale]);
export const m = () => localizedMessage;

export const activateStore = () => {
  console.log("activateStore()");

  $effect(() => {
    if (conf && authUser) {
      subscribeUserData();
    }
  });

  $effect(() => {
    if (authUser && users.length && groups.length) {
      user = users.find((user) => user.id === authUser.uid && !user.deletedAt);

      if (!user) {
        unsubscribeUserData();
      }

      console.log(`user: ${user?.id ?? user}`);
    } else {
      user = undefined;
    }
  });

  $effect(() => {
    localStorage.setItem(localeKey, locale);
    auth.languageCode = locale;
  });
};

/**
 * Update document
 * @param {string} col
 * @param {string} id
 * @param {object} data
 * @return {Promise<string|null>}
 */
export const updateDocument = async (col, id, data) => {
  try {
    await updateDoc(doc(db, col, id), {
      ...data,
      updatedAt: new Date(),
    });

    return null;
  } catch (error) {
    console.error(`updateDocument: ${error}`);
    return "error";
  }
};

/**
 * Create document
 * @param {string} col
 * @param {object} data
 * @return {Promise<string|null>}
 */
export const createDocument = async (col, data) => {
  try {
    await addDoc(collection(db, col), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return null;
  } catch (error) {
    console.error(`createDocument: ${error}`);
    return "error";
  }
};

/**
 * Login with email link
 * @param {string} email
 * @param {string} url
 * @return {Promise<string|null>}
 */
export const loginWithEmailLink = async (email, url) => {
  try {
    await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    localStorage.setItem(localeKeyEmail, email);

    return null;
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/invalid-email")
    ) {
      return "credentialError";
    }
    console.error(`login: ${error}`);
    return "error";
  }
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @return {Promise<string|null>}
 */
export const loginWithPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);

    return null;
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/wrong-password") ||
      messages.includes("auth/invalid-email")
    ) {
      return "credentialError";
    }
    console.error(`login: ${error}`);
    return "error";
  }
};

/**
 * Logout
 *
 * @param {function} next
 * @return {Promise<string|null>}
 */
export const logout = async (next) => {
  try {
    await unsubscribeUserData();
    next();

    return null;
  } catch (error) {
    console.error(`logout: ${error}`);
    return "error";
  }
};

/**
 * Send password reset link
 *
 * @param {string|undefined} email
 * @return {Promise<string|null>}
 */
export const sendPasswordResetLink = async (email = null) => {
  try {
    await sendPasswordResetEmail(auth, email || authUser.email);

    return null;
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/invalid-email")
    ) {
      return "credentialError";
    }
    console.error(`login: ${error}`);
    return "error";
  }
};

/**
 * Change password
 * @param {string} originalPassword
 * @param {string} newPassword
 * @return {Promise<string|null>}
 */
export const changePassword = async (originalPassword, newPassword) => {
  try {
    await signInWithEmailAndPassword(auth, authUser.email, originalPassword);
    await updatePassword(authUser, newPassword);

    return null;
  } catch (error) {
    console.error(`changePassword: ${error}`);
    return "error";
  }
};

/**
 * Check if the user name is unique
 * @param {string|null} id
 * @param {string} name
 * @return {boolean}
 */
export const isUniqueUserName = (id, name) =>
  store.users.find(
    (user) => user.id !== id && user.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Check if the group name is unique
 * @param {string|null} id
 * @param {string} name
 * @return {boolean}
 */
export const isUniqueGroupName = (id, name) =>
  store.groups.find(
    (group) => group.id !== id && group.name === (name ?? "").trim(),
  ) === undefined;
