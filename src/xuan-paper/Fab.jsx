import PropTypes from "prop-types";
import { useState } from "react";

const activeColor = (color = "primary") => {
  switch (color) {
    case "secondary":
      return `bg-light-secondary-container dark:bg-dark-secondary-container
        text-light-on-secondary-container dark:text-dark-on-secondary-container
        active:brightness-104 dark:active:brightness-90
        hover:brightness-102 dark:hover:brightness-95`;
    case "tertiary":
      return `bg-light-tertiary-container dark:bg-dark-tertiary-container
        text-light-on-tertiary-container dark:text-dark-on-tertiary-container
        active:brightness-104 dark:active:brightness-90
        hover:brightness-102 dark:hover:brightness-95`;
    default:
      return `bg-light-primary-container dark:bg-dark-primary-container
        text-light-on-primary-container dark:text-dark-on-primary-container
        active:brightness-104 dark:active:brightness-90
        hover:brightness-102 dark:hover:brightness-95`;
  }
};

const openedColor = (color = "primary") => {
  switch (color) {
    case "secondary":
      return `bg-light-secondary dark:bg-dark-secondary
        text-light-on-secondary dark:text-dark-on-secondary
        active:brightness-120 dark:active:brightness-90
        hover:brightness-110 dark:hover:brightness-95`;
    case "tertiary":
      return `bg-light-tertiary dark:bg-dark-tertiary
        text-light-on-tertiary dark:text-dark-on-tertiary
        active:brightness-120 dark:active:brightness-90
        hover:brightness-110 dark:hover:brightness-95`;
    default:
      return `bg-light-primary dark:bg-dark-primary
        text-light-on-primary dark:text-dark-on-primary
        active:brightness-120 dark:active:brightness-90
        hover:brightness-110 dark:hover:brightness-95`;
  }
};

/**
 * @typedef {object} FabMenuItemProp
 * @property {React.ReactNode} icon - The icon to display alongside the label
 * @property {string} label - The label of the menu item
 * @property {Function} onClick - The click event handler for the menu item
 * @property {boolean} disabled - Whether the menu item is disabled
 */

const FabMenuItem = ({ icon, label, onClick, disabled, color = "primary" }) => {
  return (
    <button
      className={`flex flex-row rounded-full h-14 px-4 py-4 gap-2 text-nowrap
        shadow-md shadow-light-shadow/30 dark:shadow-dark-shadow/30 ${
          disabled
            ? `bg-light-surface-dim dark:bg-dark-surface-dim
          text-light-on-surface/40 dark:text-dark-on-surface/40`
            : activeColor(color)
        }`}
      onClick={disabled ? undefined : onClick}
    >
      {icon && <div className="size-6">{icon}</div>}
      {label}
    </button>
  );
};

FabMenuItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  color: PropTypes.oneOf(["primary", "secondary", "tertiary"]),
};

/**
 * Floating Action Button (FAB) component with expandable menu functionality.
 * Provides a primary action button that can expand to show additional menu items.
 * Follows Material Design 3 FAB guidelines with support for different color variants.
 * @component
 * @param {object} props - Component props
 * @param {string} [props.id] - HTML ID attribute for the FAB button
 * @param {React.ReactNode} [props.icon] - Icon to display in the FAB button
 * @param {string} [props.label] - Text label for the FAB button
 * @param {Array} [props.items] - Array of menu items to display when FAB is expanded
 * @param {boolean} [props.hidden] - Whether the FAB should be hidden
 * @param {string} [props.color] - Color variant (primary, secondary, tertiary)
 * @param {string} [props.position] - CSS positioning classes for the FAB
 * @param {Function} [props.onClick] - Click handler for the main FAB button
 * @returns {JSX.Element} FAB component with optional expandable menu
 */
function Fab({
  id,
  icon,
  label,
  items = [],
  hidden = false,
  color = "primary",
  position = "fixed bottom-safe-offset-4 right-4 z-40",
  onClick = () => null,
}) {
  const [opened, setOpened] = useState(false);

  return (
    <div className={`flex flex-col gap-2 items-end ${position}`}>
      {opened &&
        items.map((item, index) => (
          <FabMenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            disabled={item.disabled}
            color={color}
            onClick={() => {
              if (!item.disabled) {
                setOpened(false);
                return item.onClick();
              }
            }}
          />
        ))}
      <button
        id={id}
        className={`${hidden ? "hidden" : "flex"} flex-row w-fit px-4 py-4 gap-2
        ${opened ? "rounded-full" : "rounded-2xl"} text-base
        ${opened ? openedColor(color) : activeColor(color)}
        shadow-md shadow-light-shadow/30 dark:shadow-dark-shadow/30`}
        onClick={
          hidden
            ? () => {}
            : items.length > 0
              ? () => setOpened(!opened)
              : onClick
        }
        disabled={hidden}
      >
        {
          <div className="size-6">
            {opened ? (
              /* Material icons 'Close' https://fonts.google.com/icons */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            ) : (
              icon
            )}
          </div>
        }
        {label}
      </button>
    </div>
  );
}

Fab.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  label: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape(FabMenuItem.propTypes)),
  hidden: PropTypes.bool,
  color: PropTypes.oneOf(["primary", "secondary", "tertiary"]),
  position: PropTypes.string,
  onClick: PropTypes.func,
};

export default Fab;
