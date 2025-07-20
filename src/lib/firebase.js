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
  VertexAIBackend,
} from "firebase/ai";
import { dump, load } from "js-yaml";

import * as firebaseConfig from "../firebaseConfig.js";
import { localstorage } from "./localstorage.js";
import {
  getFileExtension,
  getMimeTypeFromExtension,
  reduceImageSize,
  docxToTable,
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
    this.ai = getAI(this.app, { backend: new VertexAIBackend("global") });
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
        name: "generators",
        query: query(collection(this.db, "generators"), orderBy("name", "asc")),
        setData: (snap) => {
          this.store.generators = this.castSnapshot(snap, "generators", []);
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

const testInput = `
input:
  type: file
  accept:
    - '.docx'
output:
  type: table
  headers:
    - meta
    - content
  limit: 10
  # includes:
  excludes:
    meta:
      - 情報
      - 開示
      - 禁止
      - 秘
      - 取引先
  targets:
    - wordpress
  date:
    - random
`;

const testPrompt1 = `
## 指示1

後述のそれぞれの案件情報について、以下の項目を抽出してください。

Code: 案件番号(英数字)を meta から抽出する
  ※例: 12345
Date: 日付(月/日)を meta から抽出する
  ※例: 2/1, 11/13
Title: タイトル
  ※「某」と「募集」は除外すること。
Occupation: 職種
  ※例: SE, PM, PMO, フロントエンドエンジニア, 運用, ヘルプデスク
Duration: 期間('yy年m月)
  ※例: '25年10月〜, '25年10月 or 11月〜, '25年10月(即日)〜, '25年10月〜'26年3月(延長あり)
StartDate: 開始月('yy/m)
  ※例: '25/10, '25/9(即日), '25/12 or '26/1
Price: 単価
  ※例: 65万円, 〜60万円, 60〜80万円 注意: 「スキル見合い」や「応相談」は除外すること。
TechStack: 使用言語/フレームワーク
  ※例: Java, Python, C#, JavaScript, TypeScript, React, Vue.js, Laravel, Ruby, COBOL
Place: 勤務地
  ※例: リモート/港区, 港区/リモート, フルリモート, フルリモート地方可, 都内, 横浜市
  ※駅名の可能性がある場合は、自治体名に置き換えること。例: 「品川」→「港区」、「大宮」→「さいたま市」
  ※「地方可」や「地方歓迎」は明記されている場合のみ記載すること。
RequiredSkills: [必須条件1, 必須条件1, ..., 必須条件n]
  ※文面を変更せずにそのまま抜き出すこと。
  ※尚可や優遇は除外すること。
Description: 作業内容1行目
作業内容2行目
 ...
作業内容n行目
  ※箇条書きではなく、文章で記載された内容を抜き出すこと。
  ※「某」は除外すること。
Details: [作業内容詳細1, 作業内容詳細2, ..., 作業内容詳細n]
  ※箇条書きの内容をそのまま抜き出すこと。
  ※「某」は除外すること。


## 指示2

指示1で生成したデータの中から次の必須条件と優先条件に適合する上位3件を抽出してください。

### 必須条件

- 単価が明示されていること。
- 勤務地、または、リモート可、在宅可であることが明記されていること。

### 優先する条件

1. 「地方可」または「地方歓迎」が明示されていること。
2. 単価が比較的高いもの。
3. 抽出済みの他の案件と、職種や技術分野が異なるもの。


## 指示3

指示2で抽出した3件のデータを次のテンプレートの {{項目名}} に当てはめて3件の投稿用のデータを作成してください。
title の "[]" は必須ではない記載内容、"|" は選択肢を表します。
テンプレートの message の改行は維持してください。

- title: {{StartDate}}【{{Place}}】[{{TechStack}}|{{Occupation}}：]{{Title}}
  message: |
    <!-- wp:table -->
    <figure class="wp-block-table">
      <table>
        <tbody>
          <tr><th>職種</th><td>{{Occupation}}</td></tr>
          <tr><th>契約額</th><td>{{Price}}</td></tr>
          <tr><th>期間</th><td>{{Duration}}</td></tr>
          <tr><th>場所</th><td>{{Place}}</td></tr>
        </tbody>
      </table>
    </figure>
    <!-- /wp:table -->
    <!-- wp:heading {"level":4} -->
    <h4 class="wp-block-heading">必要スキル</h4>
    <!-- /wp:heading -->
    <!-- wp:list -->
    <ul>
      <li>{{RequiredSkills}}</li>
    </ul>
    <!-- /wp:list -->
    <!-- wp:heading {"level":4} -->
    <h4 class="wp-block-heading">業務内容</h4>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>{{Description}}</p>
    <!-- /wp:paragraph -->
    <!-- wp:list -->
    <ul>
      <li>{{Details}}</li>
    </ul>
    <!-- /wp:list -->
    <!-- wp:paragraph {"align":"right"} -->
    <p class="has-text-align-right">管理番号:{{Code}}</p>
    <!-- /wp:paragraph -->
    <!-- {{Date}} -->
  note: 入力元のデータ

## 案件情報
`;

const parseDocx = async (file, { input, output }) => {
  if (input.accept.includes(".docx") && output.type === "table") {
    const table = await docxToTable(file);
    if (table.err) {
      console.error(`parseDocx: ${table.err}`);
      return table;
    }

    const { headers, includes, excludes, limit } = output;
    const data = table.data
      .filter(({ cols }) => cols.length >= headers.length)
      .map(({ cols }) =>
        (headers || []).reduce(
          (acc, header, index) => ({
            ...acc,
            [header]: cols[index].texts.join("\n"),
          }),
          {},
        ),
      )
      .filter(
        (row) =>
          Object.keys(includes || []).length === 0 ||
          Object.entries(includes || []).some(([key, values]) =>
            values.some((value) => row[key].includes(value)),
          ),
      )
      .filter(
        (row) =>
          Object.keys(excludes || []).length === 0 ||
          Object.entries(excludes || []).every(([key, values]) =>
            values.every((value) => !row[key].includes(value)),
          ),
      )
      .slice(0, limit ? limit : undefined);
    return { data };
  }

  return { err: "Unsupported input/output format" };
};

const parsedToStructured = async (parsed) => {
  try {
    const promptStruct = `
${testPrompt1}

${dump(parsed)}
`;

    const result = await getGenerativeModel(fbs.ai, {
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: Schema.array({
          items: Schema.object({
            properties: {
              title: Schema.string(),
              message: Schema.string(),
              url: Schema.string(),
              images: Schema.array({ items: Schema.string() }),
              targets: Schema.array({ items: Schema.string() }),
              note: Schema.string(),
            },
            optionalProperties: ["title", "message", "url", "images", "note"],
          }),
        }),
      },
    }).generateContent(promptStruct);

    const text = result?.response?.text();

    if (!text) {
      console.error("No response from AI model");
      return { err: "No response from AI model" };
    }

    const data = JSON.parse(text);

    return { data };
  } catch (e) {
    console.error(`parsedToStructured: ${e.toString()}`);
    return { err: e.toString() };
  }
};

export const generateJobPosting = async (setText, file) => {
  try {
    const parsed = await parseDocx(file, load(testInput));

    if (parsed.err) {
      setText(parsed.err);
      return { parsed };
    }

    if (parsed.data.length === 0) {
      setText("No valid data found in the document.");
      return { err: "No valid data found" };
    }

    setText(`${parsed.data.length}件\n\n${dump(parsed.data)}`);

    const structured = await parsedToStructured(parsed.data);

    if (structured.err) {
      setText(structured.err);
      return structured;
    }

    setText(`${structured.data.length}件\n\n${dump(structured.data)}`);

    return { err: undefined };
  } catch (e) {
    console.error(`generateJobPosting: ${e.toString()}`);
    return { err: e.toString() };
  }
};
