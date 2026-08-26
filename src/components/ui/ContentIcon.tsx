import type { HTMLAttributes } from "react";

import { AppIcon, type AppIconName } from "./AppIcon";

const CONTENT_ICON_NAMES: Record<string, AppIconName> = {
  "🌱": "body",
  "🌿": "body",
  "🌳": "body",
  "🌸": "body",
  "🌻": "body",
  "✨": "sparkle",
  "⭐": "sparkle",
  "🔥": "flame",
  "💧": "water",
  "☀️": "sun",
  "🌙": "moon",
  "🌈": "sparkle",
  "🍎": "apple",
  "🍊": "orange",
  "🥗": "salad",
  "🥛": "milk",
  "☕": "tea",
  "🍵": "tea",
  "🥤": "milk",
  "💊": "medicine",
  "🧘": "meditate",
  "💪": "strength",
  "🏃": "run",
  "🚶": "run",
  "🚴": "run",
  "🏊": "water",
  "🤸": "strength",
  "🏋️": "strength",
  "🫁": "body",
  "🫀": "body",
  "🧠": "idea",
  "🛏️": "meditate",
  "🛁": "water",
  "🪥": "body",
  "📖": "wisdom",
  "📚": "wisdom",
  "✏️": "sketch",
  "📝": "sketch",
  "🔤": "word",
  "💡": "idea",
  "🎨": "create",
  "🖌️": "create",
  "📷": "camera",
  "🎬": "camera",
  "🎧": "headphones",
  "🎵": "headphones",
  "🎹": "headphones",
  "🎸": "headphones",
  "💻": "computer",
  "⌨️": "computer",
  "🧹": "broom",
  "🧺": "broom",
  "🪴": "body",
  "🍳": "salad",
  "🏡": "homeContent",
  "🗂️": "work",
  "📅": "calendarContent",
  "⏰": "timer",
  "⏳": "temporary",
  "✅": "check",
  "🎯": "target",
  "💰": "wealth",
  "🪙": "wealth",
  "💼": "work",
  "🤝": "relationships",
  "💬": "chat",
  "📞": "chat",
  "✉️": "chat",
  "🫶": "relationships",
  "😊": "meditate",
  "🙏": "meditate",
  "🧭": "explore",
  "🗺️": "explore",
  "✈️": "travel",
  "🚆": "travel",
  "🌍": "explore",
  "🎁": "gift",
  "🎉": "gift",
  "🧩": "game",
  "🎮": "game",
  "🏆": "trophy",
  "🍰": "treat",
};

const CONTENT_ICON_COLOR_GROUPS: Array<[string, string]> = [
  ["🌱🌿🌳🌸🌻💧🥗🍵🧘💪🏃🚶🚴🏊🤸🏋️🫁🪴", "#5f8065"],
  ["📖📚🔤💻⌨️📅", "#56748a"],
  ["🎨🖌️✏️📝💡📷🎬", "#8a6478"],
  ["🌙🎧🎵🎹🎸🛏️🙏😊", "#78698f"],
  ["☀️🔥🍎🍊🥛☕🥤🍰💰🪙🎁🎉🏆", "#a37845"],
  ["🤝💬📞✉️🫶", "#9b6a62"],
  ["🧭🗺️✈️🚆🌍", "#527d86"],
];

export function contentIconColor(value: string) {
  return CONTENT_ICON_COLOR_GROUPS.find(([icons]) => icons.includes(value))?.[1]
    ?? "#7a4a36";
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
