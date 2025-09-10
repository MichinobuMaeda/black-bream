import PropTypes from "prop-types";

/**
 * A versatile text input field component with floating labels,
 * validation states, and customizable styling.
 * Supports different input types, prefix/suffix elements, error handling,
 * and both filled and outlined styles.
 * Features automatic label animation and theme-aware design.
 * @param {object} props - The props object
 * @param {string} [props.id] - Unique identifier for the input element
 * @param {('text'|'email'|'password'|'number')} [props.type='text'] - HTML input type
 * @param {string|number} [props.value] - Current value of the input field
 * @param {string} [props.label] - Floating label text that appears above the input when focused or filled
 * @param {string} [props.message] - Helper text displayed below the input field
 * @param {string} [props.error] - Error message that overrides the helper text and applies error styling
 * @param {React.ReactNode} [props.prefix] - Element to display at the start of the input. Typically uses Button component with style="embedded" for interactive elements
 * @param {React.ReactNode} [props.suffix] - Element to display at the end of the input. Typically uses Button component with style="embedded" for interactive elements
 * @param {string} [props.style] - Visual style variant, use "filled" for filled background style
 * @param {string} [props.width='w-48'] - Tailwind CSS width class for the input field
 * @param {string} [props.fontFamily='font-sans'] - Tailwind CSS font family class
 * @param {Function} [props.onChange] - Callback function called when input value changes
 * @param {boolean} [readonly] - When true, makes the input read-only (allows selection but prevents editing)
 * @param {boolean} [props.disabled=false] - When true, disables the input field entirely (prevents interaction)
 * @returns {JSX.Element} Rendered text field component
 * @example
 * // Basic text input with floating label
 * <TextField
 *   id="username"
 *   label="Username"
 *   value={username}
 *   onChange={(value) => setUsername(value)}
 * />
 * @example
 * // Email input with validation and helper text
 * <TextField
 *   id="email"
 *   type="email"
 *   label="Email Address"
 *   value={email}
 *   message="We'll never share your email"
 *   error={emailError}
 *   onChange={setEmail}
 * />
 * @example
 * // Password field with embedded button prefix
 * <TextField
 *   id="password"
 *   type="password"
 *   label="Password"
 *   value={password}
 *   prefix={<Button icon={<LockIcon />} style="embedded" />}
 *   width="w-80"
 *   onChange={setPassword}
 * />
 * @example
 * // Filled style input with embedded button suffix
 * <TextField
 *   id="search"
 *   label="Search products"
 *   value={searchQuery}
 *   style="filled"
 *   suffix={<Button icon={<SearchIcon />} style="embedded" onClick={handleSearch} />}
 *   width="w-96"
 *   onChange={setSearchQuery}
 * />
 * />
 */

const TextField = ({
  id,
  type = "text",
  value,
  label,
  message,
  error,
  prefix,
  suffix,
  style,
  width = "w-48",
  fontFamily = "font-sans",
  onChange,
  readonly = false,
  disabled = false,
}) => {
  const isValue = () => value || value === 0;
  const isFilled = () => style === "filled";

  return (
    <div className={`flex flex-col h-[76px] ${width}`}>
      <div
        className={`flex flex-row px-2 items-center
${isFilled() ? "h-14 rounded-t-sm " : "h-12 mt-2 rounded-sm"}
${
  isFilled()
    ? readonly
      ? `border-b-1
        outline-light-outline-variant dark:outline-dark-outline-variant`
      : `border-b-1 focus-within:border-b-2
      ${
        error
          ? "border-light-error dark:border-dark-error"
          : `border-light-on-surface-variant dark:border-dark-on-surface-variant
          focus-within:border-light-primary dark:focus-within:border-dark-primary`
      }`
    : readonly
      ? `outline-1
        outline-light-outline-variant dark:outline-dark-outline-variant`
      : `outline-1 focus-within:outline-2
      ${
        error
          ? "outline-light-error dark:outline-dark-error"
          : `outline-light-outline-variant dark:outline-dark-outline-variant
          focus-within:outline-light-primary dark:focus-within:outline-dark-primary`
      }`
}
${
  isFilled()
    ? disabled
      ? "bg-light-on-surface/10 dark:bg-dark-on-surface/10"
      : "bg-light-surface-container-highest dark:bg-dark-surface-container-highest"
    : "bg-light-surface-container-lowest dark:bg-dark-surface-container-lowest"
}
${
  disabled
    ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
    : error
      ? "text-light-error dark:text-dark-error"
      : "text-light-on-surface-variant dark:text-dark-on-surface-variant"
}`}
      >
        {prefix && (
          <div
            className={`flex size-8
              ${
                disabled
                  ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
                  : "text-light-on-surface-variant dark:text-dark-on-surface-variant"
              }`}
          >
            {prefix}
          </div>
        )}
        <div className="flex flex-col-reverse relative w-full">
          <input
            id={id}
            className={`peer h-6 w-full px-2 outline-0
              ${
                disabled
                  ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
                  : "text-light-on-surface dark:text-dark-on-surface"
              }
              ${isValue() ? " " : " absolute focus:static "}
              ${fontFamily}`}
            type={type}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            readOnly={readonly}
            disabled={disabled}
          />
          <div
            className={`${isValue() ? "hidden" : "peer-focus:hidden"} select-none px-2`}
          >
            {label}
          </div>
          <div
            className={`${isValue() ? "flex" : "hidden peer-focus:flex"} ${
              disabled
                ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
                : readonly
                  ? "text-light-on-surface dark:text-dark-on-surface"
                  : error
                    ? "text-light-error dark:text-dark-error"
                    : "text-light-primary dark:text-dark-primary"
            } select-none text-xs bottom-7 ${
              isFilled()
                ? "px-2"
                : `px-1 absolute
                bg-light-surface-container-lowest dark:bg-dark-surface-container-lowest
                ${prefix ? "-left-7" : "left-1"}`
            }`}
          >
            {label}
          </div>
        </div>
        {suffix && (
          <div
            className={`flex size-8
          ${
            disabled
              ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
              : error
                ? "text-light-error dark:text-dark-error"
                : "text-light-on-surface-variant dark:text-dark-on-surface-variant"
          }`}
          >
            {suffix}
          </div>
        )}
      </div>
      <div
        className={`text-xs px-4 pt-1 h-2 text-nowrap ${
          disabled
            ? "text-light-on-surface/40 dark:text-dark-on-surface/40"
            : error
              ? "text-light-error dark:text-dark-error"
              : ""
        }`}
      >
        {error ? error : message}
      </div>
    </div>
  );
};

TextField.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf([
    "text",
    "date",
    "month",
    "time",
    "datetime-local",
    "email",
    "tel",
    "url",
    "password",
    "number",
  ]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  style: PropTypes.string,
  width: PropTypes.string.isRequired,
  fontFamily: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  readonly: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default TextField;
