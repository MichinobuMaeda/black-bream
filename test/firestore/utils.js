import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc } from "firebase/firestore";
import { config } from "../../src/firebaseConfig";

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const data1 = { name: "test" };

export const refService = collection(db, "service");
export const refApp = doc(db, "service", "app");
export const refConf = doc(db, "service", "conf");
export const refGroups = collection(db, "groups");
export const refAdmins = doc(db, "groups", "admins");
export const refManagers = doc(db, "groups", "managers");
export const refOperators = doc(db, "groups", "operators");
export const refGroup01 = doc(db, "groups", "FeYujtPSkilhusMAyoAs");
export const refUsers = collection(db, "users");
export const refAdmin = doc(db, "users", "t2uxXT9swc3lRw1dNQjntQ2ViJp8");
export const refManager = doc(db, "users", "Mc5GICdls2i9nn01tbqZCrh0ut6Z");
export const refOperator = doc(db, "users", "pkwUgtcgMfqgZSYksZv6UmV3tAIg");
export const refUser01 = doc(db, "users", "yluXLfKJt8RREHtlVwWSs4NvTJO1");
export const refUser02 = doc(db, "users", "Mc5GICdls2i9nn01tbqZCrh0ut6Z");
export const refPosts = collection(db, "posts");
export const refPost01 = doc(db, "posts", "UR318jrobGTlOJ8pyE2Y");
