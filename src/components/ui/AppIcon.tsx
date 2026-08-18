import type { CSSProperties, HTMLAttributes } from "react";

const ICON_PATHS = {
  add: "/icons/actions/add.svg",
  back: "/icons/navigation/back.svg",
  body: "/icons/content/body.svg",
  check: "/icons/status/check.svg",
  chevronDown: "/icons/navigation/chevron-down.svg",
  chevronLeft: "/icons/navigation/chevron-left.svg",
  chevronRight: "/icons/navigation/chevron-right.svg",
  close: "/icons/actions/close.svg",
  create: "/icons/content/create.svg",
  delete: "/icons/actions/delete.svg",
  edit: "/icons/actions/edit.svg",
  growth: "/icons/navigation/growth.svg",
  headphones: "/icons/content/headphones.svg",
  home: "/icons/navigation/home.svg",
  minus: "/icons/actions/minus.svg",
  moon: "/icons/features/moon.svg",
  idea: "/icons/content/idea.svg",
  explore: "/icons/content/explore.svg",
  profile: "/icons/navigation/profile.svg",
  settings: "/icons/features/settings.svg",
  relationships: "/icons/content/relationships.svg",
  sparkle: "/icons/features/sparkle.svg",
  sun: "/icons/features/sun.svg",
  temporary: "/icons/features/temporary.svg",
  strength: "/icons/content/strength.svg",
  sketch: "/icons/content/sketch.svg",
  tea: "/icons/content/tea.svg",
  timer: "/icons/features/timer.svg",
  today: "/icons/navigation/today.svg",
  treat: "/icons/content/treat.svg",
  undo: "/icons/actions/undo.svg",
  water: "/icons/content/water.svg",
  wealth: "/icons/content/wealth.svg",
  wisdom: "/icons/content/wisdom.svg",
  word: "/icons/content/word.svg",
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
