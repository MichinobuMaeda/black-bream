import { useState } from "react";
import PropTypes from "prop-types";
import TextField from "./TextField";
import Button from "./Button";

/**
 * A specialized password input field with visibility toggle functionality.
 * Built on top of TextField component with an integrated eye icon button
 * that allows users to toggle between hidden and visible password display.
 * Features monospace font by default for better password character recognition.
 * @param {object} props - The props object
 * @param {string} [props.id] - Unique identifier for the password input element
 * @param {string} [props.value=''] - Current value of the password field
 * @param {string} [props.label] - Floating label text that appears above the input when focused or filled
 * @param {string} [props.message] - Helper text displayed below the input field
 * @param {string} [props.error] - Error message that overrides helper text and applies error styling
 * @param {string} [props.style] - Visual style variant, use "filled" for filled background style
 * @param {string} [props.width='w-48'] - Tailwind CSS width class for the input field
 * @param {string} [props.fontFamily='font-mono'] - Tailwind CSS font family class (monospace by default for passwords)
 * @param {Function} [props.onChange] - Callback function called when password value changes
 * @returns {JSX.Element} Rendered password field component with visibility toggle
 * @example
 * // Basic password field
 * <PasswordField
 *   label="Password"
 *   value={password}
 *   onChange={(value) => setPassword(value)}
 * />
 * @example
 * // Password field with validation and custom width
 * <PasswordField
 *   id="user-password"
 *   label="Enter Password"
 *   value={password}
 *   error={passwordError}
 *   message="Must be at least 8 characters"
 *   width="w-80"
 *   onChange={setPassword}
 * />
 * @example
 * // Filled style password field
 * <PasswordField
 *   label="Confirm Password"
 *   value={confirmPassword}
 *   style="filled"
 *   fontFamily="font-sans"
 *   onChange={setConfirmPassword}
 * />
 * @example
 * // Password field in registration form
 * <PasswordField
 *   id="new-password"
 *   label="Create Password"
 *   value={newPassword}
 *   error={validationError}
 *   width="w-full"
 *   onChange={handlePasswordChange}
 * />
 */

const PasswordField = ({
  id,
  value = "",
  label,
  message,
  error,
  style,
  width = "w-48",
  fontFamily = "font-mono",
  onChange,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      id={id}
      type={visible ? "text" : "password"}
      value={value}
      label={label}
      message={message}
      error={error}
      suffix={
        <Button
          icon={
            visible ? (
              /* Material icons 'Visibility on' https://fonts.google.com/icons */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
              >
                <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
              </svg>
            ) : (
              /* Material icons 'Visibility off' https://fonts.google.com/icons */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
              >
                <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
              </svg>
            )
          }
          style="embedded"
          onClick={() => setVisible(!visible)}
        />
      }
      style={style}
      width={width}
      fontFamily={fontFamily}
      onChange={onChange}
    />
  );
};

PasswordField.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.string,
  style: PropTypes.string,
  width: PropTypes.string.isRequired,
  fontFamily: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};

export default PasswordField;
