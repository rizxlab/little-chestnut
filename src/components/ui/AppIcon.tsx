import type { CSSProperties, HTMLAttributes } from "react";

const ICON_PATHS = {
  add: "/icons/actions/add.svg",
  apple: "/icons/content/apple.svg",
  back: "/icons/navigation/back.svg",
  body: "/icons/content/body.svg",
  broom: "/icons/content/broom.svg",
  calendar: "/icons/navigation/today.svg",
  calendarContent: "/icons/content/calendar.svg",
  camera: "/icons/content/camera.svg",
  chat: "/icons/content/chat.svg",
  check: "/icons/status/check.svg",
  chevronDown: "/icons/navigation/chevron-down.svg",
  chevronLeft: "/icons/navigation/chevron-left.svg",
  chevronRight: "/icons/navigation/chevron-right.svg",
  close: "/icons/actions/close.svg",
  computer: "/icons/content/computer.svg",
  create: "/icons/content/create.svg",
  delete: "/icons/actions/delete.svg",
  edit: "/icons/actions/edit.svg",
  explore: "/icons/content/explore.svg",
  flame: "/icons/content/flame.svg",
  game: "/icons/content/game.svg",
  gift: "/icons/content/gift.svg",
  growth: "/icons/navigation/growth.svg",
  headphones: "/icons/content/headphones.svg",
  home: "/icons/navigation/home.svg",
  homeContent: "/icons/content/home.svg",
  idea: "/icons/content/idea.svg",
  meditate: "/icons/content/meditate.svg",
  medicine: "/icons/content/medicine.svg",
  milk: "/icons/content/milk.svg",
  minus: "/icons/actions/minus.svg",
  moon: "/icons/features/moon.svg",
  orange: "/icons/content/orange.svg",
  profile: "/icons/navigation/profile.svg",
  relationships: "/icons/content/relationships.svg",
  run: "/icons/content/run.svg",
  salad: "/icons/content/salad.svg",
  settings: "/icons/features/settings.svg",
  repeat: "/icons/actions/undo.svg",
  sparkle: "/icons/features/sparkle.svg",
  sun: "/icons/features/sun.svg",
  target: "/icons/content/target.svg",
  temporary: "/icons/features/temporary.svg",
  strength: "/icons/content/strength.svg",
  sketch: "/icons/content/sketch.svg",
  tea: "/icons/content/tea.svg",
  timer: "/icons/features/timer.svg",
  today: "/icons/navigation/today.svg",
  treat: "/icons/content/treat.svg",
  travel: "/icons/content/travel.svg",
  trophy: "/icons/content/trophy.svg",
  undo: "/icons/actions/undo.svg",
  water: "/icons/content/water.svg",
  wealth: "/icons/content/wealth.svg",
  wisdom: "/icons/content/wisdom.svg",
  work: "/icons/content/work.svg",
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
