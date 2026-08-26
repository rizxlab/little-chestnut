import type { Dispatch, SetStateAction } from "react";
import type { Language, Theme } from "../features/settings/types";
import { AppIcon } from "../components/ui/AppIcon";

type SettingsPageProps = {
  language: Language;
  theme: Theme;
  isSignedIn: boolean;
  recordCount: number;
  onClose: () => void;
  onResetData: () => void;
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

      <details className="settings-block philosophy">
        <summary>
          <span className="philosophy-title"><AppIcon name="sparkle" /><span><strong>{tr("关于栗子小事", "About Little Chestnut Things")}</strong></span></span>
          <AppIcon className="summary-chevron" name="chevronDown" />
        </summary>
        <div className="philosophy-content">
          <blockquote>{tr("“成长不是由几个重大事件组成，而是由无数微小行动累积而成。”", "“Growth is built not from a few major events, but from countless tiny actions.”")}</blockquote>
          <ul>
            <li><AppIcon name="check" />{tr("记录成长，而不是记录失败", "Record growth, not failure")}</li>
            <li><AppIcon name="check" />{tr("默认展示已经做到的事情", "Show what has been done by default")}</li>
            <li><AppIcon name="check" />{tr("数据服务于回顾，而不是竞争", "Use data for reflection, not competition")}</li>
          </ul>
        </div>
      </details>

      <section className="settings-block data-settings">
        <div><strong>{tr("设备本地数据", "Local device data")}</strong><small>{tr(`当前共有 ${props.recordCount} 条成长记录`, `${props.recordCount} growth records on this device`)}</small></div>
        <button type="button" onClick={props.onResetData}>{tr("清空并重置", "Clear and reset")}</button>
      </section>

      <div className="settings-sync-note">
        <AppIcon name="check" />
        <p>{props.isSignedIn ? tr("设置会自动保存到当前账号。", "Settings are saved to your account automatically.") : tr("设置与记录会保存在当前设备。", "Settings and records are saved on this device.")}</p>
      </div>
    </div>
  );
}
