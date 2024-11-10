import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../firebaseConfig";

import { pageHome, pageAccount, pageLogin, pageInfo } from "./const.svelte";

export const createState = () => {
  console.log("createState()");

  // eslint-disable-next-line no-undef
  let page = $state(null);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (firebaseConfig.apiKey === "FIREBASE_API_KEY") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }

  // eslint-disable-next-line no-undef
  let authUser = $state(undefined);
  console.log(`authUser: ${authUser}`);
  auth.onAuthStateChanged((user) => {
    authUser = user;
    console.log(`authUser: ${authUser?.uid ?? authUser}`);
  });

  // eslint-disable-next-line no-undef
  let conf = $state(undefined);
  console.log(`conf: ${conf}`);
  onSnapshot(doc(db, "service", "conf"), (doc) => {
    conf = doc.data();
    console.log(`conf: ${conf === undefined ? "undefined" : "loaded"}`);
  });

  // eslint-disable-next-line no-undef
  let loading = $derived(authUser === undefined || conf === undefined);

  // eslint-disable-next-line no-undef
  let pages = $derived(
    loading
      ? [pageInfo]
      : authUser === null
        ? [pageLogin, pageInfo]
        : [pageHome, pageAccount, pageInfo],
  );

  // eslint-disable-next-line no-undef
  $effect(() => {
    if (!loading && !pages.map((item) => item.id).includes(page)) {
      page = pages[0].id;
    }
  });

  // eslint-disable-next-line no-undef
  $effect(() => {
    console.log(`page: ${page}`);
  });

  return {
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
    get loading() {
      return loading;
    },
    get pages() {
      return pages;
    },
  };
};
