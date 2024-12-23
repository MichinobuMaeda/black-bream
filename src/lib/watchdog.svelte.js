import { logout } from "./store.svelte";

const localeKey = "black_bream_watchdog";

let watchdogTimeout = $state(0);
let timeoutId = null;

watchdogTimeout = Number(localStorage.getItem(localeKey)) ?? 0;
console.log("watchdogThresholdMinute", watchdogTimeout);

const startWatchDog = () => {
  if (watchdogTimeout > 0) {
    timeoutId = setTimeout(() => logout(), watchdogTimeout * 60 * 1000);
  }
};

const stopWatchdog = () => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

window.addEventListener("blur", startWatchDog);
window.addEventListener("focus", stopWatchdog);

/**
 * Gets the watchdog threshold in minutes.
 */
export const getWatchdogTimeout = () => watchdogTimeout;

/**
 * Gets the watchdog threshold in minutes.
 */
export const setWatchdogTimeout = (value) => {
  watchdogTimeout = Number(value);
  localStorage.setItem(localeKey, watchdogTimeout.toString());
  stopWatchdog();
};
