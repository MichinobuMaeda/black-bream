import { nanoid } from "nanoid";
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

import * as firebaseConfig from "../firebaseConfig.js";
import { localstorage } from "./localstorage.js";
import {
  getFileExtension,
  getMimeTypeFromExtension,
  reduceImageSize,
} from "./media.js";

const imageBasePath = "public/posts/";

export const postTargets = [
  "twitter",
  "mastodon",
  "misskey",
  "bluesky",
  "threads",
  "instagram",
  "tumblr",
];

export const imageRequiredTargets = ["instagram"];

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

export class FirebaseState {
  /**
   * @constructor
   * @param {Object} firebaseConfig
   */
  constructor(firebaseConfig) {
    this.firebaseConfig = firebaseConfig;
    this.app = initializeApp(this.firebaseConfig.config);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.functions = getFunctions(this.app, this.firebaseConfig.region);
    this.storage = getStorage(this.app);
    this.userData = [];
  }

  /**
   * Initialize firebase state
   *
   * @param {Location} location
   * @param {Object} store
   * @returns {void}
   */
  initFirebase(location, store) {
    this.store = store;

    this.setEnvironment(location);
    this.handleFirebaseAuthLink(location);
    this.initUserDataAll();
    this.subscribeServiceConf();
    this.subscribeAuthState();
  }

  /**
   * Set firebase environment
   *
   * @param {Location} location
   * @returns {void}
   */
  setEnvironment({ href }) {
    if (href.includes("localhost") || href.includes("127.0.0.1")) {
      console.log("connect to emulator");
      connectAuthEmulator(this.auth, "http://127.0.0.1:9099");
      connectFirestoreEmulator(this.db, "127.0.0.1", 8080);
      connectFunctionsEmulator(this.functions, "127.0.0.1", 5001);
      connectStorageEmulator(this.storage, "127.0.0.1", 9199);
    } else {
      initializeAppCheck(this.app, {
        provider: new ReCaptchaEnterpriseProvider(
          this.firebaseConfig.reCaptchaKey,
        ),
        isTokenAutoRefreshEnabled: true,
      });
    }
  }

  /**
   * Handle firebase auth link
   *
   * @param {Location} location
   * @returns {void}
   */
  handleFirebaseAuthLink({ href, replace }) {
    if (isSignInWithEmailLink(this.auth, href)) {
      let email = localstorage.email.load();
      if (email) {
        console.log(`signInWithEmailLink(${email})`);
        signInWithEmailLink(this.auth, email, href)
          .then(() => {
            localstorage.email.clear();
            if (href.includes("?")) {
              replace(href.split("?")[0]);
            }
          })
          .catch((e) => {
            console.error(`signInWithEmailLink: ${e}`);
          });
      }
    }
  }

  /**
   * Subscribe service/conf
   *
   * @returns {void}
   */
  subscribeServiceConf() {
    console.log("Subscribe service/conf");
    onSnapshot(doc(this.db, "service", "conf"), (snap) => {
      this.store.conf = this.castDocSnapshot(snap);
    });
  }

  /**
   * Subscribe auth state
   *
   * @returns {void}
   */
  subscribeAuthState() {
    console.log("Subscribe auth");
    this.auth.onAuthStateChanged((user) => {
      this.store.authUser = user;
      console.log(
        `authUser: ${this.store.authUser?.uid ?? this.store.authUser}`,
      );
    });
  }

  /**
   * Initialize all user data
   *
   * @returns {void}
   */
  initUserDataAll() {
    this.userData = [
      new UserData(
        "users",
        collection(this.db, "users"),
        [],
        (snap) => {
          this.store.users = this.castQuerySnapshot(snap, "users");
        },
        (error) => {
          this.unsubscribeUserDataAll(`onSnapshot users: ${error}`);
        },
      ),
      new UserData(
        "groups",
        collection(this.db, "groups"),
        [],
        (snap) => {
          this.store.groups = this.castQuerySnapshot(snap, "groups");
        },
        (error) => {
          this.unsubscribeUserDataAll(`onSnapshot groups: ${error}`);
        },
      ),
      new UserData(
        "posts",
        query(
          collection(this.db, "posts"),
          orderBy("scheduledFor", "desc"),
          limit(1000),
        ),
        [],
        (snap) => {
          this.store.posts = this.castQuerySnapshot(snap, "posts");
        },
        (error) => {
          this.unsubscribeUserDataAll(`onSnapshot posts: ${error}`);
        },
      ),
      new UserData(
        "templates",
        query(collection(this.db, "templates"), orderBy("name", "asc")),
        [],
        (snap) => {
          this.store.templates = this.castQuerySnapshot(snap, "templates");
        },
        (error) => {
          this.unsubscribeUserDataAll(`onSnapshot templates: ${error}`);
        },
      ),
      new UserData(
        "auth",
        doc(this.db, "service", "auth"),
        undefined,
        (snap) => {
          this.store.auth = this.castDocSnapshot(snap);
        },
        (error) => {
          this.unsubscribeUserDataAll(`onSnapshot auth: ${error}`);
        },
        ["admin"],
      ),
    ];
  }

  /**
   * Subscribe all user data
   *
   * @returns {void}
   */
  subscribeUserDataAll() {
    console.log("subscribeUserDataAll()");

    this.userData
      .filter((data) => this.store.admin || !data.require.includes("admin"))
      .forEach((data) => data.subscribe());
  }

  /**
   * Unsubscribe all user data
   *
   * @param {string} [cause]
   * @returns {Promise<Object>}
   */
  async unsubscribeUserDataAll(cause = "") {
    console.log(`unsubscribeUserDataAll(${cause})`);
    try {
      this.userData.forEach((data) => data.unsubscribe());

      if (this.store.authUser) {
        await signOut(fb.auth);
      }

      return { err: undefined };
    } catch (error) {
      console.error(`unsubscribeUserDataAll: ${error}`);
      return { err: "error" };
    }
  }

  /**
   * Set locale of firebase auth
   *
   * @returns {void}
   */
  setAuthLocale() {
    this.auth.languageCode = this.store.locale;
    console.log(`auth.languageCode: ${this.auth.languageCode}`);
  }

  /**
   * Cast document snapshot to data
   *
   * @param {DocumentSnapshot} snap
   * @returns {Object}
   */
  castDocSnapshot(snap) {
    console.log(`${snap.id}: ${snap.exists ? "loaded" : "not found"}`);
    return snap.exists ? { id: snap.id, ...snap.data() } : undefined;
  }

  /**
   * Cast query snapshot to data
   *
   * @param {QuerySnapshot} snap
   * @param {string} name
   * @returns {Object}
   */
  castQuerySnapshot(snap, name) {
    console.log(`${name}: ${snap.docs.length}`);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

export const fb = new FirebaseState(firebaseConfig);

/** @typedef {import("firebase/firestore").DocumentReference|import("firebase/firestore").CollectionReference|import("firebase/firestore").Query} FirebaseQuery */
/** @typedef {import("firebase/firestore").DocumentSnapshot|import("firebase/firestore").QuerySnapshot} FirestoreSnapshot */

export class UserData {
  /**
   * @constructor
   * @param {string} name
   * @param {FirebaseQuery} query
   * @param {Array|null} initialData
   * @param {Function} setData
   * @param {Function} onError
   * @param {array} [require]
   */
  constructor(name, query, initialData, setData, onError, require = []) {
    /** @type {string} */
    this.name = name;
    /** @type {FirebaseQuery} */
    this.query = query;
    /** @type {Array|null} */
    this.initialData = initialData;
    /** @type {import("firebase/firestore").Unsubscribe|null} */
    this.unsub = null;
    /** @type {Function} */
    this.setData = setData;
    /** @type {Function} */
    this.onError = onError;
    /** @type {array} */
    this.require = require;
  }

  /**
   * Subscribe and set data to the store
   *
   * @returns {void}
   */
  subscribe() {
    if (!this.unsub) {
      console.log(`Subscribe ${this.name}`);
      this.unsub = onSnapshot(
        this.query,
        (snap) => {
          this.setData(snap);
        },
        (error) => {
          this.onError(error);
        },
      );
    }
  }

  /**
   * Unsubscribe and clear data to the store
   *
   * @returns {void}
   */
  unsubscribe() {
    if (this.unsub) {
      console.log(`Unsubscribe ${this.name}`);
      this.unsub();
      this.unsub = null;
      this.setData(this.initialData);
    }
  }
}

/**
 * Update document
 *
 * @param {string} col
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateDocument = async (col, id, data) => {
  try {
    await updateDoc(doc(fb.db, col, id), {
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
 * @param {Object} data
 * @param {boolean} [setId]
 * @returns {Promise<Object>}
 */
export const createDocument = async (col, data, setId = false) => {
  try {
    let ret = {};
    if (setId) {
      ret.id =
        new Date()
          .toISOString()
          .replace(/[^0-9]/g, "")
          .slice(2) + nanoid(6);
      await setDoc(doc(fb.db, col, ret.id), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      ret = await addDoc(collection(fb.db, col), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return { err: undefined, data: ret };
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
  getDownloadURL(ref(fb.storage, `${imageBasePath}/${id}/${name}`));

/**
 * Save image to storage
 *
 * @param {string} id
 * @param {File} file
 * @param {Document} document
 */
export const savePostImage = async (id, file, document) => {
  console.log(`savePostImage: ${file.name} ${file.size}`);

  const ext = getFileExtension(file.name);
  const mimeType = getMimeTypeFromExtension(ext);
  const maxSize = 1000 * 1000;
  const blog = await reduceImageSize(document, file, mimeType, maxSize, 0.8);

  try {
    const metadata = { contentType: mimeType };
    const imageRef = ref(fb.storage, `${imageBasePath}/${id}/1.${ext}`);
    await uploadBytes(imageRef, blog, metadata);
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
 * @returns {Promise<Object>}
 */
export const loginWithEmailLink = async (email, url) => {
  try {
    await sendSignInLinkToEmail(fb.auth, email, { url, handleCodeInApp: true });
    localstorage.email.save(email);

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
 * @returns {Promise<Object>}
 */
export const loginWithPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(fb.auth, email, password);

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
 * @param {Object} store
 * @param {function|null} next
 * @returns {Promise<Object>}
 */
export const logout = async (store, next = null) => {
  try {
    await fb.unsubscribeUserDataAll("logout");

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
 * @returns {Promise<Object>}
 */
export const sendPasswordResetLink = async (email) => {
  try {
    await sendPasswordResetEmail(fb.auth, email);

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
 * @param {Object} store
 * @param {string} currentPassword
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const changeEmail = async (store, currentPassword, email) => {
  try {
    await store.authUser.reload();
    await signInWithEmailAndPassword(
      fb.auth,
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
 * @param {Object} store
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<Object>}
 */
export const changePassword = async (store, currentPassword, newPassword) => {
  try {
    await store.authUser.reload();
    await signInWithEmailAndPassword(
      fb.auth,
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
 * Social login
 *
 * @param {string} id
 * @returns {Promise<Object>}
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
    await signInWithPopup(fb.auth, provider);
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
 * @returns {Promise<Object>}
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
    await linkWithPopup(fb.auth.currentUser, provider);
    return { err: undefined };
  } catch (e) {
    console.error(`socialLogin: ${e}`);
    return { err: "error" };
  }
};

/**
 * Call function
 * @param {string} name
 * @param {Object} param
 * @returns {Promise<Object>}
 */
export const callFunction = async (name, param) => {
  try {
    const f = httpsCallable(fb.functions, name);
    const { data } = await f(param);
    return data;
  } catch (e) {
    console.error(`${name}: ${e}`);
    return { err: "error", data: undefined };
  }
};
