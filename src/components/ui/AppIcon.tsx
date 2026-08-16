import type { CSSProperties, HTMLAttributes } from "react";

const ICON_PATHS = {
  add: "/icons/actions/add.svg",
  back: "/icons/navigation/back.svg",
  check: "/icons/status/check.svg",
  chevronDown: "/icons/navigation/chevron-down.svg",
  chevronLeft: "/icons/navigation/chevron-left.svg",
  chevronRight: "/icons/navigation/chevron-right.svg",
  close: "/icons/actions/close.svg",
  delete: "/icons/actions/delete.svg",
  edit: "/icons/actions/edit.svg",
  growth: "/icons/navigation/growth.svg",
  home: "/icons/navigation/home.svg",
  minus: "/icons/actions/minus.svg",
  moon: "/icons/features/moon.svg",
  profile: "/icons/navigation/profile.svg",
  settings: "/icons/features/settings.svg",
  sparkle: "/icons/features/sparkle.svg",
  sun: "/icons/features/sun.svg",
  temporary: "/icons/features/temporary.svg",
  timer: "/icons/features/timer.svg",
  today: "/icons/navigation/today.svg",
  undo: "/icons/actions/undo.svg",
} as const;

export type AppIconName = keyof typeof ICON_PATHS;

type AppIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: AppIconName;
};

export function AppIcon({ name, className = "", style, ...props }: AppIconProps) {
  const source = ICON_PATHS[name];
  if (!source) return null;

  const iconStyle = {
    ...style,
    "--app-icon-source": `url("${source}")`,
  } as CSSProperties;

  return (
    <span
      {...props}
      className={`app-icon${className ? ` ${className}` : ""}`}
      data-icon={name}
      aria-hidden="true"
      style={iconStyle}
    >
      <i />
    </span>
  );
}
