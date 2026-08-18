import { AppIcon } from "./AppIcon";
import { ContentIcon } from "./ContentIcon";

type IconPickerProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (icon: string) => void;
};

export function IconPicker({ label, value, options, onChange }: IconPickerProps) {
  const visibleOptions = options.includes(value) ? options : [value, ...options];
  return (
    <fieldset className="icon-picker">
      <legend>{label}</legend>
      <div>
        {visibleOptions.map((icon) => (
          <button
            className={value === icon ? "selected" : ""}
            type="button"
            key={icon}
            aria-label={`选择图标 ${icon}`}
            aria-pressed={value === icon}
            onClick={() => onChange(icon)}
          >
            <ContentIcon value={icon} />
            {value === icon && <AppIcon name="check" />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
