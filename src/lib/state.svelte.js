import { writable } from "svelte/store";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../firebaseConfig";

import { PAGE_UNSETTLED } from "./const.svelte";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (firebaseConfig.apiKey === "FIREBASE_API_KEY") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export const authUser = writable();
authUser.set(undefined);

export const conf = writable();
conf.set(undefined);

auth.onAuthStateChanged((user) => {
  authUser.set(user);
});

onSnapshot(doc(db, "service", "conf"), (doc) => {
  conf.set(doc.data());
});

export const activePage = writable(PAGE_UNSETTLED);
