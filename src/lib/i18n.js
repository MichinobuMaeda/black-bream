import { appName } from "../../theme.js";

/**
 * An array of locale objects, each containing a value and a label.
 *
 * @type {Array<{value: string, label: string}>}
 * @property {string} value - The locale code.
 * @property {string} label - The display name of the locale.
 */
export const locales = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

/**
 * A class to handle internationalization (i18n) for the application.
 * Provides methods to get localized strings based on the provided locale.
 */
export class I18n {
  /**
   * Create a new instance of I18n
   *
   * @param {StringFormat} locale
   */
  constructor(locale) {
    this.locale = locale;
  }

  appTitle = () => (this.locale === "ja" ? appName : appName);
  send = () => (this.locale === "ja" ? "送信" : "Send");
  login = () => (this.locale === "ja" ? "ログイン" : "Login");
  logout = () => (this.locale === "ja" ? "ログアウト" : "Logout");
  cancel = () => (this.locale === "ja" ? "中止" : "Cancel");
  save = () => (this.locale === "ja" ? "保存" : "Save");
  goBack = () => (this.locale === "ja" ? "戻る" : "Go back");
  info = () => (this.locale === "ja" ? "情報" : "Information");
  home = () => (this.locale === "ja" ? "ホーム" : "Home");
  list = () => (this.locale === "ja" ? "一覧" : "List");
  edit = () => (this.locale === "ja" ? "編集" : "Edit");
  create = () => (this.locale === "ja" ? "新規作成" : "Create");
  settings = () => (this.locale === "ja" ? "設定" : "Settings");
  users = () => (this.locale === "ja" ? "ユーザー" : "Users");
  user = () => (this.locale === "ja" ? "ユーザー" : "User");
  members = () => (this.locale === "ja" ? "メンバー" : "Members");
  groups = () => (this.locale === "ja" ? "グループ" : "Groups");
  group = () => (this.locale === "ja" ? "グループ" : "Group");
  memberOf = () => (this.locale === "ja" ? "所属" : "Member of");
  services = () => (this.locale === "ja" ? "サービス" : "Services");
  service = () => (this.locale === "ja" ? "サービス" : "Service");
  schedule = () => (this.locale === "ja" ? "スケジュール" : "Schedule");
  posts = () => (this.locale === "ja" ? "投稿" : "Posts");
  post = () => (this.locale === "ja" ? "投稿" : "Post");
  recentPosts = () => (this.locale === "ja" ? "最近の投稿" : "Recent posts");
  text = () => (this.locale === "ja" ? "文面" : "Text");
  authentication = () => (this.locale === "ja" ? "認証" : "Authentication");
  account = () => (this.locale === "ja" ? "アカウント" : "Account");
  profile = () => (this.locale === "ja" ? "プロフィール" : "Profile");
  displayName = () => (this.locale === "ja" ? "表示名" : "Display name");
  admin = () =>
    this.locale === "ja" ? "システム管理者" : "System administrator";
  manager = () => (this.locale === "ja" ? "管理者" : "Manager");
  siteDesc = () => (this.locale === "ja" ? "サイトの説明" : "Site description");
  deleted = () => (this.locale === "ja" ? "削除" : "Deleted");
  enabled = () => (this.locale === "ja" ? "有効" : "Enabled");
  restricted = () => (this.locale === "ja" ? "ログイン不可" : "Disabled");
  email = () => (this.locale === "ja" ? "メールアドレス" : "Email");
  changeEmail = () =>
    this.locale === "ja" ? "メールアドレス変更" : "Change email address";
  password = () => (this.locale === "ja" ? "パスワード" : "Password");
  loginWithoutPassword = () =>
    this.locale === "ja"
      ? "パスワードを使わずにログイン"
      : "Login without a password";
  loginWithPassword = () =>
    this.locale === "ja"
      ? "メールアドレスとパスワードでログイン"
      : "Login with your email address and password";
  setPassword = () =>
    this.locale === "ja" ? "パスワード設定" : "Set password";
  changePassword = () =>
    this.locale === "ja" ? "パスワード変更" : "Change password";
  currentPassword = () =>
    this.locale === "ja" ? "現在のパスワード" : "Current password";
  newPassword = () =>
    this.locale === "ja" ? "新しいパスワード" : "New password";
  confirmNewPassword = () =>
    this.locale === "ja" ? "パスワードの確認" : "Confirm new password";
  socialLogin = () =>
    this.locale === "ja" ? "ソーシャルログイン" : "Social login";
  aboutSocialLogin = () =>
    this.locale === "ja"
      ? "ソーシャルログインは、ソーシャルサービスとこのアプリのログインで" +
        "同じメールアドレスを使用している場合、もしくは、" +
        "このアプリにログイン後にログインに利用するソーシャルアプリを登録した場合に利用できます。"
      : "Social login can be used if you use the same email address" +
        " to login to the social service and this app," +
        " or if you register a social app to use for logging in" +
        " after logging in to this app.";
  aboutRegisterSocialLogin = () =>
    this.locale === "ja"
      ? "ソーシャルログインは、ソーシャルサービスとこのアプリのログインで" +
        "同じメールアドレスを使用している場合、もしくは、" +
        "下のボタンでログインに利用するソーシャルアプリを登録した場合に利用できます。"
      : "Social login can be used if you use the same email address" +
        " to login to the social service and this app," +
        " or if you register a social app to use for logging in" +
        " using the buttons below.";
  timeoutMinutes = () =>
    this.locale === "ja" ? "タイムアウト時間（分）" : "Timeout minutes";
  logoutNow = () =>
    this.locale === "ja" ? "今すぐログアウトする" : "Logout now";

  current = (value) =>
    this.locale === "ja" ? `変更前: ${value}` : `Current: ${value}`;

  // Validation
  errorPasswordStrength = () =>
    this.locale === "ja" ? "強度が不十分です" : "Insufficient strength";
  errorPasswordConfirmation = () =>
    this.locale === "ja"
      ? "パスワードが一致しません"
      : "Password does not match";
  length = (len) => (this.locale === "ja" ? `${len}文字` : `Length: ${len}`);
  required = () => (this.locale === "ja" ? "入力必須です。" : "Required.");
  greaterOrEqual = (num) =>
    this.locale === "ja"
      ? `${num} 以上の値を入力してください。`
      : `Enter a value greater than or equal to ${num}.`;
  validEmailAddress = () =>
    this.locale === "ja"
      ? "正しい形式のメールアドレスとしてください"
      : "Enter a valid email address";
  nameInUse = () =>
    this.locale === "ja"
      ? "既に使われている名称です。"
      : "The name is already in use.";

  // Guidances
  updateApp = () =>
    this.locale === "ja"
      ? "アプリを更新してください"
      : "Please update this app";
  inMarkdown = () =>
    this.locale === "ja" ? "Markdown で記述してください" : "Write in Markdown";
  aboutLicense = ({ license }) =>
    this.locale === "ja"
      ? `このアプリは ${license} ライセンスに基づいて配布されます。`
      : `This app is distributed under the ${license} license.`;
  passwordRequirements = () =>
    this.locale === "ja"
      ? "パスワードは 8 文字以上で、小文字、大文字、数字、記号を使用してください。"
      : "Please make your password at least 8 characters long" +
        " and contain lowercase and uppercase letters; numbers; and symbols.";
  guideChangingEmail = () =>
    this.locale === "ja"
      ? "ログイン用のメールアドレスの変更は管理者に依頼してください。"
      : "Please ask your administrator to change the email address for login.";
  descPasswordLink = () =>
    this.locale === "ja"
      ? "はじめてパスワードを設定する場合、または、パスワードを忘れた場合、" +
        "パスワードを設定するリンクを掲載したメールを送信します。"
      : "If this is your first time setting up a password or" +
        " if you have forgotten your password;" +
        " we will send you an email with a link to set your password.";
  guideOfWatchdogTimeout = () =>
    this.locale === "ja"
      ? "画面がフォーカスを失った後、自動でログオフするまでの時間を" +
        "分単位で入力してください。" +
        "この機能を使用しない場合は、0 を入力してください。"
      : "Enter the time in minutes before automatically logging off" +
        " after the screen loses focus." +
        " If you do not want to use this feature; enter 0.";
  allowEmailsFrom = (email) =>
    this.locale === "ja"
      ? `${email} からのメールを受信できるようにしておいてください。`
      : `Please allow us to receive emails from ${email}`;

  // Success responses
  savedData = () =>
    this.locale === "ja"
      ? "データを保存しました。"
      : "The data has been saved.";
  sentEmailLink = () =>
    this.locale === "ja"
      ? "ログイン用のリンクを記載したメールを指定されたアドレスに送信しました。"
      : "An email with a login link has been sent to the address you provided.";
  sentPasswordLink = () =>
    this.locale === "ja"
      ? "パスワード設定用のリンクを記載したメールをログイン用のメールアドレスに送信しました。"
      : "An email with a link to set your password" +
        " has been sent to your login email address.";

  // Error responses
  passwordAuthError = () =>
    this.locale === "ja"
      ? "ユーザーIDまたはパスワードが正しくありません"
      : "Invalid user ID or password";
  currentPasswordError = () =>
    this.locale === "ja"
      ? "現在のパスワードが正しくありません"
      : "The current password is incorrect";
  pageNotFound = () =>
    this.locale === "ja" ? "見つかりません" : "Page Not Found";
  NavigationForPageNotFound = () =>
    this.locale === "ja"
      ? "申し訳ございませんが、お探しの項目は存在しません。" +
        "削除されたか、名前が変更されたか、一時的に利用できない状態になっている可能性があります。"
      : "We're sorry; but the page you were looking for doesn't exist." +
        " It might have been removed; had its name changed;" +
        " or is temporarily unavailable.";
  tryAgain = () =>
    this.locale === "ja"
      ? "設定を変更してやり直してください"
      : "Change the settings and try again";

  // System errors
  onSystemError = () =>
    this.locale === "ja"
      ? "通信状態を確認してやり直してもうまくいかない場合は、" +
        "システム管理者に連絡してください。"
      : " Check your connection and try again. If the operation does not work;" +
        " contact your system administrator.";
  authError = () =>
    this.locale === "ja"
      ? "認証の処理中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred during authentication." + this.onSystemError();
  errorOnDataSend = () =>
    this.locale === "ja"
      ? "送信中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred while saving data." + this.onSystemError();
  errorOnDataSave = () =>
    this.locale === "ja"
      ? "データの保存中にエラーが発生しました。" + this.onSystemError()
      : "An error occurred while sending data." + this.onSystemError();
}

/**
 * Format a date object to an ISO string with the browser timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatISO = (date) =>
  new Date(date.setHours(date.getHours() - new Date().getTimezoneOffset() / 60))
    .toISOString()
    .substring(0, 16);

/**
 * Format a date object with the browser timezone.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => formatISO(date).replace("T", " ");
