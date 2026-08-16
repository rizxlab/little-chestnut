import type { GrowthArea, GrowthRecord } from "../features/growth/types";
import { formatRecordDate, localDay } from "../features/statistics/domain/date-ranges";
import { shellValueFor } from "../features/tasks/domain/task-rules";
import { AppIcon } from "../components/ui/AppIcon";

type CalendarCell = { date: Date; key: string } | null;

type CalendarPageProps = {
  month: Date;
  cells: CalendarCell[];
  recordCounts: Map<string, number>;
  selectedDay: string;
  selectedRecords: GrowthRecord[];
  onClose: () => void;
  onShiftMonth: (offset: number) => void;
  onSelectDay: (day: string) => void;
  tagsFor: (record: GrowthRecord) => GrowthArea[];
};

export function CalendarPage(props: CalendarPageProps) {
  const now = new Date();
  return (
    <div className="screen calendar-screen">
      <section className="calendar-heading">
        <div className="calendar-heading-actions">
          <button className="calendar-back" type="button" aria-label="返回今日页面" onClick={props.onClose}><AppIcon name="back" /></button>
        </div>
        <span className="overline">CALENDAR</span><h1>日历记录</h1><p>回看过去发生的小事，每一次都算成长。</p>
      </section>
      <section className="calendar-card">
        <div className="calendar-toolbar">
          <button type="button" aria-label="上一个月" onClick={() => props.onShiftMonth(-1)}>‹</button>
          <strong>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(props.month)}</strong>
          <button type="button" aria-label="下一个月" disabled={props.month.getFullYear() === now.getFullYear() && props.month.getMonth() === now.getMonth()} onClick={() => props.onShiftMonth(1)}>›</button>
        </div>
        <div className="calendar-weekdays" aria-hidden="true">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {props.cells.map((cell, index) => cell ? (
            <button className={`${cell.key === props.selectedDay ? "selected" : ""} ${cell.key === localDay(now) ? "today" : ""} ${props.recordCounts.has(cell.key) ? "has-records" : ""}`} type="button" key={cell.key} aria-label={`${new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(cell.date)}，${props.recordCounts.get(cell.key) || 0} 条记录`} onClick={() => props.onSelectDay(cell.key)}>
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
              <article key={record.id}><span className="record-icon">{record.icon}</span><div><strong>{record.actionName}</strong><small>{formatRecordDate(record.createdAt)} · {record.source}</small><span className="action-tag-list">
                {props.tagsFor(record).map((tag) => <i key={tag.id} style={{ color: tag.color, borderColor: `${tag.color}35` }}>{tag.name} +{record.value}</i>)}
                <i className="shell-gain-tag"><span aria-hidden="true">🌰</span>栗壳 +{shellValueFor(record)}</i>
              </span></div></article>
            ))}
          </div>
        ) : <div className="empty-state compact"><p>这一天还没有留下记录。</p></div>}
      </section>
    </div>
  );
}
