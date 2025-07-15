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
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
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
import {
  getAI,
  getGenerativeModel,
  Schema,
  GoogleAIBackend,
} from "firebase/ai";
import mammoth from "mammoth";
import * as cheerio from "cheerio";

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
  "wordpress",
];

export const titleRequiredTargets = ["wordpress"];
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

/** @typedef {import("firebase/firestore").DocumentReference|import("firebase/firestore").CollectionReference|import("firebase/firestore").Query} FirebaseQuery */

/**
 * @typedef {Object} UserData
 * @property {string} name
 * @property {FirebaseQuery} query
 * @property {Function} setData
 * @property {Array} requires
 */

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
    this.ai = getAI(this.app, { backend: new GoogleAIBackend() });
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
      this.store.conf = this.castSnapshot(snap, "conf", {});
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
    /* @type {UserData[]} */
    this.userData = [
      {
        name: "users",
        query: collection(this.db, "users"),
        setData: (snap) => {
          this.store.users = this.castSnapshot(snap, "users", []);
        },
        requires: [],
      },
      {
        name: "groups",
        query: collection(this.db, "groups"),
        setData: (snap) => {
          this.store.groups = this.castSnapshot(snap, "groups", []);
        },
        requires: [],
      },
      {
        name: "posts",
        query: query(
          collection(this.db, "posts"),
          orderBy("scheduledFor", "desc"),
          limit(1000),
        ),
        setData: (snap) => {
          this.store.posts = this.castSnapshot(snap, "posts", []);
        },
        requires: [],
      },
      {
        name: "templates",
        query: query(collection(this.db, "templates"), orderBy("name", "asc")),
        setData: (snap) => {
          this.store.templates = this.castSnapshot(snap, "templates", []);
        },
        requires: [],
      },
      {
        name: "auth",
        query: doc(this.db, "service", "auth"),
        setData: (snap) => {
          this.store.auth = this.castSnapshot(snap, "auth", undefined);
        },
        requires: ["admin"],
      },
      {
        name: "logs",
        query: query(
          collection(this.db, "logs"),
          orderBy("createdAt", "desc"),
          limit(1000),
        ),
        setData: (snap) => {
          this.store.logs = this.castSnapshot(snap, "logs", []);
        },
        requires: ["admin"],
      },
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
      .filter((data) => this.store.admin || !data.requires.includes("admin"))
      .filter((data) => !data.unsub)
      .forEach((data) => {
        console.log(`Subscribe ${data.name}`);
        data.unsub = onSnapshot(
          data.query,
          (snap) => data.setData(snap),
          (error) =>
            this.unsubscribeUserDataAll(`onSnapshot ${data.name}: ${error}`),
        );
      });
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
      this.userData
        .filter((data) => data.unsub)
        .forEach((data) => {
          console.log(`Unsubscribe ${data.name}`);
          data.unsub();
          data.unsub = null;
          data.setData(undefined);
        });

      if (this.store.authUser) {
        await signOut(fbs.auth);
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
   * Cast snapshot to data
   *
   * @param {DocumentSnapshot|QuerySnapshot} snap
   * @param {string} name
   * @param {any} emptyData
   * @returns {Object}
   */
  castSnapshot(snap, name, emptyData) {
    console.log(
      snap
        ? snap.docs
          ? `${name}: ${snap.docs.length}`
          : `${snap.id}: ${snap.exists ? "loaded" : "not found"}`
        : `${name}: undefined`,
    );
    return snap
      ? snap.docs
        ? snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        : snap.exists
          ? { id: snap.id, ...snap.data() }
          : emptyData
      : emptyData;
  }
}

export const fbs = new FirebaseState(firebaseConfig);

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
    await updateDoc(doc(fbs.db, col, id), {
      ...data,
      updatedAt: serverTimestamp(),
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
export const createDocument = async (col, data) => {
  try {
    let ret = {};
    ret = await addDoc(collection(fbs.db, col), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
  getDownloadURL(ref(fbs.storage, `${imageBasePath}/${id}/${name}`));

/**
 * Save posted image to storage
 *
 * @param {string} id
 * @param {File} file
 * @param {Document} document
 */
export const savePostedImage = async (id, file, document) => {
  console.log(`savePostedImage: ${file.name} ${file.size}`);

  const ext = getFileExtension(file.name);
  const mimeType = getMimeTypeFromExtension(ext);
  const maxSize = 1000 * 1000;
  const blog = await reduceImageSize(document, file, mimeType, maxSize, 0.8);

  try {
    const metadata = { contentType: mimeType };
    const imageRef = ref(fbs.storage, `${imageBasePath}/${id}/1.${ext}`);
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
    await sendSignInLinkToEmail(fbs.auth, email, {
      url,
      handleCodeInApp: true,
    });
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
    await signInWithEmailAndPassword(fbs.auth, email, password);

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
    await fbs.unsubscribeUserDataAll("logout");

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
    await sendPasswordResetEmail(fbs.auth, email);

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
      fbs.auth,
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
      fbs.auth,
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
    await signInWithPopup(fbs.auth, provider);
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
    await linkWithPopup(fbs.auth.currentUser, provider);
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
    const f = httpsCallable(fbs.functions, name);
    const { data } = await f(param);
    return data;
  } catch (e) {
    console.error(`${name}: ${e}`);
    return { err: "error", data: undefined };
  }
};

/**
 * Recursively get all text nodes from a Cheerio node.
 * @param {cheerio.CheerioAPI} dom
 * @param {cheerio.Cheerio<cheerio.Element>} node
 * @returns {Array<string>}
 */
function getAllTextNodes(dom, node) {
  let texts = [];
  node.contents().each((_, child) => {
    if (child.type === "text") {
      const text = dom(child).text().trim();
      if (text) {
        texts.push(text);
      }
    } else {
      if (dom(child).contents().length) {
        texts = texts.concat(getAllTextNodes(dom, dom(child)));
      }
    }
  });
  return texts;
}

export const generateJobPosting = async (setText, file, baseCount) => {
  try {
    const buffer = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer });
    setText(value);
    const dom = cheerio.load(value);
    const rows = dom("tr");
    const inputs = [];

    rows.each((_, row) => {
      let confidential = false;
      const item = {};
      getAllTextNodes(dom, dom(row).find("td").first()).forEach((text) => {
        if (/^\d+$/.test(text)) {
          item.code = text;
        } else if (/^[0-9/-]+$/.test(text)) {
          item.date = text;
        } else if (/(情報|機密|秘密|非公開|開示|禁止)/.test(text)) {
          confidential = true;
        }
      });
      if (item.code && item.date && !confidential) {
        const right = getAllTextNodes(dom, dom(row).find("td").last());
        if (right.length) {
          item.content = right.join("\n");
          inputs.push(item);

          if (baseCount <= inputs.length) {
            return; // Break the loop
          }
        }
      }
    });
    const text = inputs.reduce(
      (acc, cur) =>
        `${acc}\n\nCode: ${cur.code}\nDate: ${cur.date}\nContent: ${cur.content}`,
      "",
    );
    setText(text);

    const prompt = `
## 指示内容

後述のそれぞれの案件情報について、以下の項目を抽出してください。

Code: 案件番号(英数字)
  ※例: 12345
Date: 日付(月/日)
  ※例: 2/1, 11/13
Title: タイトル
  ※「某」と「募集」は除外すること。
Occupation: 職種
  ※例: SE, PM, PMO, フロントエンドエンジニア, 運用, ヘルプデスク
Duration: 期間
  ※例: '25年10月〜, '25年10月(即日)〜, '25年10月〜'26年3月(延長あり)
StartDate: 開始日
  ※例: '25/10, '25/10(即日), '25/10
Price: 単価
  ※例: 65万円, 〜60万円, 60〜80万円 注意: 「スキル見合い」や「応相談」は除外すること。
Language: 使用言語
  ※例: Java, Python, C#, JavaScript, TypeScript, React, Vue.js, Laravel, Ruby, COBOL
Place: 勤務地
  ※例: リモート/港区, 港区/リモート, フルリモート, フルリモート地方可, 都内, 横浜市
  ※「地方可」や「地方歓迎」は明記されている場合のみ記載すること。
RequiredSkills:
- 必須条件1
- 必須条件2
 ...
- 必須条件n
  ※文面を変更せずにそのまま抜き出すこと。
  ※尚可や優遇は除外すること。
Description:
作業内容1行目
作業内容2行目
 ...
作業内容n行目
  ※箇条書きではなく、文章で記載された内容を抜き出すこと。
Details:
- 作業内容詳細1
- 作業内容詳細2
 ...
- 作業内容詳細n
  ※箇条書きの内容をそのまま抜き出すこと。

## 案件情報

${text}
`;
    const result = await getGenerativeModel(fbs.ai, {
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: Schema.array({
          items: Schema.object({
            properties: {
              code: Schema.string(),
              date: Schema.string(),
              title: Schema.string(),
              occupation: Schema.string(),
              duration: Schema.string(),
              startDate: Schema.string(),
              price: Schema.string(),
              language: Schema.string(),
              place: Schema.string(),
              requiredSkills: Schema.array({ items: Schema.string() }),
              description: Schema.string(),
              details: Schema.array({ items: Schema.string() }),
            },
            optionalProperties: ["price", "language", "description", "details"],
          }),
        }),
      },
    }).generateContent(prompt);

    const parsed = JSON.parse(
      result?.response?.text() ?? '"No response from AI model"',
    );
    setText(JSON.stringify(parsed, null, 2));

    if (Array.isArray(parsed) || parsed.length > 0) {
      const parsedToText = (parsed) =>
        parsed
          .map((item) => {
            return `
Code: ${item.code}
Date: ${item.date}
Title: ${item.title}
Occupation: ${item.occupation}
Duration: ${item.duration}
StartDate: ${item.startDate}
Price: ${item.price}
Language: ${item.language}
Place: ${item.place}
RequiredSkills:
${item.requiredSkills?.map((skill) => `- ${skill}`).join("\n")}
Description:
${item.description}

Details:
${item.details?.map((detail) => `- ${detail}`).join("\n")}
`;
          })
          .join("\n");

      const prompt = `
後述の案件情報から、条件に適合する上位３件を抽出して Code を出力してください。
条件:

1. 「地方可」または「地方歓迎」が明示されていること。
2. 単価が明示されており、その単価が比較的高いもの。
3. 抽出済みの他の案件と、職種や技術分野が異なるもの。

案件情報:

${parsedToText(parsed)}
`;

      const result = await getGenerativeModel(fbs.ai, {
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: Schema.array({
            items: Schema.string(),
            description: "Extracted job posting codes",
            minItems: 1,
            maxItems: 3,
          }),
        },
      }).generateContent(prompt);

      const codes = JSON.parse(result?.response?.text() ?? "[]");

      const selected = parsed.filter((item) => codes.includes(item.code));

      // setText(JSON.stringify(selected, null, 2));
      setText(`${codes}\n\n${JSON.stringify(selected, null, 2)}`);
    }

    return { err: undefined };
  } catch (e) {
    console.error(`generateJobPosting: ${e.toString()}`);
    return { err: e.toString() };
  }
};
