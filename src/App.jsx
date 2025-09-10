import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
// import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { Outlet } from "react-router";
import appLogo from "./assets/images/favicon.svg";
import AppBar from "./xuan-paper/AppBar.jsx";
import Button from "./xuan-paper/Button.jsx";
import ToggleDarkModeButton from "./xuan-paper/ToggleDarkModeButton.jsx";
import ToggleLanguageButton from "./xuan-paper/ToggleLanguageButton.jsx";
import PWABadge from "./xuan-paper/PWABadge.jsx";
import NavigationDrawer from "./xuan-paper/NavigationDrawer.jsx";
import Fab from "./xuan-paper/Fab.jsx";
import SvgArrowBackIosNew from "./icons/SvgArrowBackIosNew.jsx";
import SvgMenu from "./icons/SvgMenu";
import SvgKeep from "./icons/SvgKeep.jsx";
import SvgKeepOff from "./icons/SvgKeepOff.jsx";
import SvgAdd2 from "./icons/SvgAdd2.jsx";
import "./App.css";

const appName = "Black bream";

/**
 * Main application component that renders the app layout with header, PWA badge, and main content.
 * Handles scroll-based UI behavior to auto-hide the header when scrolling down.
 * @component
 * @returns {JSX.Element} The main app layout with navigation drawer, app bar, and content area
 */
function App() {
  const { t } = useTranslation();

  /** @type {[number, Function]} Scroll direction state for UI auto-hiding behavior */
  const [scrollDirection, setScrollDirection] = useState(0);
  /** @type {[number, Function]} Last recorded scroll Y position */
  const [lastScrollY, setLastScrollY] = useState(0);

  // Set up scroll listener for auto-hiding UI elements
  window.addEventListener("scroll", () => {
    // Only update if we've scrolled significantly (1/8 of viewport height)
    if (Math.abs(window.scrollY - lastScrollY) > window.innerHeight / 8) {
      if (lastScrollY !== 0) {
        setScrollDirection(window.scrollY - lastScrollY);
      }
      setLastScrollY(window.scrollY);
    }
  });

  /** @type {string} Dynamic CSS classes for header auto-hide behavior on scroll */
  const headerOptionalClass = `sticky top-0 transition-all duration-500
    ${scrollDirection > 0 ? `-translate-y-14 md:translate-0` : ""}`;

  /** @constant {string} Local storage key for drawer state persistence */
  const STORAGE_KEY_DRAWER = "xuan-paper-drawer-state-close";
  /** @constant {object} Drawer state enumeration */
  const DRAWER_STATE = { OPENED: "open", CLOSED: "close", PINNED: "pinned" };
  console.log(`window.innerWidth: ${window.innerWidth}`);
  /** @type {[string, Function]} Navigation drawer state management */
  const [drawerState, setDrawerState] = useState(
    () =>
      localStorage.getItem(STORAGE_KEY_DRAWER) ||
      (window.innerWidth < 1024 ? DRAWER_STATE.CLOSED : DRAWER_STATE.PINNED),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DRAWER, drawerState);
  }, [drawerState]);

  return (
    <div
      className={`flex flex-col justify-start items-start
      ${drawerState === DRAWER_STATE.PINNED ? "pl-84" : ""} min-h-screen`}
    >
      <AppBar
        appLogo={
          <img
            src={appLogo}
            className="size-10 min-w-10"
            alt={`${appName} logo`}
          />
        }
        appName={appName}
        prefix={[
          <Button.forAppBar
            key="back"
            icon={<SvgArrowBackIosNew />}
            onClick={() => window.history.back()}
          />,
          drawerState !== DRAWER_STATE.PINNED && (
            <Button.forAppBar
              key="menu"
              icon={<SvgMenu />}
              onClick={() => setDrawerState(DRAWER_STATE.OPENED)}
            />
          ),
        ]}
        suffix={[
          <ToggleLanguageButton key="language" />,
          <ToggleDarkModeButton key="dark-mode" />,
        ]}
        optionalClass={headerOptionalClass}
      />
      <main className="flex flex-col justify-start items-start pb-8 gap-2 w-full">
        <div
          className={`flex flex-col w-full top-safe-offset-14 z-30
            ${headerOptionalClass}`}
        >
          <PWABadge
            checkForUpdateInterval={60 * 60 * 1000}
            needRefreshMessage={t("need refresh")}
            offlineReadyMessage={t("offline ready")}
          />
        </div>
        <Outlet />
      </main>
      <NavigationDrawer
        keep={drawerState === DRAWER_STATE.PINNED}
        open={drawerState === DRAWER_STATE.OPENED}
        onClose={() => setDrawerState(DRAWER_STATE.CLOSED)}
        items={[
          drawerState === DRAWER_STATE.PINNED
            ? {
                label: t("unpin menu"),
                icon: <SvgKeepOff />,
                onClick: () => setDrawerState(DRAWER_STATE.OPENED),
              }
            : {
                label: t("pin menu"),
                icon: <SvgKeep />,
                onClick: () => setDrawerState(DRAWER_STATE.PINNED),
              },
        ]}
      />
      <Fab
        icon={<SvgAdd2 />}
        position={`fixed bottom-safe mb-4 right-4 z-40`}
      />
    </div>
  );
}

export default App;
