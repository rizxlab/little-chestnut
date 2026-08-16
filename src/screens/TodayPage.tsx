import type { Dispatch, PointerEvent, SetStateAction } from "react";
import type { Account } from "../features/user/types";
import type { Language } from "../features/settings/types";
import type { GrowthArea, GrowthRecord } from "../features/growth/types";
import type { MicroAction } from "../features/tasks/types";
import { actionTimeOptionFor, actionTimeWindowFor, isActionAvailableNow } from "../features/tasks/domain/task-rules";
import { localDay } from "../features/statistics/domain/date-ranges";
import { greeting } from "../shared/utils/presentation";

type TodayPageProps = {
  active: boolean;
  language: Language;
  locale: string;
  account: Account | null;
  nickname: string;
  todayRecords: GrowthRecord[];
  todayTotals: Array<GrowthArea & { total: number }>;
  milestoneClass: string;
  orbitRippleKey: number;
  setOrbitRippleKey: Dispatch<SetStateAction<number>>;
  areas: GrowthArea[];
  activeAreaFilter: string;
  setAreaFilter: Dispatch<SetStateAction<string>>;
  visibleActions: MicroAction[];
  clockNow: Date;
  lastCheckedAction: { id: string; token: number } | null;
  tagsFor: (value: MicroAction) => GrowthArea[];
  onOpenCalendar: () => void;
  onAddTemporaryAction: () => void;
  onActionClick: (action: MicroAction) => void;
  onOpenActionMenu: (action: MicroAction, rect: DOMRect) => void;
  onStartLongPress: (action: MicroAction, event: PointerEvent<HTMLButtonElement>) => void;
  onMoveLongPress: (event: PointerEvent<HTMLButtonElement>) => void;
  onFinishLongPress: () => void;
};

export function TodayPage(props: TodayPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  const hour = props.clockNow.getHours();
  const isDaytime = hour >= 6 && hour < 18;
  return (
    <div className="screen tab-screen" data-tab="today" aria-hidden={!props.active}>
      <section className="welcome">
        <div className="welcome-meta">
          <button className="date-display" type="button" aria-label={`${tr("打开日历", "Open calendar")}，${new Intl.DateTimeFormat(props.locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(props.clockNow)}`} onClick={props.onOpenCalendar}>
            <strong>{new Intl.DateTimeFormat(props.locale, { day: "2-digit" }).format(props.clockNow)}</strong>
            <span><b>{new Intl.DateTimeFormat(props.locale, { year: "numeric", month: "long" }).format(props.clockNow)}</b><small>{new Intl.DateTimeFormat(props.locale, { weekday: "long" }).format(props.clockNow)}</small></span>
            <i className="date-display-chevron" aria-hidden="true">›</i>
          </button>
          <span className={`day-phase-icon ${isDaytime ? "day" : "night"}`} role="img" aria-label={tr(isDaytime ? "白天" : "夜晚", isDaytime ? "Daytime" : "Night")}>{isDaytime ? "☀️" : "🌙"}</span>
        </div>
        <h1>{greeting(props.language, props.clockNow)}{props.account ? `${props.language === "zh" ? "，" : ", "}${props.nickname.trim() || props.account.username}` : ""}</h1>
      </section>

      <section className={`today-card ${props.milestoneClass}`}>
        <span className="today-milestone-stars" aria-hidden="true"><b /><b /><b /><b /><b /><b /></span>
        <div className="today-card-copy"><span>{tr("今日成长", "TODAY")}</span><strong>{props.todayRecords.length}</strong><small>{tr("次微小行动", "small actions")}</small></div>
        <div className="today-orbit">
          {props.orbitRippleKey > 0 && <span className="orbit-ripple" key={props.orbitRippleKey} aria-hidden="true"><b /><b /><b /></span>}
          <button className="orbit-core" type="button" aria-label={tr("点击栗子，播放涟漪", "Tap the chestnut for a ripple")} onClick={() => props.setOrbitRippleKey((current) => current + 1)}>🌰</button>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        </div>
        <div className="today-domains">
          {props.todayTotals.length ? props.todayTotals.map((area) => <span key={area.id}>{area.icon} {area.name} +{area.total}</span>) : <span className="quiet">{tr("今天的成长从第一颗栗子开始", "Today starts with one small action")}</span>}
        </div>
      </section>

      <section className="content-section today-actions-section">
        <button className="temporary-action-add" type="button" onClick={props.onAddTemporaryAction}><span aria-hidden="true">＋</span><div><strong>{tr("添加临时小事", "Add a temporary action")}</strong><small>{tr("默认保留到今天结束", "Kept until the end of today by default")}</small></div><i aria-hidden="true">⏳</i></button>
        <div className="action-filter-list" role="group" aria-label={tr("按成长领域筛选小事", "Filter actions by growth area")} onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()} onTouchCancel={(event) => event.stopPropagation()}>
          <button className={props.activeAreaFilter === "all" ? "active" : ""} type="button" aria-pressed={props.activeAreaFilter === "all"} onClick={() => props.setAreaFilter("all")}>{tr("全部", "All")}</button>
          {props.areas.map((area) => <button className={props.activeAreaFilter === area.id ? "active" : ""} type="button" key={area.id} aria-pressed={props.activeAreaFilter === area.id} onClick={() => props.setAreaFilter(area.id)}><span aria-hidden="true">{area.icon}</span>{area.name}</button>)}
        </div>
        <div className="quick-grid">
          {props.visibleActions.map((action) => {
            const actionTags = props.tagsFor(action);
            const primaryTag = actionTags[0] || props.areas[0];
            const timeOption = actionTimeOptionFor(action);
            const timeAvailable = isActionAvailableNow(action, props.clockNow);
            const todayCount = props.todayRecords.filter((record) => record.actionId === action.id).length;
            const justChecked = props.lastCheckedAction?.id === action.id;
            return (
              <button className={`quick-action ${todayCount ? "completed" : ""}${timeAvailable ? "" : " time-locked"}`} type="button" key={action.id} aria-label={`${action.repeatable === false ? `${action.name}，今天已记录 ${todayCount} 次，每天限一次` : `记录${action.name}，今天已记录 ${todayCount} 次，可重复记录`}${actionTimeWindowFor(action) === "anytime" ? "" : `，限${timeOption.label}${timeOption.range}`}`} onClick={() => props.onActionClick(action)} onContextMenu={(event) => { event.preventDefault(); props.onOpenActionMenu(action, event.currentTarget.getBoundingClientRect()); }} onPointerDown={(event) => props.onStartLongPress(action, event)} onPointerMove={props.onMoveLongPress} onPointerUp={props.onFinishLongPress} onPointerCancel={props.onFinishLongPress} onPointerLeave={props.onFinishLongPress}>
                <span className="action-icon" style={{ background: `${primaryTag.color}18` }}>{action.icon}</span>
                <strong>{action.name}</strong>
                <span className="action-badge-row" aria-hidden="true">
                  {action.temporary && <span className="action-temporary-badge">⏳ {action.expiresOn === localDay(props.clockNow) ? tr("今天", "Today") : tr(`至 ${action.expiresOn?.slice(5).replace("-", "/")}`, `Until ${action.expiresOn?.slice(5).replace("-", "/")}`)}</span>}
                  {actionTimeWindowFor(action) !== "anytime" && <span className="action-time-badge">{timeOption.icon} {timeOption.label}</span>}
                  {Boolean(action.timerSeconds && action.timerSeconds > 0) && <span className="action-timer-badge">◷ {action.timerSeconds}s</span>}
                </span>
                <span className={`check-control ${todayCount ? "checked" : ""} ${justChecked ? "just-checked" : ""}`} key={justChecked ? `${action.id}-${props.lastCheckedAction?.token}` : `${action.id}-idle`} aria-hidden="true"><i>✓</i>{todayCount > 1 && <small>×{todayCount}</small>}</span>
              </button>
            );
          })}
        </div>
        {!props.visibleActions.length && <div className="action-filter-empty">{tr("这个成长领域还没有关联的小事", "No actions in this growth area yet")}</div>}
      </section>
    </div>
  );
}
