import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
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
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";

import { loadEmail, removeEmail, saveEmail } from "./localstorage";
import { config, reCaptchaKey, region } from "../firebaseConfig";

/**
 * Firebase objects
 */
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, region);

if (reCaptchaKey !== "FIREBASE_RECAPTCHA_KEY") {
  // const appCheck =
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(reCaptchaKey),
    isTokenAutoRefreshEnabled: true,
  });
}

/**
 * Initialize firebase connections.
 *
 * @param {string} url
 * @return {void}
 */
export const initFirebaseConnections = (url) => {
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.log("connect to emulator");
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
};

/**
 * Set locale of firebase auth
 *
 * @param {string} locale
 */
export const setAuthLocale = (locale) => {
  auth.languageCode = locale;
};

/**
 * Handle deep links
 *
 * @param {string} url
 * @param {Location} location
 * @return {void}
 */
export const handleDeepLinks = (url, location) => {
  if (isSignInWithEmailLink(auth, url)) {
    let email = loadEmail();
    if (email) {
      console.log(`signInWithEmailLink(${email})`);
      signInWithEmailLink(auth, email, url)
        .then(() => {
          removeEmail();
          if (url.includes("?")) {
            location.replace(url.split("?")[0]);
          }
        })
        .catch((e) => {
          console.error(`signInWithEmailLink: ${e}`);
        });
    }
  }
};

/**
 * Subscribe conf
 *
 * @param {object} store
 * @return {void}
 */
export const subscribeConf = (store) => {
  console.log("init conf");
  onSnapshot(doc(db, "service", "conf"), (doc) => {
    store.conf = { id: doc.id, ...doc.data() };
    console.log(`conf: ${store.conf === undefined ? "undefined" : "loaded"}`);
  });
};

/**
 * Subscribe auth state
 *
 * @param {object} store
 * @return {void }
 */
export const subscribeAuthState = (store) => {
  console.log("init auth");
  auth.onAuthStateChanged((user) => {
    store.authUser = user;
    console.log(`authUser: ${store.authUser?.uid ?? store.authUser}`);
  });
};

/** @type {import("firebase/auth").Unsubscribe|null} */
let usersUnsub = null;

/** @type {import("firebase/auth").Unsubscribe|null} */
let groupsUnsub = null;

/** @type {import("firebase/auth").Unsubscribe|null} */
let postsUnsub = null;

/** @type {import("firebase/auth").Unsubscribe|null} */
let authUnsub = null;

/**
 * Unsubscribe user data
 *
 * @param {object} store
 * @return {Promise<object>}
 */
export const unsubscribeUserData = async (store) => {
  console.log("unsubscribeUserData(store)");
  try {
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

    if (postsUnsub) {
      postsUnsub();
      postsUnsub = null;
      store.posts = [];
    }

    if (postsUnsub) {
      postsUnsub();
      postsUnsub = null;
      store.posts = [];
    }

    if (authUnsub) {
      authUnsub();
      authUnsub = null;
      store.auth = undefined;
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
 * @param {object} store
 * @return {void}
 */
export const subscribeUserData = (store) => {
  console.log("subscribeUserData(store)");

  if (!usersUnsub) {
    usersUnsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        store.users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(`users: ${store.users.length}`);
      },
      (error) => {
        console.error(`onSnapshot users: ${error}`);
        unsubscribeUserData(store);
      },
    );
  }

  if (!groupsUnsub) {
    groupsUnsub = onSnapshot(
      collection(db, "groups"),
      (snap) => {
        store.groups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(`groups: ${store.groups.length}`);
      },
      (error) => {
        console.error(`onSnapshot groups: ${error}`);
        unsubscribeUserData(store);
      },
    );
  }

  if (!postsUnsub) {
    postsUnsub = onSnapshot(
      query(
        collection(db, "posts"),
        orderBy("scheduledFor", "desc"),
        limit(1000),
      ),
      (snap) => {
        store.posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(`posts: ${store.posts.length}`);
      },
      (error) => {
        console.error(`onSnapshot posts: ${error}`);
        unsubscribeUserData(store);
      },
    );
  }

  if (!authUnsub) {
    authUnsub = onSnapshot(
      doc(db, "service", "auth"),
      (doc) => {
        store.auth = { id: doc.id, ...doc.data() };
        console.log(
          `auth: ${store.auth === undefined ? "undefined" : "loaded"}`,
        );
      },
      (error) => {
        console.error(`onSnapshot auth: ${error}`);
        unsubscribeUserData(store);
      },
    );
  }
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
    saveEmail(email);

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
 * @param {object} store
 * @param {function|null} next
 * @return {Promise<object>}
 */
export const logout = async (store, next = null) => {
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
 * @param {object} store
 * @param {string} currentPassword
 * @param {string} newPassword
 * @return {Promise<object>}
 */
export const changePassword = async (store, currentPassword, newPassword) => {
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
 * @param {object} store
 * @param {string} name
 * @param {string} [id]
 * @return {boolean}
 */
export const isUniqueUserName = (store, name, id = null) =>
  store.users.find(
    (user) => user.id !== id && user.name === (name ?? "").trim(),
  ) === undefined;

/**
 * Check if the group name is unique
 *
 * @param {object} store
 * @param {string} name
 * @param {string} [id]
 * @return {boolean}
 */
export const isUniqueGroupName = (store, name, id = null) =>
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
 * Social login
 *
 * @param {string} id
 * @returns
 */
export const socialLogin = async (id) => {
  try {
    let provider;
    switch (id) {
      case "google":
        provider = new GoogleAuthProvider();
        break;
      default:
        return { err: "error" };
    }
    await signInWithPopup(auth, provider);
    return { err: undefined };
  } catch (e) {
    console.error(`socialLogin: ${e}`);
    return { err: "error" };
  }
};

/**
 * Register social login
 *
 * @param {string} id
 * @returns
 */
export const registerSocialLogin = async (id) => {
  try {
    let provider;
    switch (id) {
      case "google":
        provider = new GoogleAuthProvider();
        break;
      default:
        return { err: "error" };
    }
    await linkWithPopup(auth.currentUser, provider);
    return { err: undefined };
  } catch (e) {
    console.error(`socialLogin: ${e}`);
    return { err: "error" };
  }
};

/**
 * Groups which user belong to
 *
 * @param {object} store
 * @param {string} uid
 * @return {array}
 */
export const groupsOfUser = (store, uid) =>
  store.groups.filter(
    (group) =>
      (store.manager || !group.deletedAt) && (group.users ?? []).includes(uid),
  );
