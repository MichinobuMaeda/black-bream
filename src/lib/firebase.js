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
  verifyBeforeUpdateEmail,
  updatePassword,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
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
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { loadEmail, removeEmail, saveEmail } from "./localstorage";
import { config, reCaptchaKey, region } from "../firebaseConfig";

const imageBasePath = "public/posts/";

/**
 * Firebase objects
 */
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, region);
const storage = getStorage(app);

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
    connectStorageEmulator(storage, "127.0.0.1", 9199);
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
 * @param {boolean} [setId]
 * @return {Promise<object>}
 */
export const createDocument = async (col, data, setId = false) => {
  const generateId = () =>
    new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(2) + Math.random().toString(36).slice(-6);
  try {
    const ref = (await setId)
      ? setDoc(doc(db, col, generateId()), {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : addDoc(collection(db, col), {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

    return { err: undefined, data: ref };
  } catch (error) {
    console.error(`createDocument: ${error}`);
    return { err: "error", data: undefined };
  }
};

/**
 * Get URL of the saved image
 *
 * @param {string} id
 * @param {string} name
 * @returns
 */
export const getSavedImageUrl = async (id, name) =>
  getDownloadURL(ref(storage, `${imageBasePath}/${id}/${name}`));

/**
 * Save image to storage
 *
 * @param {string} id
 * @param {File} file
 */
export const savePostImage = async (id, file) => {
  try {
    const ext = file.name.split(".").pop();
    const metadata = {
      contentType: `image/${ext}`,
    };
    const imageRef = ref(storage, `${imageBasePath}/${id}/1.${ext}`);
    console.log(`saveImage: ${imageRef.fullPath}`);
    await uploadBytes(imageRef, file, metadata);

    return { err: undefined };
  } catch (e) {
    console.error(`saveImage: ${e}`);
    return { err: "error" };
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
 * Change email address
 *
 * @param {object} store
 * @param {string} currentPassword
 * @param {string} email
 * @return {Promise<object>}
 */
export const changeEmail = async (store, currentPassword, email) => {
  try {
    await store.authUser.reload();
    await signInWithEmailAndPassword(
      auth,
      store.authUser.email,
      currentPassword,
    );
    await store.authUser.reload();
    await verifyBeforeUpdateEmail(store.authUser, email);

    return { err: undefined };
  } catch (e) {
    console.error(`changeEmail: ${e}`);
    return { err: e.toString() };
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
    await store.authUser.reload();
    await signInWithEmailAndPassword(
      auth,
      store.authUser.email,
      currentPassword,
    );
    await store.authUser.reload();
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

export const postTargets = ["mastodon", "bluesky", "threads", "instagram"];

export const socialLoginProviders = [
  {
    id: "email_link",
    label: "Email Link",
  },
  {
    id: "password_link",
    label: "Password Link",
  },
  {
    id: "google",
    label: "Google",
  },
  {
    id: "github",
    label: "GitHub",
  },
];

/**
 * Social login
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export const socialLogin = async (id) => {
  try {
    let provider;
    switch (id) {
      case "google":
        provider = new GoogleAuthProvider();
        break;
      case "github":
        provider = new GithubAuthProvider();
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
 * @returns {Promise<object>}
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

/**
 * Set Threads long access token
 *
 * @param {string} code
 * @returns {Promise<object>}
 */
export const setThreadsLongAccessToken = async (code) => {
  try {
    console.log(`setThreadsLongAccessToken(${code})`);
    const authRef = doc(db, "service", "auth");
    const auth = await getDoc(authRef);
    const { clientId, clientSecret, callBackUrl } = auth.get("threads");

    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", callBackUrl);
    formData.append("code", code);

    let oauthResp = await fetch(
      "https://graph.threads.net/oauth/access_token",
      {
        method: "POST",
        body: formData,
      },
    );
    if (oauthResp.status !== 200) {
      const err = `/oauth/access_token: ${oauthResp.status} ${oauthResp.statusText}`;
      console.error(err);
      return { err };
    }
    const oauthData = await oauthResp.json();
    if (!oauthData.access_token) {
      const err = "/oauth/access_token: failed to get access token";
      console.error(err);
      return { err };
    }
    console.log(
      `setThreadsLongAccessToken() accessToken: ${oauthData.access_token}`,
    );

    const exchangeResp = await fetch(
      "https://graph.threads.net/access_token" +
        "?grant_type=th_exchange_token" +
        `&client_secret=${clientSecret}` +
        `&access_token=${oauthData.access_token}`,
    );
    if (exchangeResp.status !== 200) {
      const err = `/access_token: ${exchangeResp.status} ${exchangeResp.statusText}`;
      console.error(err);
      return { err };
    }
    const exchangeData = await exchangeResp.json();
    if (!exchangeData.access_token) {
      const err = `/access_token: failed to get access token`;
      console.error(err);
      return { err };
    }

    await updateDoc(authRef, {
      "threads.accessToken": exchangeData.access_token,
      "threads.userId": oauthData.user_id,
      "threads.expiredAt": new Date(
        new Date().getTime() + exchangeData.expires_in * 1000,
      ),
      updatedAt: new Date(),
    });

    return { err: undefined };
  } catch (e) {
    return { err: e };
  }
};
