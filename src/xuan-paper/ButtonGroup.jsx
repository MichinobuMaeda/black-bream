import PropTypes from "prop-types";
import Button from "./Button.jsx";

/**
 * A button group component that renders a collection of related buttons with single or multi-selection.
 * Acts as a segmented control or toggle button group where buttons can be selected individually or in groups.
 * Selected buttons appear with "filled" style while others use "tonal" style.
 * @param {object} props - The props object
 * @param {string} props.name - Unique name identifier for the button group (used for DOM IDs)
 * @param {string|Array<string>} [props.value] - Currently selected button value(s). String for single select, Array for multi-select
 * @param {Array<object>} [props.items] - Array of button configuration objects
 * @param {string} props.items[].value - Unique value for the button item
 * @param {string} [props.items[].label] - Text label to display on the button
 * @param {React.ReactNode} [props.items[].icon] - Icon element to display on the button
 * @param {boolean} [props.multiSelect=false] - Whether multiple buttons can be selected simultaneously
 * @param {Function} [props.onChange] - Callback function called when button selection changes
 * @param {boolean} [props.disabled=false] - When true, disables the input field entirely (prevents interaction)
 * @param {('xs'|'sm'|'md')} [props.size='sm'] - Size variant applied to all buttons in the group
 * @returns {JSX.Element} Rendered button group component
 * @example
 * // Basic horizontal button group (single select)
 * <ButtonGroup
 *   name="viewMode"
 *   value={currentView}
 *   items={[
 *     { value: 'grid', label: 'Grid View' },
 *     { value: 'list', label: 'List View' },
 *     { value: 'card', label: 'Card View' }
 *   ]}
 *   onChange={(value) => setCurrentView(value)}
 * />
 * @example
 * // Vertical layout button group
 * <ButtonGroup
 *   name="sidebar"
 *   value={activeSidebar}
 *   layout="vertical"
 *   items={[
 *     { value: 'files', icon: <FilesIcon />, label: 'Files' },
 *     { value: 'search', icon: <SearchIcon />, label: 'Search' },
 *     { value: 'git', icon: <GitIcon />, label: 'Source Control' }
 *   ]}
 *   onChange={setActiveSidebar}
 * />
 * @example
 * // Multi-select horizontal button group
 * <ButtonGroup
 *   name="filters"
 *   value={selectedFilters}
 *   multiSelect={true}
 *   items={[
 *     { value: 'new', label: 'New' },
 *     { value: 'popular', label: 'Popular' },
 *     { value: 'sale', label: 'On Sale' }
 *   ]}
 *   onChange={setSelectedFilters}
 * />
 * @example
 * // Icon-only buttons with custom size
 * <ButtonGroup
 *   name="tools"
 *   value={selectedTool}
 *   size="md"
 *   items={[
 *     { value: 'select', icon: <SelectIcon /> },
 *     { value: 'pen', icon: <PenIcon /> },
 *     { value: 'eraser', icon: <EraserIcon /> }
 *   ]}
 *   onChange={setSelectedTool}
 * />
 */

const ButtonGroup = ({
  name,
  value,
  items,
  multiSelect = false,
  onChange,
  disabled = false,
  size = "sm",
}) => {
  if (multiSelect) {
    if (!Array.isArray(value)) {
      value = value ? [value] : [];
    }
  } else {
    if (typeof value !== "string") {
      value = value ? `${value}` : "";
    }
  }

  return (
    <div id={`button-group-${name}`} className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Button
          id={`${name}-${item.value}`}
          key={item.value}
          icon={item.icon}
          label={item.label}
          style={
            (multiSelect ? value.includes(item.value) : item.value === value)
              ? "filled"
              : "tonal"
          }
          onClick={() => {
            if (multiSelect) {
              if (value.includes(item.value)) {
                value = value.filter((v) => v !== item.value);
              } else {
                value = [...value, item.value];
              }
            } else {
              value = item.value;
            }
            onChange(value);
          }}
          rounded={
            (multiSelect ? value.includes(item.value) : item.value === value)
              ? "rounded-full"
              : "rounded-sm first:rounded-l-full last:rounded-r-full"
          }
          disabled={disabled}
          size={size}
        />
      ))}
    </div>
  );
};

ButtonGroup.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  items: PropTypes.arrayOf(PropTypes.object),
  multiSelect: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["xs", "sm", "md"]),
};

export default ButtonGroup;
