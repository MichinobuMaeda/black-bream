import Button from "./Button.jsx";

import { useRegisterSW } from "virtual:pwa-register/react";
import PropTypes from "prop-types";

/**
 * PWA status notification component that displays offline readiness and update prompts.
 * This component is built upon the @vite-pwa/pwa plugin's useRegisterSW hook to handle
 * PWA lifecycle events and service worker updates.
 *
 * The component renders:
 * - An update notification with reload button when a new version is available
 * - An offline ready notification when content has been cached for offline use
 * - Nothing when no PWA status updates are available
 * @component
 * @generated Based on the @vite-pwa/pwa plugin setup with customized UI
 * @param {object} props - Component props
 * @param {number} [props.checkForUpdateInterval=60*60*1000] - Interval in milliseconds to check for PWA updates (default: 1 hour)
 * @param {string} [props.offlineReadyMessage="App ready to work offline"] - Message to display when the app is ready for offline use
 * @param {string} [props.needRefreshMessage="New app available, click on reload button to update."] - Message to display when a new version is available
 * @returns {JSX.Element|null} A notification badge or null if no notifications
 * @example
 * // Basic usage in a layout component
 * import PWABadge from '../components/PWABadge';
 *
 * function Layout() {
 *   return (
 *     <header>
 *       <h1>My PWA App</h1>
 *       <PWABadge />
 *     </header>
 *   );
 * }
 * @example
 * // With custom messages and update interval
 * <PWABadge
 *   checkForUpdateInterval={30 * 60 * 1000}
 *   offlineReadyMessage="Your app is now available offline!"
 *   needRefreshMessage="Update available! Click to refresh."
 * />
 */

/**
 * PWA Badge component that displays notifications for service worker updates and offline status.
 * Handles automatic update checks and provides user notifications for app updates and offline readiness.
 * @component
 * @param {object} props - Component props
 * @param {number} [props.checkForUpdateInterval] - Interval in milliseconds for checking updates
 * @param {string} [props.offlineReadyMessage] - Message to display when app is ready offline
 * @param {string} [props.needRefreshMessage] - Message to display when app update is available
 * @returns {JSX.Element} PWA notification badge component
 */
function PWABadge({
  checkForUpdateInterval = 60 * 60 * 1000,
  offlineReadyMessage = "App ready to work offline",
  needRefreshMessage = "New app available, click on reload button to update.",
}) {
  const period = checkForUpdateInterval;

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          /** @type {ServiceWorker} */
          const sw = e.target;
          if (sw.state === "activated") registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  /**
   * Closes the PWA notification badge by resetting offline ready and need refresh states.
   * @returns {void}
   */
  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return needRefresh || true ? (
    <div
      className={`flex flex-row py-1 px-2 h-12 items-center gap-2
        bg-light-error-container dark:bg-dark-error-container
        text-light-on-error-container dark:text-dark-on-error-container`}
    >
      <div className="flex flex-row grow">{needRefreshMessage}</div>
      <Button
        icon={
          /* Material icons 'Refresh' https://fonts.google.com/icons */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
          </svg>
        }
        style="danger"
        size="xs"
        onClick={() => updateServiceWorker(true)}
      />
    </div>
  ) : offlineReady ? (
    <div
      className={`flex flex-row py-1 px-2 h-12 items-center gap-2
        bg-light-primary-container dark:bg-dark-primary-container
        text-light-on-primary-container dark:text-dark-on-primary-container`}
    >
      <div className="flex flex-row grow">{offlineReadyMessage}</div>
      <Button
        icon={
          /* Material icons 'Close' https://fonts.google.com/icons */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        }
        style="text"
        size="xs"
        onClick={() => close()}
      />
    </div>
  ) : (
    <></>
  );
}
PWABadge.propTypes = {
  checkForUpdateInterval: PropTypes.number,
  offlineReadyMessage: PropTypes.string,
  needRefreshMessage: PropTypes.string,
};

export default PWABadge;

/**
 * Registers a periodic check for service worker updates at specified intervals.
 * This function implements a polling mechanism to check if a new service worker
 * version is available by fetching the service worker URL with cache bypassing.
 *
 * The function:
 * 1. Sets up an interval timer based on the provided period
 * 2. Skips update checks when the device is offline
 * 3. Fetches the service worker file with cache headers that prevent caching
 * 4. Triggers the service worker update process if a new version is available
 * @private
 * @function
 * @param {number} period - Interval in milliseconds between update checks
 * @param {string} swUrl - URL of the service worker file to check for updates
 * @param {ServiceWorkerRegistration} r - Service worker registration object to update
 * @returns {void}
 */
function registerPeriodicSync(period, swUrl, r) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}
