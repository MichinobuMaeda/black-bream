/* global $state, $derived, $effect */
const langKey = "black_bream_lang";
const messages = (() => {
  const m = { en: {}, ja: {} };

  m.en.updateApp = () => "Please update this app";
  m.ja.updateApp = () => "アプリを更新してください";
  m.en.appTitle = () => "Black bream";
  m.ja.appTitle = () => "Black bream";
  m.en.login = () => "Login";
  m.ja.login = () => "ログイン";
  m.en.info = () => "Info";
  m.ja.info = () => "情報";
  m.en.home = () => "Home";
  m.ja.home = () => "ホーム";
  m.en.settings = () => "Settings";
  m.ja.settings = () => "設定";
  m.en.account = () => "Account";
  m.ja.account = () => "アカウント";
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
  m.en.manual = () => "Manual";
  m.ja.manual = () => "詳細設定";

  return m;
})();

let lang = $state(localStorage.getItem(langKey) ?? "ja");
let localizedMessage = $derived(messages[lang]);
export const m = () => localizedMessage;

export const getLang = () => lang;
export const setLang = (newLang) => {
  lang = newLang;
};

export const activateI18n = () => {
  $effect(() => {
    localStorage.setItem(langKey, lang);
  });
};
