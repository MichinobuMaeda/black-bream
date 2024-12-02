/* global $state, $derived, $effect */
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../firebaseConfig";

let page = $state(null);
let authUser = $state(undefined);
let conf = $state(undefined);
let users = $state(null);
let groups = $state(null);
let logoff = $state(false);
let user = $state(undefined);

let loading = $derived(authUser === undefined || conf === undefined || logoff);

const store = {
  auth: null,
  de: null,
  get page() {
    return page;
  },
  set page(value) {
    page = value;
  },
  get authUser() {
    return authUser;
  },
  get conf() {
    return conf;
  },
  get user() {
    return user;
  },
  get users() {
    return users;
  },
  usersUnsubscribe: null,
  subscribeUsers: () =>
    onSnapshot(collection(store.db, "users"), (snap) => {
      users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }),
  discardUsers: () => {
    if (store.usersUnsubscribe !== null) {
      store.usersUnsubscribe();
      store.usersUnsubscribe = null;
    }
    users = null;
  },
  get groups() {
    return groups;
  },
  groupsUnsubscribe: null,
  subscribeGroups: () =>
    onSnapshot(collection(store.db, "groups"), (snap) => {
      groups = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }),
  discardGroups: () => {
    if (store.groupsUnsubscribe !== null) {
      store.groupsUnsubscribe();
      store.groupsUnsubscribe = null;
    }
    groups = null;
  },
  get loading() {
    return loading;
  },
};

export const initStore = () => {
  console.log("initStore()");

  const app = initializeApp(firebaseConfig);
  store.auth = getAuth(app);
  store.db = getFirestore(app);

  if (import.meta.env.DEV) {
    connectAuthEmulator(store.auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(store.db, "127.0.0.1", 8080);
  }

  console.log(`authUser: ${authUser}`);
  store.auth.onAuthStateChanged((user) => {
    authUser = user;
    console.log(`authUser: ${authUser?.uid ?? authUser}`);
  });

  console.log(`conf: ${conf}`);
  onSnapshot(doc(store.db, "service", "conf"), (doc) => {
    conf = doc.data();
    console.log(`conf: ${conf === undefined ? "undefined" : "loaded"}`);
  });
};

export const activateStore = () => {
  console.log("activateStore()");

  $effect(() => {
    if (authUser === null) {
      store.discardUsers();
      store.discardGroups();
    } else if (authUser !== undefined) {
      store.subscribeUsers();
      store.subscribeGroups();
    }
  });

  $effect(() => {
    if (authUser) {
      if (users.length > 0) {
        user = users.find(
          (user) => user.id === authUser.uid && !user.deletedAt,
        );
        if (!user) {
          logoff = true;
        } else {
          logoff = false;
        }
      }
    } else {
      logoff = false;
    }
  });

  $effect(() => {
    if (logoff) {
      user = undefined;
      store.discardUsers();
      store.discardGroups();
      store.auth.signOut();
    }
  });

  $effect(() => {
    console.log(`page: ${page}`);
  });
};

export const getStore = () => store;
