import type { Dispatch, PointerEvent, SetStateAction } from "react";
import type { Language } from "../features/settings/types";
import type { GrowthRecord } from "../features/growth/types";
import type { MicroAction } from "../features/tasks/types";
import { actionTimeOptionFor, actionTimeWindowFor } from "../features/tasks/domain/task-rules";
import { activityDay } from "../features/statistics/domain/date-ranges";
import { AppIcon } from "../components/ui/AppIcon";
import { ContentIcon, contentIconColor } from "../components/ui/ContentIcon";

type TodayPageProps = {
  active: boolean;
  language: Language;
  todayRecords: GrowthRecord[];
  orbitRippleKey: number;
  setOrbitRippleKey: Dispatch<SetStateAction<number>>;
  visibleActions: MicroAction[];
  clockNow: Date;
  lastCheckedAction: { id: string; token: number } | null;
  onAddTemporaryAction: () => void;
  onActionClick: (action: MicroAction) => void;
  onOpenActionMenu: (action: MicroAction, rect: DOMRect) => void;
  onStartLongPress: (action: MicroAction, event: PointerEvent<HTMLButtonElement>) => void;
  onMoveLongPress: (event: PointerEvent<HTMLButtonElement>) => void;
  onFinishLongPress: () => void;
};

export function TodayPage(props: TodayPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  return (
    <div className="screen tab-screen" data-tab="today" aria-hidden={!props.active}>
      <section className="today-card">
        <div className="today-card-copy"><span>{tr("今日成长", "TODAY")}</span><strong>{props.todayRecords.length}</strong></div>
        <div className="today-orbit">
          {props.orbitRippleKey > 0 && <span className="orbit-ripple" key={props.orbitRippleKey} aria-hidden="true"><b /><b /><b /></span>}
          <button className="orbit-core" type="button" aria-label={tr("点击栗子，播放涟漪", "Tap the chestnut for a ripple")} onClick={() => props.setOrbitRippleKey((current) => current + 1)}>🌰</button>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        </div>
      </section>

      <section className="content-section today-actions-section">
        <button className="temporary-action-add" type="button" aria-label={tr("添加临时小事", "Add temporary action")} onClick={props.onAddTemporaryAction}><AppIcon name="add" /></button>
        <div className="quick-grid">
          {props.visibleActions.map((action) => {
            const iconColor = contentIconColor(action.icon);
            const timeOption = actionTimeOptionFor(action);
            const todayCount = props.todayRecords.filter((record) => record.actionId === action.id).length;
            const justChecked = props.lastCheckedAction?.id === action.id;
            return (
              <button className={`quick-action ${todayCount ? "completed" : ""}`} type="button" key={action.id} aria-label={`${action.repeatable === false ? `${action.name}，今天已记录 ${todayCount} 次，每天限一次` : `记录${action.name}，今天已记录 ${todayCount} 次，可重复记录`}${actionTimeWindowFor(action) === "anytime" ? "" : `，${timeOption.label}提醒分类`}`} onClick={() => props.onActionClick(action)} onContextMenu={(event) => { event.preventDefault(); props.onOpenActionMenu(action, event.currentTarget.getBoundingClientRect()); }} onPointerDown={(event) => props.onStartLongPress(action, event)} onPointerMove={props.onMoveLongPress} onPointerUp={props.onFinishLongPress} onPointerCancel={props.onFinishLongPress} onPointerLeave={props.onFinishLongPress}>
                <span className="action-icon" style={{ color: iconColor, background: `${iconColor}18` }}><ContentIcon value={action.icon} /></span>
                <strong>{action.name}</strong>
                <span className="action-badge-row" aria-hidden="true">
                  {action.repeatable !== false && <span className="action-repeatable-badge"><AppIcon name="repeat" /></span>}
                  {action.temporary && <span className="action-temporary-badge"><AppIcon name="temporary" /> {action.expiresOn === activityDay(props.clockNow) ? tr("今天", "Today") : tr(`至 ${action.expiresOn?.slice(5).replace("-", "/")}`, `Until ${action.expiresOn?.slice(5).replace("-", "/")}`)}</span>}
                  {actionTimeWindowFor(action) !== "anytime" && <span className="action-time-badge"><ContentIcon value={timeOption.icon} /> {timeOption.label}</span>}
                  {Boolean(action.timerSeconds && action.timerSeconds > 0) && <span className="action-timer-badge"><AppIcon name="timer" /> {action.timerSeconds}s</span>}
                </span>
                <span className={`check-control ${todayCount ? "checked" : ""} ${justChecked ? "just-checked" : ""}`} key={justChecked ? `${action.id}-${props.lastCheckedAction?.token}` : `${action.id}-idle`} aria-hidden="true"><AppIcon className="check-mark" name="check" />{todayCount > 1 && <small>×{todayCount}</small>}</span>
              </button>
            );
          })}
        </div>
        {!props.visibleActions.length && <div className="action-filter-empty">{tr("还没有小事，先添加一件吧", "No actions yet. Add one to begin.")}</div>}
      </section>
    </div>
  );
}
