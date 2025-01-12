import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  auth,
  db,
  data1,
  refApp,
  refConf,
  refService,
  refGroups,
  refGroup01,
  refUsers,
  refUser01,
  refUser02,
  refPosts,
  refPost01,
} from "./utils";

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const me = refUser01;

beforeAll(async () => {
  await signInWithEmailAndPassword(auth, "user01@example.com", "password");
});

afterAll(async () => {
  await signOut(auth);
});

describe("Admin", () => {
  it("can read service/conf", async () => {
    await expect(getDoc(refConf)).resolves.toHaveProperty("id");
  });
  it("can not create service/*", async () => {
    await expect(addDoc(refService, data1)).rejects.toThrow();
  });
  it("can update service/conf", async () => {
    await expect(updateDoc(refConf, data1)).rejects.toThrow();
  });
  it("can not delete service/conf", async () => {
    await expect(deleteDoc(refConf)).rejects.toThrow();
  });
  it("can not read service/*", async () => {
    await expect(getDocs(refService)).rejects.toThrow();
  });
  it("can read service/app", async () => {
    await expect(getDoc(refApp)).rejects.toThrow();
  });
  it("can update service/app", async () => {
    await expect(updateDoc(refApp, data1)).rejects.toThrow();
  });
  it("can not delete service/app", async () => {
    await expect(deleteDoc(refApp)).rejects.toThrow();
  });
  it("can read groups/*", async () => {
    await expect(getDocs(refGroups)).resolves.toHaveProperty("docs");
  });
  it("can not create groups/*", async () => {
    await expect(addDoc(refGroups, data1)).rejects.toThrow();
  });
  it("can not update groups/group01", async () => {
    await expect(updateDoc(refGroup01, data1)).rejects.toThrow();
  });
  it("can not delete groups/group01", async () => {
    await expect(deleteDoc(refGroup01)).rejects.toThrow();
  });
  it("can read users/*", async () => {
    await expect(getDocs(refUsers)).resolves.toHaveProperty("docs");
  });
  it("can not create users/*", async () => {
    await expect(addDoc(refUsers, data1)).rejects.toThrow();
  });
  it("can update users/me", async () => {
    await expect(updateDoc(me, data1)).resolves.toBeUndefined();
  });
  it("can not delete users/me", async () => {
    await expect(deleteDoc(me)).rejects.toThrow();
  });
  it("can not update users/user02", async () => {
    await expect(updateDoc(refUser02, data1)).rejects.toThrow();
  });
  it("can not delete users/user02", async () => {
    await expect(deleteDoc(refUser02)).rejects.toThrow();
  });
  it("can read posts/*", async () => {
    await expect(getDocs(refPosts)).resolves.toHaveProperty("docs");
  });
  it("can not create posts/*", async () => {
    await expect(addDoc(refPosts, data1)).rejects.toThrow();
  });
  it("can not update posts/post01", async () => {
    await expect(updateDoc(refPost01, data1)).rejects.toThrow();
  });
  it("can not delete posts/post01", async () => {
    await expect(deleteDoc(refPost01)).rejects.toThrow();
  });
});
