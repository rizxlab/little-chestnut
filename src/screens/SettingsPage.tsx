import type { Dispatch, SetStateAction } from "react";
import type { Language, Theme } from "../features/settings/types";
import { milestoneThreshold } from "../shared/utils/presentation";
import { AppIcon } from "../components/ui/AppIcon";

type SettingsPageProps = {
  language: Language;
  theme: Theme;
  cardMilestoneFirst: number;
  cardMilestoneSecond: number;
  isSignedIn: boolean;
  onClose: () => void;
  setLanguage: Dispatch<SetStateAction<Language>>;
  setTheme: Dispatch<SetStateAction<Theme>>;
  setCardMilestoneFirst: Dispatch<SetStateAction<number>>;
  setCardMilestoneSecond: Dispatch<SetStateAction<number>>;
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

      <section className="settings-panel milestone-settings-panel">
        <div className="settings-option-copy">
          <span className="settings-option-icon" aria-hidden="true"><AppIcon name="sparkle" /></span>
          <div><strong>{tr("成长卡片效果", "Growth card effects")}</strong></div>
        </div>
        <div className="milestone-preview-grid" aria-label={tr("成长卡片效果预览", "Growth card effect previews")}>
          <article className="milestone-preview-card base"><span>{tr("普通", "Base")}</span><strong>{Math.max(0, props.cardMilestoneFirst - 1)}</strong><small>{tr("次", "times")}</small><em aria-hidden="true">🌰</em></article>
          <article className="milestone-preview-card stage-one"><span>{tr("进阶", "Glow")}</span><strong>{props.cardMilestoneFirst}</strong><small>{tr("次", "times")}</small><em aria-hidden="true">🌰</em></article>
          <article className="milestone-preview-card stage-two"><span>{tr("高级", "Stellar")}</span><strong>{props.cardMilestoneSecond}</strong><small>{tr("次", "times")}</small><em aria-hidden="true">🌰</em></article>
        </div>
        <div className="milestone-threshold-list">
          <div className="milestone-threshold-row">
            <div><strong>{tr("进阶效果", "Glow effect")}</strong><small>{tr(`第 ${props.cardMilestoneFirst} 次开始`, `Starts at ${props.cardMilestoneFirst}`)}</small></div>
            <div role="group" aria-label={tr("调整进阶效果次数", "Adjust glow threshold")}>
              <button type="button" disabled={props.cardMilestoneFirst <= 1} onClick={() => props.setCardMilestoneFirst((current) => Math.max(1, current - 1))}><AppIcon name="minus" /></button>
              <input type="number" inputMode="numeric" min="1" max={props.cardMilestoneSecond - 1} value={props.cardMilestoneFirst} aria-label={tr("进阶效果触发次数", "Glow effect threshold")} onChange={(event) => props.setCardMilestoneFirst(milestoneThreshold(event.target.value, props.cardMilestoneFirst, 1, props.cardMilestoneSecond - 1))} />
              <button type="button" disabled={props.cardMilestoneFirst >= props.cardMilestoneSecond - 1} onClick={() => props.setCardMilestoneFirst((current) => Math.min(props.cardMilestoneSecond - 1, current + 1))}><AppIcon name="add" /></button>
            </div>
          </div>
          <div className="milestone-threshold-row">
            <div><strong>{tr("高级效果", "Stellar effect")}</strong><small>{tr(`第 ${props.cardMilestoneSecond} 次开始`, `Starts at ${props.cardMilestoneSecond}`)}</small></div>
            <div role="group" aria-label={tr("调整高级效果次数", "Adjust stellar threshold")}>
              <button type="button" disabled={props.cardMilestoneSecond <= props.cardMilestoneFirst + 1} onClick={() => props.setCardMilestoneSecond((current) => Math.max(props.cardMilestoneFirst + 1, current - 1))}><AppIcon name="minus" /></button>
              <input type="number" inputMode="numeric" min={props.cardMilestoneFirst + 1} max="99" value={props.cardMilestoneSecond} aria-label={tr("高级效果触发次数", "Stellar effect threshold")} onChange={(event) => props.setCardMilestoneSecond(milestoneThreshold(event.target.value, props.cardMilestoneSecond, props.cardMilestoneFirst + 1, 99))} />
              <button type="button" disabled={props.cardMilestoneSecond >= 99} onClick={() => props.setCardMilestoneSecond((current) => Math.min(99, current + 1))}><AppIcon name="add" /></button>
            </div>
          </div>
        </div>
      </section>

      <div className="settings-sync-note">
        <AppIcon name="check" />
        <p>{props.isSignedIn ? tr("设置会自动保存到当前账号。", "Settings are saved to your account automatically.") : tr("设置与记录会保存在当前设备。", "Settings and records are saved on this device.")}</p>
      </div>
    </div>
  );
}
