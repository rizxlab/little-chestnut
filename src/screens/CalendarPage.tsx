import type { Dispatch, SetStateAction } from "react";
import type { GrowthPeriod } from "../app/types";
import type { GrowthRecord } from "../features/growth/types";
import type { Language } from "../features/settings/types";
import { activityDay, formatRecordDate } from "../features/statistics/domain/date-ranges";
import { shellValueFor } from "../features/tasks/domain/task-rules";
import { AppIcon } from "../components/ui/AppIcon";
import { ContentIcon } from "../components/ui/ContentIcon";

type CalendarCell = { date: Date; key: string } | null;
type PeriodOption = { id: GrowthPeriod; label: string; count: number };

type CalendarPageProps = {
  month: Date;
  cells: CalendarCell[];
  recordCounts: Map<string, number>;
  selectedDay: string;
  selectedRecords: GrowthRecord[];
  language: Language;
  records: GrowthRecord[];
  weekRecords: GrowthRecord[];
  monthRecords: GrowthRecord[];
  period: GrowthPeriod;
  periodOptions: PeriodOption[];
  activePeriod: PeriodOption;
  activeRecords: GrowthRecord[];
  setPeriod: Dispatch<SetStateAction<GrowthPeriod>>;
  onClose: () => void;
  onShiftMonth: (offset: number) => void;
  onSelectDay: (day: string) => void;
};

export function CalendarPage(props: CalendarPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  const now = new Date();
  const activeDate = new Date(`${activityDay(now)}T12:00:00`);
  return (
    <div className="screen calendar-screen">
      <section className="calendar-heading">
        <div className="calendar-heading-actions">
          <button className="calendar-back" type="button" aria-label="返回今日页面" onClick={props.onClose}><AppIcon name="back" /></button>
        </div>
        <span className="overline">CALENDAR</span><h1>日历记录</h1><p>回看过去发生的小事，每一次都算成长。</p>
      </section>
      <div className="stat-grid calendar-stat-grid">
        <article><span>{tr("全部记录", "All records")}</span><strong>{props.records.length}</strong><small>{tr("件小事", "moments")}</small></article>
        <article><span>{tr("本周", "This week")}</span><strong>{props.weekRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
        <article><span>{tr("本月", "This month")}</span><strong>{props.monthRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
      </div>
      <section className="calendar-card">
        <div className="calendar-toolbar">
          <button type="button" aria-label="上一个月" onClick={() => props.onShiftMonth(-1)}><AppIcon name="chevronLeft" /></button>
          <strong>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(props.month)}</strong>
          <button type="button" aria-label="下一个月" disabled={props.month.getFullYear() === activeDate.getFullYear() && props.month.getMonth() === activeDate.getMonth()} onClick={() => props.onShiftMonth(1)}><AppIcon name="chevronRight" /></button>
        </div>
        <div className="calendar-weekdays" aria-hidden="true">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {props.cells.map((cell, index) => cell ? (
            <button className={`${cell.key === props.selectedDay ? "selected" : ""} ${cell.key === activityDay(now) ? "today" : ""} ${props.recordCounts.has(cell.key) ? "has-records" : ""}`} type="button" key={cell.key} aria-label={`${new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(cell.date)}，${props.recordCounts.get(cell.key) || 0} 条记录`} onClick={() => props.onSelectDay(cell.key)}>
              <span>{cell.date.getDate()}</span>{props.recordCounts.has(cell.key) && <small>{props.recordCounts.get(cell.key)}</small>}
            </button>
          ) : <span className="calendar-empty" key={`empty-${index}`} />)}
        </div>
      </section>
      <section className="calendar-day-detail">
        <div className="section-title-row"><div><span className="overline">当天记录</span><h2>{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${props.selectedDay}T12:00:00`))}</h2></div><small>{props.selectedRecords.length} 件小事</small></div>
        {props.selectedRecords.length ? (
          <div className="calendar-record-list">
            {props.selectedRecords.map((record) => (
              <article key={record.id}><span className="record-icon"><ContentIcon value={record.icon} /></span><div><strong>{record.actionName}</strong><small>{formatRecordDate(record.createdAt)} · {record.source}</small><span className="action-tag-list">
                <i className="shell-gain-tag"><span aria-hidden="true">🌰</span>栗壳 +{shellValueFor(record)}</i>
              </span></div></article>
            ))}
          </div>
        ) : <div className="empty-state compact"><p>这一天还没有留下记录。</p></div>}
      </section>
      <section className="content-section growth-section calendar-growth-section">
        <div className="growth-period-tabs" role="tablist" aria-label={tr("选择记录周期", "Choose record period")}>
          {props.periodOptions.map((period) => (
            <button className={props.period === period.id ? "active" : ""} type="button" role="tab" aria-selected={props.period === period.id} aria-controls="calendar-growth-period-panel" id={`calendar-growth-period-${period.id}`} key={period.id} onClick={() => props.setPeriod(period.id)}>
              <span>{period.label}</span><small>{period.count}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="content-section timeline-section" id="calendar-growth-period-panel" role="tabpanel" aria-labelledby={`calendar-growth-period-${props.period}`}>
        <div className="growth-progress-heading"><h2>{props.activePeriod.label}{tr("记录", " records")}</h2><small>{props.activePeriod.count} {tr("件小事", "actions")}</small></div>
        <div className="growth-divider" aria-hidden="true" />
        {props.activeRecords.length ? (
          <div className="timeline" key={`calendar-timeline-${props.period}`}>
            {props.activeRecords.slice(0, 24).map((record) => (
              <article key={record.id}><i /><div><small>{formatRecordDate(record.createdAt)}</small><strong><ContentIcon value={record.icon} /> {record.actionName}</strong></div></article>
            ))}
          </div>
        ) : <div className="empty-state compact"><p>{props.period === "total" ? tr("你完成的小事，会从这里慢慢积累。", "Your completed actions will collect here over time.") : tr(`${props.activePeriod.label}还没有留下小事记录。`, `No actions recorded for ${props.activePeriod.label.toLowerCase()} yet.`)}</p></div>}
      </section>
    </div>
  );
}
