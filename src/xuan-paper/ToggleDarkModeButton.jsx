/**
 * @file ToggleDarkModeButton component for theme switching functionality.
 * Provides a button that cycles through system, light, and dark themes with persistence.
 * @author Michinobu Maeda
 * @since 1.0.0
 */

import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";

import Button from "./Button.jsx";

const STORAGE_KEY = "xuan-paper-theme-mode";

const modeSystem = "system";
const modeLight = "light";
const modeDark = "dark";

/**
 * Computes the actual theme mode (dark/light) based on system preference and user setting.
 * @param {string} systemMode - The system's preferred color scheme ("light" or "dark")
 * @param {string} brightnessSetting - The user's brightness setting ("system", "light", or "dark")
 * @returns {boolean} True for dark mode, false for light mode
 */
// Compute theme mode from app settings and system mode
const computeMode = (systemMode, brightnessSetting) =>
  brightnessSetting === modeLight
    ? false
    : brightnessSetting === modeDark
      ? true
      : systemMode === modeDark;

/**
 * Determines the next mode in the cycling sequence based on current system and user settings.
 * @param {string} systemMode - The system's preferred color scheme ("light" or "dark")
 * @param {string} brightnessSetting - The current user brightness setting
 * @returns {string} The next brightness setting in the cycle
 */
// Determine next mode in the cycle
const nextMode = (systemMode, brightnessSetting) =>
  brightnessSetting === modeSystem
    ? systemMode === modeDark
      ? modeLight
      : modeDark
    : brightnessSetting === modeLight
      ? systemMode === modeDark
        ? modeDark
        : modeSystem
      : systemMode === modeDark
        ? modeSystem
        : modeLight;

/**
 * A toggle button component that cycles between system preference, light mode, and dark mode.
 * Automatically detects system preference via media queries and persists user's choice in localStorage.
 *
 * The component provides intelligent theme switching with three states:
 * 1. **System preference** (default) - automatically follows the device's color scheme preference
 * 2. **Light mode** - forces light theme regardless of system preference
 * 3. **Dark mode** - forces dark theme regardless of system preference
 *
 * Key features:
 * - Automatically detects and responds to system color scheme changes
 * - Persists user preference across browser sessions using localStorage
 * - Applies theme changes by adding/removing "dark" class on document element
 * - Displays appropriate icons for each state (system/brightness/dark mode icons)
 * - Integrates seamlessly with Tailwind CSS dark mode utilities
 * - Supports all Button component styling options
 *
 * CSS Setup Required:
 * To enable dark mode styles in your application, add this custom variant to your CSS:
 * ```css
 * @custom-variant dark (&:where(.dark, .dark *));
 * ```
 *
 * The component automatically manages the "dark" class on the document element,
 * allowing Tailwind CSS dark: modifiers to work correctly.
 * @component
 * @param {object} props - Component props
 * @param {string} [props.style] - Visual style variant for the button (defaults to "embedded")
 * @param {string} [props.size] - Size variant for the button (defaults to "sm")
 * @returns {JSX.Element} A button with dynamic icon that reflects current theme mode
 * @example
 * // Basic usage in a header component
 * import ToggleDarkModeButton from '../xuan-paper/ToggleDarkModeButton';
 *
 * const Header = () => (
 *   <header className="flex justify-between items-center p-4">
 *     <h1>My App</h1>
 *     <div className="flex gap-2">
 *       <ToggleDarkModeButton />
 *       <UserMenuButton />
 *     </div>
 *   </header>
 * );
 * @example
 * // Custom styling with different button appearance
 * <ToggleDarkModeButton style="outlined" size="md" />
 * @example
 * // Usage in a settings panel
 * const SettingsPanel = () => (
 *   <div className="p-4">
 *     <h2>Appearance Settings</h2>
 *     <div className="flex items-center gap-3">
 *       <span>Theme:</span>
 *       <ToggleDarkModeButton style="tonal" />
 *     </div>
 *   </div>
 * );
 */

const ToggleDarkModeButton = ({ style = "embedded", size = "sm" }) => {
  // Initialize state from localStorage or default to system
  const [brightnessSetting, setBrightnessSetting] = useState(
    () => localStorage.getItem(STORAGE_KEY) || modeSystem,
  );
  const [systemMode, setSystemMode] = useState("light");

  const darkTheme = useMemo(
    () => computeMode(systemMode, brightnessSetting),
    [brightnessSetting, systemMode],
  );

  // Handle media query changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Set initial value
    setSystemMode(mediaQuery.matches ? modeDark : modeLight);

    const handleChange = (event) => {
      setSystemMode(event.matches ? modeDark : modeLight);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Save mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, brightnessSetting);
  }, [brightnessSetting]);

  // Apply mode changes
  useEffect(() => {
    document.documentElement.className = darkTheme ? "dark" : "";
  }, [darkTheme]);

  return (
    <Button
      icon={
        brightnessSetting === modeSystem ? (
          /* Material icons 'Reset brightness' https://fonts.google.com/icons */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-252q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680v400Zm0 140 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" />
          </svg>
        ) : brightnessSetting === modeLight ? (
          /* Material icons 'Light mode' https://fonts.google.com/icons */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z" />
          </svg>
        ) : (
          /* Material icons 'Dark mode' https://fonts.google.com/icons */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z" />
          </svg>
        )
      }
      onClick={() =>
        setBrightnessSetting(nextMode(systemMode, brightnessSetting))
      }
      style={style}
      size={size}
    />
  );
};

ToggleDarkModeButton.propTypes = {
  style: PropTypes.string,
  size: PropTypes.string,
};

export default ToggleDarkModeButton;
