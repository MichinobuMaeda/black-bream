import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  en: {
    label: "En",
    translation: {
      "offline ready": "You can install this app for offline use.",
      "need refresh": "A new app is available. Click to refresh.",
      "pin menu": "Pin the menu",
      "unpin menu": "Unpin the menu",
    },
  },
  ja: {
    label: "日",
    translation: {
      "offline ready":
        "このアプリはオフラインで使用するためにインストールできます。",
      "need refresh":
        "新しいアプリがあります。ボタンをクリックして更新してください。",
      "pin menu": "メニューをピン留め",
      "unpin menu": "メニューのピン留め解除",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export default i18n;
