import SvgHome from "./SvgHome.svelte";
import SvgSettings from "./SvgSettings.svelte";
import SvgAccountCircle from "./SvgAccountCircle.svelte";
import SvgLogin from "./SvgLogin.svelte";
import SvgInfo from "./SvgInfo.svelte";

export const APP_NAME = "Black bream";

export const pageHome = { id: "home", icon: SvgHome, label: "ホーム" };
export const pageSetting = { id: "settings", icon: SvgSettings, label: "設定" };
export const pageAccount = {
  id: "account",
  icon: SvgAccountCircle,
  label: "アカウント",
};
export const pageLogin = { id: "login", icon: SvgLogin, label: "ログイン" };
export const pageInfo = { id: "info", icon: SvgInfo, label: "情報" };
