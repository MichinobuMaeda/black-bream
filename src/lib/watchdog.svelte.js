/* global $state */
import { store } from "./store.svelte.js";
import { logout } from "./firebase.js";
import { localstorage } from "./localstorage.js";

let watchdogTimeout = $state(0);
let timeoutId = null;

watchdogTimeout = localstorage.watchdogTimeout.load();
console.log("watchdogThresholdMinute", watchdogTimeout);

const startWatchDog = () => {
  if (watchdogTimeout > 0) {
    timeoutId = setTimeout(
      () => {
        logout(store);
        timeoutId = null;
      },
      watchdogTimeout * 60 * 1000,
    );
  }
};

const stopWatchdog = () => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

window.addEventListener("blur-sm", startWatchDog);
window.addEventListener("focus", stopWatchdog);

/**
 * Gets the watchdog threshold in minutes.
 */
export const getWatchdogTimeout = () => watchdogTimeout;

/**
 * Gets the watchdog threshold in minutes.
 */
export const setWatchdogTimeout = (value) => {
  localstorage.watchdogTimeout.save(value);
  stopWatchdog();
};
