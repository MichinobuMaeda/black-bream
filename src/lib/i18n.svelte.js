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
  m.en.logoutWarning = () => "Normally there is no need to log out.";
  m.ja.logoutWarning = () => "通常はログアウトする必要はありません。";
  m.en.info = () => "Info";
  m.ja.info = () => "情報";
  m.en.home = () => "Home";
  m.ja.home = () => "ホーム";
  m.en.settings = () => "Settings";
  m.ja.settings = () => "設定";
  m.en.account = () => "Account";
  m.ja.account = () => "アカウント";
  m.en.email = () => "Email";
  m.ja.email = () => "メールアドレス";
  m.en.password = () => "Password";
  m.ja.password = () => "パスワード";
  m.en.generated = () => "Generated";
  m.ja.generated = () => "生成しました";
  m.en.copied = () => "Copied";
  m.ja.copied = () => "コピーしました";
  m.en.try_again = () => "Change the settings and try again";
  m.ja.try_again = () => "設定を変更してやり直してください";
  m.en.length = ({ len }) => `Length: ${len}`;
  m.ja.length = ({ len }) => `${len}文字`;

  return m;
})();

let locale = $state(localStorage.getItem(localeKey) ?? "ja");
let localizedMessage = $derived(messages[locale]);
export const m = () => localizedMessage;

export const getLocale = () => locale;
export const setLocale = (newLocale) => {
  locale = newLocale;
};

export const activateI18n = () => {
  $effect(() => {
    localStorage.setItem(localeKey, locale);
  });
};
