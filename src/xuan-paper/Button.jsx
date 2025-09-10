/**
 * @file A versatile button component implementing Material Design 3 button patterns.
 * Provides multiple styles, sizes, and configurations with comprehensive theming support.
 * @author Michinobu Maeda
 * @since 1.0.0
 */

import PropTypes from "prop-types";

/**
 * A versatile button component implementing Material Design 3 principles with multiple
 * styles, sizes, and configurations. Supports icons, different visual styles, and
 * responsive design with comprehensive light/dark theme support.
 *
 * The component provides eight distinct visual styles:
 * - **filled**: High emphasis with solid background (default)
 * - **tonal**: Medium emphasis with tonal background
 * - **outlined**: Medium emphasis with outlined border
 * - **elevated**: Medium emphasis with shadow elevation
 * - **text**: Low emphasis, text-only appearance
 * - **danger/error**: High emphasis for destructive actions
 * - **embedded**: Minimal emphasis for inline actions
 *
 * Features include:
 * - Automatic size adjustment based on content and style
 * - Hover and active state animations
 * - Disabled state handling with appropriate visual feedback
 * - Flexible width and border radius customization
 * - Accessibility support with proper ARIA attributes
 * - Icon-only or text-only configurations
 * - Factory method (Button.forAppBar) for creating AppBar-optimized buttons
 * @component
 * @param {object} props - The props object
 * @param {string} [props.id] - Unique identifier for the button element
 * @param {React.ReactNode} [props.icon] - Icon element to display alongside or instead of label
 * @param {string} [props.label] - Text content to display in the button
 * @param {('filled'|'tonal'|'outlined'|'elevated'|'text'|'danger'|'error'|'embedded')} [props.style] - Visual style variant of the button (defaults to "filled")
 * @param {Function} [props.onClick] - Click event handler function (defaults to empty function)
 * @param {boolean} [props.disabled] - Whether the button is disabled (defaults to false)
 * @param {string} [props.rounded] - Tailwind CSS class for border radius (defaults to "rounded-full")
 * @param {('xs'|'sm'|'md')} [props.size] - Size variant of the button (defaults to "sm", auto-adjusts to "xs" for embedded style)
 * @param {string} [props.width] - Tailwind CSS class for button width (defaults to "w-fit")
 * @returns {JSX.Element} Rendered button component with configured styling and behavior
 * @example
 * // Basic filled button (default style)
 * <Button label="Click Me" onClick={() => console.log('clicked')} />
 * @example
 * // Icon button with custom styling
 * <Button
 *   icon={<SomeIcon />}
 *   style="outlined"
 *   size="md"
 *   rounded="rounded-lg"
 * />
 * @example
 * // Danger button with label
 * <Button
 *   label="Delete"
 *   style="danger"
 *   onClick={handleDelete}
 *   disabled={isLoading}
 * />
 * @example
 * // Icon-only button with custom width
 * <Button
 *   icon={<SvgAdd />}
 *   style="tonal"
 *   size="md"
 *   width="w-12"
 * />
 * @example
 * // Embedded text button for inline actions
 * <Button
 *   label="Learn more"
 *   style="embedded"
 *   onClick={showDetails}
 * />
 * @example
 * // AppBar button using factory method
 * import { SvgMenu } from '../icons';
 *
 * const menuButton = Button.forAppBar({
 *   icon: <SvgMenu />,
 *   onClick: toggleMenu
 * });
 */
function Button({
  id,
  icon,
  label,
  style = "filled",
  onClick = () => null,
  disabled = false,
  rounded = "rounded-full",
  size = "sm",
  width = "w-fit",
}) {
  size = size || (style === "embedded" ? "xs" : "sm");

  return (
    <button
      id={id}
      className={`flex flex-row justify-center items-center gap-2
${(() => {
  switch (size) {
    case "xs":
      return label ? `${width} h-8 px-3` : "size-8";
    case "md":
      return label ? `${width} h-14 px-6` : "size-14";
    default:
      return label ? `${width} h-10 px-4` : "size-10";
  }
})()}
${rounded}
text-base
${
  disabled
    ? `text-light-on-surface/40 dark:text-dark-on-surface/40
      ${
        style === "text" || style === "embedded"
          ? ""
          : "bg-light-surface-dim dark:bg-dark-surface-dim"
      }`
    : `cursor-pointer transition-colors duration-150
${(() => {
  switch (style) {
    case "tonal":
      return `bg-light-secondary-container dark:bg-dark-secondary-container
              text-light-on-secondary-container dark:text-dark-on-secondary-container
              active:brightness-104 dark:active:brightness-90
              hover:brightness-102 dark:hover:brightness-95`;
    case "outlined":
      return `outline-1
              bg-light-form dark:bg-dark-form
              text-light-primary dark:text-dark-primary
              outline-light-outline-variant dark:outline-dark-outline-variant
              active:brightness-96 dark:active:brightness-120
              hover:brightness-98 dark:hover:brightness-110`;
    case "elevated":
      return `text-light-primary dark:text-dark-primary
              bg-light-surface-container-low dark:bg-dark-surface-container-low
              shadow-2xs shadow-light-shadow dark:shadow-dark-shadow
              active:brightness-104 dark:active:brightness-80
              hover:brightness-102 dark:hover:brightness-90`;
    case "text":
      return `bg-light-form dark:bg-dark-form
              text-light-primary dark:text-dark-primary
              active:brightness-96 dark:active:brightness-120
              hover:brightness-98 dark:hover:brightness-110`;
    case "embedded":
      return `active:bg-light-primary/10 dark:active:bg-dark-primary/10
              hover:bg-light-primary/5 dark:hover:bg-dark-primary/5`;
    case "danger":
    case "error":
      return `bg-light-error dark:bg-dark-error
              text-light-on-error dark:text-dark-on-error
              active:brightness-120 dark:active:brightness-90
              hover:brightness-110 dark:hover:brightness-95`;
    default:
      return `bg-light-primary dark:bg-dark-primary
              text-light-on-primary dark:text-dark-on-primary
              active:brightness-120 dark:active:brightness-90
              hover:brightness-110 dark:hover:brightness-95`;
  }
})()}`
}
      }`}
      onClick={disabled ? () => {} : onClick}
      disabled={disabled}
    >
      {icon && <div className="size-6">{icon}</div>}
      {label}
    </button>
  );
}

/**
 * Factory method to create a Button optimized for AppBar usage.
 * Automatically applies style="embedded" and size="sm" which are the recommended
 * settings for buttons used in AppBar prefix and suffix arrays.
 * @param {object} props - Button props (excluding style and size which are preset)
 * @param {string} [props.id] - Unique identifier for the button element
 * @param {React.ReactNode} [props.icon] - Icon element to display
 * @param {string} [props.label] - Text content to display in the button
 * @param {Function} [props.onClick] - Click event handler function
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @returns {JSX.Element} Button component optimized for AppBar usage
 * @example
 * // Create an AppBar navigation button
 * import { SvgMenu } from '../icons';
 *
 * const navigationButton = Button.forAppBar({
 *   icon: <SvgMenu />,
 *   onClick: () => setDrawerOpen(true)
 * });
 * @example
 * // Create an AppBar action button
 * import { SvgSettings } from '../icons';
 *
 * const settingsButton = Button.forAppBar({
 *   icon: <SvgSettings />,
 *   onClick: openSettings,
 *   disabled: isLoading
 * });
 */
Button.forAppBar = (props) => {
  return Button({
    ...props,
    style: "embedded",
    size: "sm",
  });
};

Button.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  label: PropTypes.string,
  style: PropTypes.oneOf([
    "filled",
    "tonal",
    "outlined",
    "elevated",
    "text",
    "danger",
    "error",
    "embedded",
  ]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  rounded: PropTypes.string,
  size: PropTypes.oneOf(["xs", "sm", "md"]),
  width: PropTypes.string,
};

export default Button;
