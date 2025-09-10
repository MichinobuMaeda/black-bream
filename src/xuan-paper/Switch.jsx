import PropTypes from "prop-types";

/**
 * A toggle switch component that provides an intuitive on/off control interface.
 * Features a sliding toggle with visual feedback, checkmark icon when enabled,
 * and automatic light/dark theme adaptation.
 * Commonly used for settings and preferences.
 * @param {object} props - The props object
 * @param {string} [props.id] - Unique identifier for the switch input element
 * @param {boolean} props.value - Current state of the switch (true for on/enabled, false for off/disabled)
 * @param {Function} [props.onChange] - Callback function called when switch state changes
 * @param {boolean} [props.disabled=false] - Whether the switch is disabled and non-interactive
 * @returns {JSX.Element} Rendered switch component
 * @example
 * // Basic switch for notifications
 * <Switch
 *   id="notifications"
 *   value={notificationsEnabled}
 *   onChange={(enabled) => setNotificationsEnabled(enabled)}
 * />
 * @example
 * // Switch with disabled state
 * <Switch
 *   id="premium-feature"
 *   value={premiumEnabled}
 *   onChange={setPremiumEnabled}
 *   disabled={!isPremiumUser}
 * />
 * @example
 * // Dark mode toggle switch
 * <Switch
 *   id="dark-mode"
 *   value={isDarkMode}
 *   onChange={(enabled) => {
 *     setIsDarkMode(enabled);
 *     document.documentElement.classList.toggle('dark', enabled);
 *   }}
 * />
 * @example
 * // Auto-save setting switch
 * <Switch
 *   id="auto-save"
 *   value={autoSaveEnabled}
 *   onChange={handleAutoSaveToggle}
 * />
 */

const Switch = ({ id, value = false, onChange, disabled }) => {
  return (
    <div className="flex flex-row relative">
      <input
        type="checkbox"
        id={id}
        checked={value}
        value={id}
        className={`appearance-none h-8 w-14 rounded-full transition-all duration-200
${disabled ? "" : "cursor-pointer"}
${
  value
    ? disabled
      ? "opacity-50 bg-light-on-surface dark:bg-dark-on-surface"
      : `bg-light-primary dark:bg-dark-primary
         hover:bg-light-primary/90 dark:hover:bg-dark-primary/90
         active:bg-light-primary/80 dark:active:bg-dark-primary/80`
    : `border-2
      ${
        disabled
          ? `opacity-50 bg-light-on-surface dark:bg-dark-on-surface
            border-light-on-surface dark:border-dark-on-surface`
          : `bg-light-surface-container-highest dark:bg-dark-surface-container-highest
            border-light-outline dark:border-dark-outline
            hover:bg-light-surface-container-high dark:hover:bg-dark-surface-container-high
            hover:border-light-outline/80 dark:hover:border-dark-outline/80
            active:bg-light-surface-container dark:active:bg-dark-surface-container`
      }`
}`}
        onChange={() => {
          value = !value;
          onChange(value);
        }}
        disabled={disabled}
      />
      {value ? (
        /* Material icons 'Check' https://fonts.google.com/icons */
        <svg
          className={`absolute inset-x-7 inset-y-1 size-6 rounded-full
      pointer-events-none transition-all duration-200
      ${
        disabled
          ? `opacity-50 bg-light-surface dark:bg-dark-surface
            text-light-on-surface dark:text-dark-on-surface`
          : `bg-light-on-primary dark:bg-dark-on-primary
            text-light-on-primary-container dark:text-dark-on-primary-container`
      }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
          fill="currentColor"
        >
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        </svg>
      ) : (
        <div
          className={`absolute inset-2 size-4 rounded-full
            pointer-events-none transition-all duration-200
            ${
              disabled
                ? "opacity-50 bg-light-on-surface dark:bg-dark-on-surface"
                : `bg-light-outline dark:bg-dark-outline
                   group-hover:bg-light-outline/80 dark:group-hover:bg-dark-outline/80`
            }`}
        ></div>
      )}
    </div>
  );
};

Switch.propTypes = {
  id: PropTypes.string,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default Switch;
