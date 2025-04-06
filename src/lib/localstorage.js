const LSKeyLocale = "black_bream_locale";
const LSKeyEmail = "black_bream_email";
const LSKeyTwitterState = "black_bream_twitter_state";
const LSKeyTwitterChallenge = "black_bream_twitter_challenge";
const LSKeyTumblrState = "black_bream_tumblr_state";
const LSKeyWatchdogTimeout = "black_bream_watchdog_timeout";

const getItem = (key) => window.localStorage.getItem(key);
const setItem = (key, value) => window.localStorage.setItem(key, value);
const removeItem = (key) => window.localStorage.removeItem(key);

export const localstorage = {
  locale: {
    load: () => getItem(LSKeyLocale) ?? "ja",
    save: (v) => setItem(LSKeyLocale, (v || "ja").toString()),
  },
  email: {
    load: () => getItem(LSKeyEmail) ?? "",
    save: (v) => setItem(LSKeyEmail, (v ?? "").toString()),
    clear: () => removeItem(LSKeyEmail),
  },
  twitter: {
    state: {
      load: () => getItem(LSKeyTwitterState) ?? "",
      save: (v) => setItem(LSKeyTwitterState, (v ?? "").toString()),
    },
    challenge: {
      load: () => getItem(LSKeyTwitterChallenge) ?? "",
      save: (v) => setItem(LSKeyTwitterChallenge, (v ?? "").toString()),
    },
  },
  tumblr: {
    state: {
      load: () => getItem(LSKeyTumblrState) ?? "",
      save: (v) => setItem(LSKeyTumblrState, (v ?? "").toString()),
    },
  },
  watchdogTimeout: {
    load: () => Number(getItem(LSKeyWatchdogTimeout)) || 0,
    save: (v) => setItem(LSKeyWatchdogTimeout, Number(v ?? 0).toString()),
  },
};
