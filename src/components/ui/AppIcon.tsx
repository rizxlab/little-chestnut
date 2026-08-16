import type { HTMLAttributes } from "react";

export type AppIconName =
  | "back"
  | "growth"
  | "home"
  | "profile"
  | "today";

const GLYPHS: Record<AppIconName, string> = {
  back: "‹",
  growth: "⌁",
  home: "⌂",
  profile: "○",
  today: "◉",
};

type AppIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: AppIconName;
};

export function AppIcon({ name, className = "", ...props }: AppIconProps) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;

  return (
    <span
      {...props}
      className={`app-icon${className ? ` ${className}` : ""}`}
      data-icon={name}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
