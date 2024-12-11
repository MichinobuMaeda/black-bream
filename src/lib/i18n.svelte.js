/* global $state, $derived, $effect */
export const locales = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

const localeKey = "black_bream_locale";
const messages = (() => {
  const m = { en: {}, ja: {} };

  m.en.updateApp = () => "Please update this app";
  m.ja.updateApp = () => "アプリを更新してください";
  m.en.appTitle = () => "Black bream";
  m.ja.appTitle = () => "Black bream";
  m.en.login = () => "Login";
  m.ja.login = () => "ログイン";
  m.en.logout = () => "Logout";
  m.ja.logout = () => "ログアウト";
  m.en.cancel = () => "Cancel";
  m.ja.cancel = () => "中止";
  m.en.save = () => "Save";
  m.ja.save = () => "保存";
  m.en.goBack = () => "Go back";
  m.ja.goBack = () => "戻る";
  m.en.logoutWarning = () => "Normally there is no need to log out.";
  m.ja.logoutWarning = () => "通常はログアウトする必要はありません。";
  m.en.info = () => "Info";
  m.ja.info = () => "情報";
  m.en.home = () => "Home";
  m.ja.home = () => "ホーム";
  m.en.list = () => "List";
  m.ja.list = () => "一覧";
  m.en.edit = () => "Edit";
  m.ja.edit = () => "編集";
  m.en.create = () => "Create";
  m.ja.create = () => "新規作成";
  m.en.settings = () => "Settings";
  m.ja.settings = () => "設定";
  m.en.users = () => "Users";
  m.ja.users = () => "ユーザー";
  m.en.user = () => "User";
  m.ja.user = () => "ユーザー";
  m.en.members = () => "Members";
  m.ja.members = () => "メンバー";
  m.en.groups = () => "Groups";
  m.ja.groups = () => "グループ";
  m.en.group = () => "Group";
  m.ja.group = () => "グループ";
  m.en.memberOf = () => "Member of";
  m.ja.memberOf = () => "所属";
  m.en.account = () => "Account";
  m.ja.account = () => "アカウント";
  m.en.profile = () => "Profile";
  m.ja.profile = () => "プロフィール";
  m.en.displayName = () => "Display name";
  m.ja.displayName = () => "表示名";
  m.en.admin = () => "System administrator";
  m.ja.admin = () => "システム管理者";
  m.en.manager = () => "Manager";
  m.ja.manager = () => "管理者";
  m.en.email = () => "Email";
  m.ja.email = () => "メールアドレス";
  m.en.changeEmail = () => "Change email address";
  m.ja.changeEmail = () => "メールアドレス変更";
  m.en.guideChangingEmail = () =>
    "Please ask your administrator to change the email address for login.";
  m.ja.guideChangingEmail = () =>
    "ログイン用のメールアドレスの変更は管理者に依頼してください。";
  m.en.password = () => "Password";
  m.ja.password = () => "パスワード";
  m.en.changePassword = () => "Change password";
  m.ja.changePassword = () => "パスワード変更";
  m.en.currentPassword = () => "Current password";
  m.ja.currentPassword = () => "現在のパスワード";
  m.en.newPassword = () => "New password";
  m.ja.newPassword = () => "新しいパスワード";
  m.en.confirmNewPassword = () => "Confirm new password";
  m.ja.confirmNewPassword = () => "パスワードの確認";
  m.en.errorPasswordStrength = () => "Insufficient strength";
  m.ja.errorPasswordStrength = () => "強度が不十分です";
  m.en.errorPasswordConfirmation = () => "Password does not match";
  m.ja.errorPasswordConfirmation = () => "パスワードが一致しません";
  m.en.passwordRequirements = () =>
    "Please make your password at least 8 characters long" +
    " and use at least 3 of the following:" +
    " lowercase letters, uppercase letters, numbers, and symbols.";
  m.ja.passwordRequirements = () =>
    "パスワードは 8 文字以上で、小文字、大文字、数字、記号のうち少なくとも 3 つを使用してください。";
  m.en.inMarkdown = () => "Write in Markdown";
  m.ja.inMarkdown = () => "Markdown で記述してください";
  m.en.siteDesc = () => "Site description";
  m.ja.siteDesc = () => "サイトの説明";
  m.en.aboutLicense = ({ license }) =>
    `This app is distributed under the ${license} license.`;
  m.ja.aboutLicense = ({ license }) =>
    `このアプリは ${license} ライセンスに基づいて配布されます。`;
  m.en.current = () => "Current";
  m.ja.current = () => "変更前";
  m.en.errorRequired = () => "Required";
  m.ja.errorRequired = () => "入力必須です";
  m.en.pageNotFound = () => "Page Not Found";
  m.ja.pageNotFound = () => "見つかりません";
  m.en.NavigationForPageNotFound = () =>
    "We're sorry, but the page you were looking for doesn't exist." +
    " It might have been removed, had its name changed, or is temporarily unavailable.";
  m.ja.NavigationForPageNotFound = () =>
    "申し訳ございませんが、お探しの項目は存在しません。" +
    "削除されたか、名前が変更されたか、一時的に利用できない状態になっている可能性があります。";
  m.en.tryAgain = () => "Change the settings and try again";
  m.ja.tryAgain = () => "設定を変更してやり直してください";
  m.en.length = ({ len }) => `Length: ${len}`;
  m.ja.length = ({ len }) => `${len}文字`;

  return m;
})();

let locale = $state(localStorage.getItem(localeKey) ?? "ja");

export const getLocale = () => locale;
export const setLocale = (newLocale) => {
  locale = newLocale;
};

let localizedMessage = $derived(messages[locale]);
export const m = () => localizedMessage;

export const activateI18n = () => {
  $effect(() => {
    localStorage.setItem(localeKey, locale);
  });
};
