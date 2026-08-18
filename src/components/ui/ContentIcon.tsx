import type { HTMLAttributes } from "react";

import { AppIcon, type AppIconName } from "./AppIcon";

const CONTENT_ICON_NAMES: Record<string, AppIconName> = {
  "🌱": "body",
  "📖": "wisdom",
  "🎨": "create",
  "🌙": "moon",
  "☀️": "sun",
  "💰": "wealth",
  "🤝": "relationships",
  "🧭": "explore",
  "💧": "water",
  "💪": "strength",
  "🔤": "word",
  "✏️": "sketch",
  "💡": "idea",
  "🍵": "tea",
  "🎧": "headphones",
  "🍰": "treat",
};

type ContentIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: string;
};

export function ContentIcon({ value, className = "", ...props }: ContentIconProps) {
  const name = CONTENT_ICON_NAMES[value];

  if (name) {
    return <AppIcon {...props} className={`content-icon${className ? ` ${className}` : ""}`} name={name} />;
  }

  return (
    <span {...props} className={`content-icon content-icon-fallback${className ? ` ${className}` : ""}`} aria-hidden="true">
      {value}
    </span>
  );
}
