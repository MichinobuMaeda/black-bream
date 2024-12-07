/* global $state, $derived, $effect */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
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
} from "firebase/firestore";

import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (import.meta.env.DEV) {
  console.log("connect to emulator");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
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
 */
function unsubscribeUserData() {
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
    signOut(auth);
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
      console.log(`groups: ${error}`);
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
      console.log(`groups: ${error}`);
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
};

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
};

/**
 * Update conf
 * @param {object} conf
 */
export const updateConf = async (conf) => {
  await updateDoc(doc(db, "service", "conf"), {
    ...conf,
    updatedAt: new Date(),
  });
};

/**
 * Update profile
 * @param {object} profile
 */
export const updateProfile = async (profile) => {
  await updateDoc(doc(db, "users", user.id), {
    ...profile,
    updatedAt: new Date(),
  });
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 */
export const login = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logout
 */
export const logout = async () => {
  unsubscribeUserData();
};

/**
 * Change password
 * @param {string} originalPassword
 * @param {string} newPassword
 */
export const changePassword = async (originalPassword, newPassword) => {
  await signInWithEmailAndPassword(auth, authUser.email, originalPassword);
  await updatePassword(authUser, newPassword);
};
