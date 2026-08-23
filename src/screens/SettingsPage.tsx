import type { Dispatch, SetStateAction } from "react";
import type { Language, Theme } from "../features/settings/types";
import { AppIcon } from "../components/ui/AppIcon";

type SettingsPageProps = {
  language: Language;
  theme: Theme;
  isSignedIn: boolean;
  onClose: () => void;
  setLanguage: Dispatch<SetStateAction<Language>>;
  setTheme: Dispatch<SetStateAction<Theme>>;
};

export function SettingsPage(props: SettingsPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  return (
    <div className="screen settings-screen">
      <section className="settings-page-heading">
        <button className="settings-back" type="button" aria-label={tr("返回我的页面", "Back to profile")} onClick={props.onClose}>
          <AppIcon name="back" />
        </button>
        <span className="overline">SETTINGS</span>
        <h1>{tr("设置", "Settings")}</h1>
      </section>

      <section className="settings-panel">
        <div className="settings-option-copy">
          <span className="settings-option-icon" aria-hidden="true">文</span>
          <div><strong>{tr("界面语言", "Language")}</strong></div>
        </div>
        <div className="settings-segmented" role="group" aria-label={tr("界面语言", "Language")}>
          <button className={props.language === "zh" ? "selected" : ""} type="button" aria-pressed={props.language === "zh"} onClick={() => props.setLanguage("zh")}>简体中文</button>
          <button className={props.language === "en" ? "selected" : ""} type="button" aria-pressed={props.language === "en"} onClick={() => props.setLanguage("en")}>English</button>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-option-copy">
          <span className="settings-option-icon" aria-hidden="true"><AppIcon name="sun" /></span>
          <div><strong>{tr("外观模式", "Appearance")}</strong></div>
        </div>
        <div className="theme-choice-grid" role="group" aria-label={tr("外观模式", "Appearance")}>
          <button className={props.theme === "light" ? "selected" : ""} type="button" aria-pressed={props.theme === "light"} onClick={() => props.setTheme("light")}>
            <AppIcon name="sun" /><strong>{tr("日间", "Light")}</strong><small>{tr("温暖明亮", "Warm and bright")}</small>
          </button>
          <button className={props.theme === "dark" ? "selected" : ""} type="button" aria-pressed={props.theme === "dark"} onClick={() => props.setTheme("dark")}>
            <AppIcon name="moon" /><strong>{tr("夜间", "Dark")}</strong><small>{tr("柔和低亮", "Soft and dim")}</small>
          </button>
        </div>
      </section>

      <div className="settings-sync-note">
        <AppIcon name="check" />
        <p>{props.isSignedIn ? tr("设置会自动保存到当前账号。", "Settings are saved to your account automatically.") : tr("设置与记录会保存在当前设备。", "Settings and records are saved on this device.")}</p>
      </div>
    </div>
  );
}
