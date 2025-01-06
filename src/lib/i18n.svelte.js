/* global $state */
import { setAuthLocale } from "./repository.svelte.js";

const localKeyLocale = "black_bream_locale";
let locale = $state(localStorage.getItem(localKeyLocale) ?? "ja");

export const getLocale = () => locale;
export const setLocale = (value) => {
  locale = value;
  localStorage.setItem(localKeyLocale, value);
  setAuthLocale(value);
};

export const locales = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export const m = {
  appTitle: () => (locale === "ja" ? "Black bream" : "Black bream"),
  send: () => (locale === "ja" ? "送信" : "Send"),
  login: () => (locale === "ja" ? "ログイン" : "Login"),
  logout: () => (locale === "ja" ? "ログアウト" : "Logout"),
  cancel: () => (locale === "ja" ? "中止" : "Cancel"),
  save: () => (locale === "ja" ? "保存" : "Save"),
  goBack: () => (locale === "ja" ? "戻る" : "Go back"),
  info: () => (locale === "ja" ? "情報" : "Information"),
  home: () => (locale === "ja" ? "ホーム" : "Home"),
  list: () => (locale === "ja" ? "一覧" : "List"),
  edit: () => (locale === "ja" ? "編集" : "Edit"),
  create: () => (locale === "ja" ? "新規作成" : "Create"),
  settings: () => (locale === "ja" ? "設定" : "Settings"),
  users: () => (locale === "ja" ? "ユーザー" : "Users"),
  user: () => (locale === "ja" ? "ユーザー" : "User"),
  members: () => (locale === "ja" ? "メンバー" : "Members"),
  groups: () => (locale === "ja" ? "グループ" : "Groups"),
  group: () => (locale === "ja" ? "グループ" : "Group"),
  memberOf: () => (locale === "ja" ? "所属" : "Member of"),
  authentication: () => (locale === "ja" ? "認証" : "Authentication"),
  account: () => (locale === "ja" ? "アカウント" : "Account"),
  profile: () => (locale === "ja" ? "プロフィール" : "Profile"),
  displayName: () => (locale === "ja" ? "表示名" : "Display name"),
  admin: () => (locale === "ja" ? "システム管理者" : "System administrator"),
  manager: () => (locale === "ja" ? "管理者" : "Manager"),
  siteDesc: () => (locale === "ja" ? "サイトの説明" : "Site description"),
  unavailable: () => (locale === "ja" ? "無効" : "Unavailable"),
  email: () => (locale === "ja" ? "メールアドレス" : "Email"),
  changeEmail: () =>
    locale === "ja" ? "メールアドレス変更" : "Change email address",
  password: () => (locale === "ja" ? "パスワード" : "Password"),
  loginWithoutPassword: () =>
    locale === "ja"
      ? "パスワードを使わずにログイン"
      : "Login without a password",
  loginWithPassword: () =>
    locale === "ja"
      ? "メールアドレスとパスワードでログイン"
      : "Login with your email address and password",
  setPassword: () => (locale === "ja" ? "パスワード設定" : "Set password"),
  changePassword: () =>
    locale === "ja" ? "パスワード変更" : "Change password",
  currentPassword: () =>
    locale === "ja" ? "現在のパスワード" : "Current password",
  newPassword: () => (locale === "ja" ? "新しいパスワード" : "New password"),
  confirmNewPassword: () =>
    locale === "ja" ? "パスワードの確認" : "Confirm new password",
  timeoutMinutes: () =>
    locale === "ja" ? "タイムアウト時間（分）" : "Timeout minutes",
  logoutNow: () => (locale === "ja" ? "今すぐログアウトする" : "Logout now"),

  current: (value) =>
    locale === "ja" ? `変更前: ${value}` : `Current: ${value}`,

  // Validation
  errorPasswordStrength: () =>
    locale === "ja" ? "強度が不十分です" : "Insufficient strength",
  errorPasswordConfirmation: () =>
    locale === "ja" ? "パスワードが一致しません" : "Password does not match",
  length: (len) => (locale === "ja" ? `${len}文字` : `Length: ${len}`),
  required: () => (locale === "ja" ? "入力必須です。" : "Required."),
  greaterOrEqual: (num) =>
    locale === "ja"
      ? `${num} 以上の値を入力してください。`
      : `Enter a value greater than or equal to ${num}.`,
  validEmailAddress: () =>
    locale === "ja"
      ? "正しい形式のメールアドレスとしてください"
      : "Enter a valid email address",
  nameInUse: () =>
    locale === "ja"
      ? "既に使われている名称です。"
      : "The name is already in use.",

  // Guidances
  updateApp: () =>
    locale === "ja" ? "アプリを更新してください" : "Please update this app",
  inMarkdown: () =>
    locale === "ja" ? "Markdown で記述してください" : "Write in Markdown",
  aboutLicense: ({ license }) =>
    locale === "ja"
      ? `このアプリは ${license} ライセンスに基づいて配布されます。`
      : `This app is distributed under the ${license} license.`,
  passwordRequirements: () =>
    locale === "ja"
      ? "パスワードは 8 文字以上で、小文字、大文字、数字、記号を使用してください。"
      : "Please make your password at least 8 characters long" +
        " and contain lowercase and uppercase letters, numbers, and symbols.",
  guideChangingEmail: () =>
    locale === "ja"
      ? "ログイン用のメールアドレスの変更は管理者に依頼してください。"
      : "Please ask your administrator to change the email address for login.",
  descPasswordLink: () =>
    locale === "ja"
      ? "はじめてパスワードを設定する場合、または、パスワードを忘れた場合、" +
        "パスワードを設定するリンクを掲載したメールを送信します。"
      : "If this is your first time setting up a password or" +
        " if you have forgotten your password," +
        " we will send you an email with a link to set your password.",
  guideOfWatchdogTimeout: () =>
    locale === "ja"
      ? "画面がフォーカスを失った後、自動でログオフするまでの時間を" +
        "分単位で入力してください。" +
        "この機能を使用しない場合は、0 を入力してください。"
      : "Enter the time in minutes before automatically logging off" +
        " after the screen loses focus." +
        " If you do not want to use this feature, enter 0.",
  allowEmailsFrom: (email) =>
    locale === "ja"
      ? `${email} からのメールを受信できるようにしておいてください。`
      : `Please allow us to receive emails from ${email}`,

  // Success responses
  savedData: () =>
    locale === "ja" ? "データを保存しました。" : "The data has been saved.",
  sentEmailLink: () =>
    locale === "ja"
      ? "ログイン用のリンクを記載したメールを指定されたアドレスに送信しました。"
      : "An email with a login link has been sent to the address you provided.",
  sentPasswordLink: () =>
    locale === "ja"
      ? "パスワード設定用のリンクを記載したメールをログイン用のメールアドレスに送信しました。"
      : "An email with a link to set your password" +
        " has been sent to your login email address.",

  // Error responses
  passwordAuthError: () =>
    locale === "ja"
      ? "ユーザーIDまたはパスワードが正しくありません"
      : "Invalid user ID or password",
  currentPasswordError: () =>
    locale === "ja"
      ? "現在のパスワードが正しくありません"
      : "The current password is incorrect",
  pageNotFound: () => (locale === "ja" ? "見つかりません" : "Page Not Found"),
  NavigationForPageNotFound: () =>
    locale === "ja"
      ? "申し訳ございませんが、お探しの項目は存在しません。" +
        "削除されたか、名前が変更されたか、一時的に利用できない状態になっている可能性があります。"
      : "We're sorry, but the page you were looking for doesn't exist." +
        " It might have been removed, had its name changed," +
        " or is temporarily unavailable.",
  tryAgain: () =>
    locale === "ja"
      ? "設定を変更してやり直してください"
      : "Change the settings and try again",

  // System errors
  onSystemError: () =>
    locale === "ja"
      ? "通信状態を確認してやり直してもうまくいかない場合は、" +
        "システム管理者に連絡してください。"
      : " Check your connection and try again. If the operation does not work," +
        " contact your system administrator.",
  authError: () =>
    locale === "ja"
      ? "認証の処理中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred during authentication." + this.onSystemError(),
  errorOnDataSend: () =>
    locale === "ja"
      ? "送信中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred while saving data." + this.onSystemError(),
  errorOnDataSave: () =>
    locale === "ja"
      ? "データの保存中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred while sending data." + this.onSystemError(),
};
