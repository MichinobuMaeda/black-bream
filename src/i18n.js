import config from "../theme.js";

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

export class DaysOfWeek {
  /**
   * @constructors
   * @param {string} locale
   */
  constructor(locale) {
    this.locale = locale;
  }

  /**
   * Get the short name of the day of the week.
   *
   * @param {number} index
   * @returns {string}
   */
  short(index) {
    return {
      ja: ['日', '月', '火', '水', '木', '金', '土'],
      en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    }[this.locale][index % 7];
  }

  /**
   * Get the middle size name of the day of the week.
   *
   * @param {number} index
   * @returns {string}
   */
  middle(index) {
    return {
      ja: ['(日)', '(月)', '(火)', '(水)', '(木)', '(金)', '(土)'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    }[this.locale][index % 7];
  }

  /**
   * Get the long name of the day of the week.
   *
   * @param {number} index
   * @returns {string}
   */
  long(index) {
    return {
      ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    }[this.locale][index % 7];
  }
}

/**
 * A class to handle internationalization (i18n) for the application.
 * Provides methods to get localized strings based on the provided locale.
 */
export class I18n {
  /**
   * @constructor
   * @param {string} locale
   */
  constructor(locale) {
    this.locale = locale;
  }

  appTitle() {
    return {
      ja: config.appName,
      en: config.appName,
    }[this.locale];
  }
  send() {
    return {
      ja: "送信",
      en: "Send",
    }[this.locale];
  }
  login() {
    return {
      ja: "ログイン",
      en: "Login",
    }[this.locale];
  }
  logout() {
    return {
      ja: "ログアウト",
      en: "Logout",
    }[this.locale];
  }
  cancel() {
    return {
      ja: "中止",
      en: "Cancel",
    }[this.locale];
  }
  save() {
    return {
      ja: "保存",
      en: "Save",
    }[this.locale];
  }
  goBack() {
    return {
      ja: "戻る",
      en: "Go back",
    }[this.locale];
  }
  info() {
    return {
      ja: "情報",
      en: "Information",
    }[this.locale];
  }
  home() {
    return {
      ja: "ホーム",
      en: "Home",
    }[this.locale];
  }
  list() {
    return {
      ja: "一覧",
      en: "List",
    }[this.locale];
  }
  edit() {
    return {
      ja: "編集",
      en: "Edit",
    }[this.locale];
  }
  create() {
    return {
      ja: "新規作成",
      en: "Create",
    }[this.locale];
  }
  settings() {
    return {
      ja: "設定",
      en: "Settings",
    }[this.locale];
  }
  users() {
    return {
      ja: "ユーザー",
      en: "Users",
    }[this.locale];
  }
  user() {
    return {
      ja: "ユーザー",
      en: "User",
    }[this.locale];
  }
  members() {
    return {
      ja: "メンバー",
      en: "Members",
    }[this.locale];
  }
  groups() {
    return {
      ja: "グループ",
      en: "Groups",
    }[this.locale];
  }
  group() {
    return {
      ja: "グループ",
      en: "Group",
    }[this.locale];
  }
  memberOf() {
    return {
      ja: "所属",
      en: "Member of",
    }[this.locale];
  }
  services() {
    return {
      ja: "サービス",
      en: "Services",
    }[this.locale];
  }
  service() {
    return {
      ja: "サービス",
      en: "Service",
    }[this.locale];
  }
  schedule() {
    return {
      ja: "スケジュール",
      en: "Schedule",
    }[this.locale];
  }
  images() {
    return {
      ja: "画像",
      en: "Images",
    }[this.locale];
  }
  image() {
    return {
      ja: "画像",
      en: "Image",
    }[this.locale];
  }
  posts() {
    return {
      ja: "投稿",
      en: "Posts",
    }[this.locale];
  }
  post() {
    return {
      ja: "投稿",
      en: "Post",
    }[this.locale];
  }
  recentPosts() {
    return {
      ja: "最近の投稿",
      en: "Recent posts",
    }[this.locale];
  }
  recentLogs() {
    return {
      ja: "最近のログ",
      en: "Recent logs",
    }[this.locale];
  }
  text() {
    return {
      ja: "文面",
      en: "Text",
    }[this.locale];
  }
  templates() {
    return {
      ja: "雛形",
      en: "Templates",
    }[this.locale];
  }
  template() {
    return {
      ja: "雛形",
      en: "Template",
    }[this.locale];
  }
  noTemplate() {
    return {
      ja: "テンプレートを使用しない",
      en: "Do not use a template",
    }[this.locale];
  }
  preDefinedSchedules() {
    return {
      ja: "事前設定スケジュール",
      en: "Pre-defined schedules",
    }[this.locale];
  }
  dayOfWeek() {
    return {
      ja: "曜日",
      en: "DoW",
    }[this.locale];
  }
  hour() {
    return {
      ja: "時",
      en: "Hour",
    }[this.locale];
  }
  minute() {
    return {
      ja: "分",
      en: "Minute",
    }[this.locale];
  }
  sunday() {
    return {
      ja: "日",
      en: "Su",
    }[this.locale];
  }
  monday() {
    return {
      ja: "月",
      en: "Mo",
    }[this.locale];
  }
  tuesday() {
    return {
      ja: "火",
      en: "Tu",
    }[this.locale];
  }
  wednesday() {
    return {
      ja: "水",
      en: "We",
    }[this.locale];
  }
  thursday() {
    return {
      ja: "木",
      en: "Th",
    }[this.locale];
  }
  friday() {
    return {
      ja: "金",
      en: "Fr",
    }[this.locale];
  }
  saturday() {
    return {
      ja: "土",
      en: "Sa",
    }[this.locale];
  }
  authentication() {
    return {
      ja: "認証",
      en: "Authentication",
    }[this.locale];
  }
  account() {
    return {
      ja: "アカウント",
      en: "Account",
    }[this.locale];
  }
  profile() {
    return {
      ja: "プロフィール",
      en: "Profile",
    }[this.locale];
  }
  displayName() {
    return {
      ja: "表示名",
      en: "Display name",
    }[this.locale];
  }
  admin() {
    return {
      ja: "システム管理者",
      en: "System administrator",
    }[this.locale];
  }
  manager() {
    return {
      ja: "管理者",
      en: "Manager",
    }[this.locale];
  }
  siteDesc() {
    return {
      ja: "サイトの説明",
      en: "Site description",
    }[this.locale];
  }
  delete() {
    return {
      ja: "削除",
      en: "Delete",
    }[this.locale];
  }
  deleted() {
    return {
      ja: "削除",
      en: "Deleted",
    }[this.locale];
  }
  enabled() {
    return {
      ja: "有効",
      en: "Enabled",
    }[this.locale];
  }
  restricted() {
    return {
      ja: "ログイン不可",
      en: "Disabled",
    }[this.locale];
  }
  email() {
    return {
      ja: "メールアドレス",
      en: "Email",
    }[this.locale];
  }
  changeEmail() {
    return {
      ja: "メールアドレス変更",
      en: "Change email address",
    }[this.locale];
  }
  password() {
    return {
      ja: "パスワード",
      en: "Password",
    }[this.locale];
  }
  loginWithoutPassword() {
    return {
      ja: "パスワードを使わずにログイン",
      en: "Login without a password",
    }[this.locale];
  }
  loginWithPassword() {
    return {
      ja: "メールアドレスとパスワードでログイン",
      en: "Login with your email address and password",
    }[this.locale];
  }
  setPassword() {
    return {
      ja: "パスワード設定",
      en: "Set password",
    }[this.locale];
  }
  changePassword() {
    return {
      ja: "パスワード変更",
      en: "Change password",
    }[this.locale];
  }
  currentPassword() {
    return {
      ja: "現在のパスワード",
      en: "Current password",
    }[this.locale];
  }
  newPassword() {
    return {
      ja: "新しいパスワード",
      en: "New password",
    }[this.locale];
  }
  confirmNewPassword() {
    return {
      ja: "パスワードの確認",
      en: "Confirm new password",
    }[this.locale];
  }
  socialLogin() {
    return {
      ja: "ソーシャルログイン",
      en: "Social login",
    }[this.locale];
  }
  aboutSocialLogin() {
    return {
      ja: "ソーシャルログインは、ソーシャルサービスとこのアプリのログインで" +
          "同じメールアドレスを使用している場合、もしくは、" +
          "このアプリにログイン後にログインに利用するソーシャルアプリを登録した場合に利用できます。",
      en: "Social login can be used if you use the same email address" +
          " to login to the social service and this app," +
          " or if you register a social app to use for logging in" +
          " after logging in to this app.",
    }[this.locale];
  }
  aboutRegisterSocialLogin() {
    return {
      ja: "ソーシャルログインは、ソーシャルサービスとこのアプリのログインで" +
          "同じメールアドレスを使用している場合、もしくは、" +
          "下のボタンでログインに利用するソーシャルアプリを登録した場合に利用できます。",
      en: "Social login can be used if you use the same email address" +
          " to login to the social service and this app," +
          " or if you register a social app to use for logging in" +
          " using the buttons below.",
    }[this.locale];
  }
  timeoutMinutes() {
    return {
      ja: "タイムアウト時間（分）",
      en: "Timeout minutes",
    }[this.locale];
  }
  logoutNow() {
    return {
      ja: "今すぐログアウトする",
      en: "Logout now",
    }[this.locale];
  }
  getAccessToken() {
    return {
      ja: "Access Token を取得する",
      en: "Get access token",
    }[this.locale];
  }
  skipPostingWithoutImage(targets = ['unknown']) {
    return {
      ja: `画像が設定されていないため投稿をスキップします: ${targets.join(", ")}`,
      en: `No image set. Skip posting: ${targets.join(", ")}`,
    }[this.locale];
  }
  current(value) {
    return {
      ja: `変更前: ${value}`,
      en: `Current: ${value}`,
    }[this.locale];
  }
  feeds() {
    return {
      ja: "フィード",
      en: "Feeds",
    }[this.locale];
  }
  urlOfFeeds() {
    return {
      ja: "フィードの URL",
      en: "URL of feeds",
    }[this.locale];
  }
  oneItemPerLine() {
    return {
      ja: "1行に 1個の値を入力してください",
      en: "Enter one item per line",
    }[this.locale];
  }

  // Validation
  errorPasswordStrength() {
    return {
      ja: "強度が不十分です",
      en: "Insufficient strength",
    }[this.locale];
  }
  errorPasswordConfirmation() {
    return {
      ja: "パスワードが一致しません",
      en: "Password does not match",
    }[this.locale];
  }
  length(len) {
    return {
      ja: `${len}文字`,
      en: `Length: ${len}`,
    }[this.locale];
  }
  required() {
    return {
      ja: "入力必須です。",
      en: "Required.",
    }[this.locale];
  }
  greaterOrEqual(num) {
    return {
      ja: `${num} 以上の値を入力してください。`,
      en: `Enter a value greater than or equal to ${num}.`,
    }[this.locale];
  }
  validEmailAddress() {
    return {
      ja: "正しい形式のメールアドレスとしてください",
      en: "Enter a valid email address",
    }[this.locale];
  }
  nameInUse() {
    return {
      ja: "既に使われている名称です。",
      en: "The name is already in use.",
    }[this.locale];
  }

  // Guidances
  updateApp() {
    return {
      ja: "アプリを更新してください",
      en: "Please update this app",
    }[this.locale];
  }
  inMarkdown() {
    return {
      ja: "Markdown で記述してください",
      en: "Write in Markdown",
    }[this.locale];
  }
  aboutLicense({ license } = { license: 'unknown' }) {
    return {
      ja: `このアプリは ${license} ライセンスに基づいて配布されます。`,
      en: `This app is distributed under the ${license} license.`,
    }[this.locale];
  }
  passwordRequirements() {
    return {
      ja: "パスワードは 8 文字以上で、小文字、大文字、数字、記号を使用してください。",
      en: "Please make your password at least 8 characters long" +
          " and contain lowercase and uppercase letters; numbers; and symbols.",
    }[this.locale];
  }
  guideChangingEmail() {
    return {
      ja: "メールアドレスの変更にはパスワードの入力が必要です。" +
          "設定するメールアドレスに間違いがないか確認してください。",
      en: "You need to enter your password to change your email address." +
          " Please make sure the email address you are setting is correct.",
    }[this.locale];
  }
  descPasswordLink() {
    return {
      ja: "はじめてパスワードを設定する場合、または、パスワードを忘れた場合、" +
          "パスワードを設定するリンクを掲載したメールを送信します。",
      en: "If this is your first time setting up a password or" +
          " if you have forgotten your password;" +
          " we will send you an email with a link to set your password.",
    }[this.locale];
  }
  guideOfWatchdogTimeout() {
    return {
      ja: "画面がフォーカスを失った後、自動でログオフするまでの時間を" +
          "分単位で入力してください。" +
          "この機能を使用しない場合は、0 を入力してください。",
      en: "Enter the time in minutes before automatically logging off" +
          " after the screen loses focus." +
          " If you do not want to use this feature; enter 0.",
    }[this.locale];
  }
  allowEmailsFrom(email) {
    return {
      ja: `${email} からのメールを受信できるようにしておいてください。`,
      en: `Please allow us to receive emails from ${email}`,
    }[this.locale];
  }

  // Success responses
  savedData() {
    return {
      ja: "データを保存しました。",
      en: "The data has been saved.",
    }[this.locale];
  }
  sentEmailLink() {
    return {
      ja: "ログイン用のリンクを記載したメールを指定されたアドレスに送信しました。",
      en: "An email with a login link has been sent to the address you provided.",
    }[this.locale];
  }
  sentPasswordLink() {
    return {
      ja: "パスワード設定用のリンクを記載したメールをログイン用のメールアドレスに送信しました。",
      en: "An email with a link to set your password" +
          " has been sent to your login email address.",
    }[this.locale];
  }

  // Error responses
  passwordAuthError() {
    return {
      ja: "ユーザーIDまたはパスワードが正しくありません",
      en: "Invalid user ID or password",
    }[this.locale];
  }
  currentPasswordError() {
    return {
      ja: "現在のパスワードが正しくありません",
      en: "The current password is incorrect",
    }[this.locale];
  }
  pageNotFound() {
    return {
      ja: "見つかりません",
      en: "Page Not Found",
    }[this.locale];
  }
  NavigationForPageNotFound() {
    return {
      ja: "申し訳ございませんが、お探しの項目は存在しません。" +
          "削除されたか、名前が変更されたか、一時的に利用できない状態になっている可能性があります。",
      en: "We're sorry; but the page you were looking for doesn't exist." +
          " It might have been removed; had its name changed;" +
          " or is temporarily unavailable.",
    }[this.locale];
  }
  tryAgain() {
    return {
      ja: "設定を変更してやり直してください",
      en: "Change the settings and try again",
    }[this.locale];
  }

  // System errors
  onSystemError() {
    return {
      ja: "通信状態を確認してやり直してもうまくいかない場合は、" +
          "システム管理者に連絡してください。",
      en: " Check your connection and try again. If the operation does not work;" +
          " contact your system administrator.",
    }[this.locale];
  }
  authError() {
    return {
      ja: "認証の処理中にエラーが発生しました。" + this.onSystemError(),
      en: "An error occurred during authentication." + this.onSystemError(),
    }[this.locale];
  }
  errorOnDataSend() {
    return {
      ja: "送信中にエラーが発生しました。" + this.onSystemError(),
      en: "An error occurred while saving data." + this.onSystemError(),
    }[this.locale];
  }
  errorOnDataSave() {
    return {
      ja: "データの保存中にエラーが発生しました。" + this.onSystemError(),
      en: "An error occurred while sending data." + this.onSystemError(),
    }[this.locale];
  }
}
