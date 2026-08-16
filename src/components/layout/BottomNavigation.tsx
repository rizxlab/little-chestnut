import { NAV_ITEMS } from "../../app/constants";
import type { Tab } from "../../app/types";
import type { Language } from "../../features/settings/types";
import { AppIcon } from "../ui/AppIcon";

type BottomNavigationProps = {
  activeTab: Tab;
  language: Language;
  onChange: (tab: Tab) => void;
};

export function BottomNavigation({
  activeTab,
  language,
  onChange,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label={language === "zh" ? "主要导航" : "Main navigation"}>
      {NAV_ITEMS.map((item) => (
        <button
          className={`${activeTab === item.id ? "active" : ""} ${
            item.id === "today" ? "primary-tab" : ""
          }`}
          type="button"
          key={item.id}
          onClick={() => onChange(item.id)}
          aria-current={activeTab === item.id ? "page" : undefined}
        >
          <AppIcon name={item.icon} />
          {language === "zh"
            ? item.label
            : item.id === "today"
              ? "Today"
              : item.id === "growth"
                ? "Growth"
                : "Me"}
        </button>
      ))}
    </nav>
  );
}
