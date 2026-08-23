import type { Dispatch, SetStateAction } from "react";
import type { GrowthPeriod } from "../app/types";
import type { GrowthRecord } from "../features/growth/types";
import type { Language } from "../features/settings/types";
import { formatRecordDate } from "../features/statistics/domain/date-ranges";
import { AppIcon } from "../components/ui/AppIcon";
import { ContentIcon } from "../components/ui/ContentIcon";

type PeriodOption = {
  id: GrowthPeriod;
  label: string;
  count: number;
};

type GrowthPageProps = {
  active: boolean;
  language: Language;
  locale: string;
  now: Date;
  records: GrowthRecord[];
  weekRecords: GrowthRecord[];
  monthRecords: GrowthRecord[];
  period: GrowthPeriod;
  periodOptions: PeriodOption[];
  activePeriod: PeriodOption;
  activeRecords: GrowthRecord[];
  setPeriod: Dispatch<SetStateAction<GrowthPeriod>>;
  onOpenCalendar: () => void;
};

export function GrowthPage(props: GrowthPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  return (
    <div className="screen tab-screen" data-tab="growth" aria-hidden={!props.active}>
      <section className="page-heading growth-page-heading">
        <button className="calendar-entry-button" type="button" aria-label={`${tr("打开日历", "Open calendar")}，${new Intl.DateTimeFormat(props.locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(props.now)}`} onClick={props.onOpenCalendar}><AppIcon name="calendar" /></button>
        <span className="overline">GROWTH JOURNAL</span><h1>{tr("小事记录", "Small moments")}</h1>
      </section>

      <div className="stat-grid">
        <article><span>{tr("全部记录", "All records")}</span><strong>{props.records.length}</strong><small>{tr("件小事", "moments")}</small></article>
        <article><span>{tr("本周", "This week")}</span><strong>{props.weekRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
        <article><span>{tr("本月", "This month")}</span><strong>{props.monthRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
      </div>

      <section className="content-section growth-section">
        <div className="growth-divider" aria-hidden="true" />
        <div className="growth-period-tabs" role="tablist" aria-label={tr("选择记录周期", "Choose record period")}>
          {props.periodOptions.map((period) => <button className={props.period === period.id ? "active" : ""} type="button" role="tab" aria-selected={props.period === period.id} aria-controls="growth-period-panel" id={`growth-period-${period.id}`} key={period.id} onClick={() => props.setPeriod(period.id)}><span>{period.label}</span><small>{period.count}</small></button>)}
        </div>
      </section>

      <section className="content-section timeline-section" id="growth-period-panel" role="tabpanel" aria-labelledby={`growth-period-${props.period}`}>
        <div className="growth-progress-heading"><h2>{props.activePeriod.label}{tr("记录", " records")}</h2><small>{props.activePeriod.count} {tr("件小事", "actions")}</small></div>
        <div className="growth-divider" aria-hidden="true" />
        {props.activeRecords.length ? (
          <div className="timeline" key={`timeline-${props.period}`}>
            {props.activeRecords.slice(0, 24).map((record) => (
              <article key={record.id}><i /><div><small>{formatRecordDate(record.createdAt)}</small><strong><ContentIcon value={record.icon} /> {record.actionName}</strong></div></article>
            ))}
          </div>
        ) : <div className="empty-state compact"><p>{props.period === "total" ? tr("你完成的小事，会从这里慢慢积累。", "Your completed actions will collect here over time.") : tr(`${props.activePeriod.label}还没有留下小事记录。`, `No actions recorded for ${props.activePeriod.label.toLowerCase()} yet.`)}</p></div>}
      </section>
    </div>
  );
}
