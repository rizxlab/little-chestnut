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

const CONTENT_ICON_COLORS: Record<string, string> = {
  "🌱": "#5f8065",
  "💧": "#5f8065",
  "💪": "#5f8065",
  "🍵": "#5f8065",
  "📖": "#56748a",
  "🔤": "#56748a",
  "🎨": "#8a6478",
  "✏️": "#8a6478",
  "💡": "#8a6478",
  "🌙": "#78698f",
  "☀️": "#a37845",
  "🎧": "#78698f",
  "💰": "#a37845",
  "🍰": "#a37845",
  "🤝": "#9b6a62",
  "🧭": "#527d86",
};

export function contentIconColor(value: string) {
  return CONTENT_ICON_COLORS[value] ?? "#7a4a36";
}

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
