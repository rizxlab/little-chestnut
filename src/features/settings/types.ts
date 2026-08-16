export type Language = "zh" | "en";
export type Theme = "light" | "dark";

export type AppPreferences = {
  language?: Language;
  theme?: Theme;
  cardMilestoneFirst?: number;
  cardMilestoneSecond?: number;
};
