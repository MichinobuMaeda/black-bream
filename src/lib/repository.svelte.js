/* global $effect */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  sendPasswordResetEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";

import { store } from "./store.svelte.js";
import { config, region } from "../firebaseConfig";

const localKeyEmail = "black_bream_email";

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, region);

/**
 * Set locale of firebase auth
 *
 * @param {string} locale
 */
export const setAuthLocale = (locale) => {
  auth.languageCode = locale;
};

if (
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0.0.1")
) {
  console.log("connect to emulator");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem(localKeyEmail);
  if (email) {
    console.log(`signInWithEmailLink(${email})`);
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        window.localStorage.removeItem(localKeyEmail);
        if (window.location.href.includes("?")) {
          window.location.replace(window.location.href.split("?")[0]);
        }
      })
      .catch((e) => {
        console.error(`signInWithEmailLink: ${e}`);
      });
  }
}

console.log("init auth");
auth.onAuthStateChanged((user) => {
  store.authUser = user;
  console.log(`authUser: ${store.authUser?.uid ?? store.authUser}`);
});

console.log("init conf");
onSnapshot(doc(db, "service", "conf"), (doc) => {
  store.conf = doc.data();
  console.log(`conf: ${store.conf === undefined ? "undefined" : "loaded"}`);
});

/** @type {import("firebase/auth").Unsubscribe|null} */
let usersUnsub = null;

/** @type {import("firebase/auth").Unsubscribe|null} */
let groupsUnsub = null;

/**
 * Unsubscribe user data
 *
 * @return {Promise<object>}
 */
const unsubscribeUserData = async () => {
  try {
    console.log("unsubscribeUserData()");

    if (usersUnsub) {
      usersUnsub();
      usersUnsub = null;
      store.users = [];
    }

    if (groupsUnsub) {
      groupsUnsub();
      groupsUnsub = null;
      store.groups = [];
    }

    if (store.authUser) {
      await signOut(auth);
    }

    return { err: undefined };
  } catch (error) {
    console.error(`unsubscribeUserData: ${error}`);
    return { err: "error" };
  }
};

/**
 * Subscribe user's data
 *
 * @return {void}
 */
const subscribeUserData = () => {
  if (!usersUnsub) {
    usersUnsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        store.users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      (error) => {
        console.error(`onSnapshot users: ${error}`);
        unsubscribeUserData();
      },
    );
  }

  if (!groupsUnsub) {
    groupsUnsub = onSnapshot(
      collection(db, "groups"),
      (snap) => {
        store.groups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      (error) => {
        console.error(`onSnapshot groups: ${error}`);
        unsubscribeUserData();
      },
    );
  }
};

/**
 * Activate repository
 *
 * @return {void}
 */
export const activateRepository = () => {
  console.log("activateStore()");

  $effect(() => {
    if (store.conf && store.authUser) {
      subscribeUserData(store);
    }
  });

  $effect(() => {
    if (store.authUser && store.users.length && store.groups.length) {
      store.user = store.users.find(
        (user) => user.id === store.authUser.uid && !user.deletedAt,
      );

      if (!store.user) {
        unsubscribeUserData(store);
      }

      console.log(`user: ${store.user?.id ?? store.user}`);
    } else {
      store.user = undefined;
    }
  });
};

/**
 * Update document
 *
 * @param {string} col
 * @param {string} id
 * @param {object} data
 * @return {Promise<object>}
 */
export const updateDocument = async (col, id, data) => {
  try {
    await updateDoc(doc(db, col, id), {
      ...data,
      updatedAt: new Date(),
    });

    return { err: undefined };
  } catch (error) {
    console.error(`updateDocument: ${error}`);
    return { err: "error" };
  }
};

/**
 * Create document
 *
 * @param {string} col
 * @param {object} data
 * @return {Promise<object>}
 */
export const createDocument = async (col, data) => {
  try {
    const ref = await addDoc(collection(db, col), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { err: undefined, data: ref.id };
  } catch (error) {
    console.error(`createDocument: ${error}`);
    return { err: "error", data: undefined };
  }
};

/**
 * Login with email link
 *
 * @param {string} email
 * @param {string} url
 * @return {Promise<object>}
 */
export const loginWithEmailLink = async (email, url) => {
  try {
    await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    localStorage.setItem(localKeyEmail, email);

    return { err: undefined };
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/invalid-email")
    ) {
      return { err: "credentialError" };
    }
    console.error(`loginWithEmailLink: ${error}`);
    return { err: "error" };
  }
};

/**
 * Login with email and password
 *
 * @param {string} email
 * @param {string} password
 * @return {Promise<object>}
 */
export const loginWithPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);

    return { err: undefined };
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/wrong-password") ||
      messages.includes("auth/invalid-email")
    ) {
      return { err: "credentialError" };
    }
    console.error(`loginWithPassword: ${error}`);
    return { err: "error" };
  }
};

/**
 * Logout
 *
 * @param {function|null} next
 * @return {Promise<object>}
 */
export const logout = async (next = null) => {
  try {
    await unsubscribeUserData(store);

    if (next) {
      await next();
    }

    return { err: undefined };
  } catch (e) {
    console.error(`logout: ${e}`);
    return { err: e.toString() };
  }
};

/**
 * Send password reset link
 *
 * @param {string|undefined} email
 * @return {Promise<object>}
 */
export const sendPasswordResetLink = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);

    return { err: undefined };
  } catch (error) {
    const messages = `${error}`;
    if (
      messages.includes("auth/user-not-found") ||
      messages.includes("auth/invalid-email")
    ) {
      return { err: "credentialError" };
    }
    console.error(`login: ${error}`);
    return { err: "error" };
  }
};

/**
 * Change password
 *
 * @param {string} currentPassword
 * @param {string} newPassword
 * @return {Promise<object>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await signInWithEmailAndPassword(
      auth,
      store.authUser.email,
      currentPassword,
    );
    await updatePassword(store.authUser, newPassword);

    return { err: undefined };
  } catch (e) {
    console.error(`changePassword: ${e}`);
    return { err: e.toString() };
  }
};

/**
 * Check if the user name is unique
 *
 * @param {string} name
 * @param {string|null} id
 * @return {boolean}
 */
export const isUniqueUserName = (name, id = null) =>
  store.users.find(
    (user) => user.id !== id && user.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Check if the group name is unique
 *
 * @param {string|null} id
 * @param {string} name
 * @return {boolean}
 */
export const isUniqueGroupName = (id, name) =>
  store.groups.find(
    (group) => group.id !== id && group.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Call function
 * @param {string} name
 * @param {object} param
 * @return {Promise<object>}
 */
export const callFunction = async (name, param) => {
  try {
    const f = httpsCallable(functions, name);
    const { data } = await f(param);
    return data;
  } catch (e) {
    console.error(`{name}: ${e}`);
    return { err: "error", data: undefined };
  }
};

/**
 * Groups which user belong to
 *
 * @param {string} uid
 * @return {array}
 */
export const groupsOfUser = (uid) =>
  store.groups.filter(
    (group) =>
      (store.manager || !group.deletedAt) && (group.users ?? []).includes(uid),
  );
