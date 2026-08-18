import type { Dispatch, SetStateAction } from "react";
import type { GrowthPeriod } from "../app/types";
import type { GrowthArea, GrowthRecord } from "../features/growth/types";
import type { Language } from "../features/settings/types";
import { formatRecordDate } from "../features/statistics/domain/date-ranges";
import { AppIcon } from "../components/ui/AppIcon";
import { ContentIcon } from "../components/ui/ContentIcon";

type GrowthTotal = GrowthArea & { total: number };
type GrowthLevel = GrowthTotal & ReturnType<typeof import("../features/growth/domain/growth-rules").growthLevelFor>;
type PeriodOption = {
  id: GrowthPeriod;
  label: string;
  count: number;
  totals: GrowthTotal[];
  maxTotal: number;
};

type GrowthPageProps = {
  active: boolean;
  language: Language;
  locale: string;
  now: Date;
  records: GrowthRecord[];
  weekRecords: GrowthRecord[];
  monthRecords: GrowthRecord[];
  growthLevels: GrowthLevel[];
  period: GrowthPeriod;
  periodOptions: PeriodOption[];
  activePeriod: PeriodOption;
  activeRecords: GrowthRecord[];
  areas: GrowthArea[];
  setPeriod: Dispatch<SetStateAction<GrowthPeriod>>;
  onOpenCalendar: () => void;
  onOpenArea: (id: string) => void;
  tagsFor: (record: GrowthRecord) => GrowthArea[];
};

export function GrowthPage(props: GrowthPageProps) {
  const tr = (zh: string, en: string) => props.language === "zh" ? zh : en;
  return (
    <div className="screen tab-screen" data-tab="growth" aria-hidden={!props.active}>
      <section className="page-heading growth-page-heading">
        <button className="date-display" type="button" aria-label={`${tr("打开日历", "Open calendar")}，${new Intl.DateTimeFormat(props.locale, { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(props.now)}`} onClick={props.onOpenCalendar}>
          <strong>{new Intl.DateTimeFormat(props.locale, { day: "2-digit" }).format(props.now)}</strong>
          <span><b>{new Intl.DateTimeFormat(props.locale, { year: "numeric", month: "long" }).format(props.now)}</b><small>{new Intl.DateTimeFormat(props.locale, { weekday: "long" }).format(props.now)}</small></span>
          <AppIcon className="date-display-chevron" name="chevronRight" />
        </button>
        <span className="overline">GROWTH OVERVIEW</span><h1>{tr("成长正在发生", "Growth in progress")}</h1>
      </section>

      <section className="growth-level-section">
        <div className="growth-level-heading"><h2>{tr("领域等级", "Area levels")}</h2><small>{tr("1 成长值 = 1 经验", "1 growth point = 1 XP")}</small></div>
        <div className="growth-level-list" onTouchStart={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()} onTouchCancel={(event) => event.stopPropagation()}>
          {props.growthLevels.map((area) => (
            <button className={`growth-level-card${area.isMax ? " max-level" : ""}`} type="button" key={`level-${area.id}`} aria-label={`${tr("查看", "View")} ${area.name}`} onClick={() => props.onOpenArea(area.id)}>
              <span className="growth-level-icon" style={{ color: area.color, background: `${area.color}18` }} aria-hidden="true"><ContentIcon value={area.icon} /></span>
              <div className="growth-level-copy"><div><strong>{area.name}</strong><span style={{ color: area.color }}>Lv.{area.level}</span></div><span className="growth-level-track" role="progressbar" aria-label={`${area.name} ${tr("等级进度", "level progress")}`} aria-valuemin={0} aria-valuemax={area.isMax ? Math.max(area.experience, area.nextThreshold) : area.nextThreshold} aria-valuenow={area.experience}><i style={{ width: `${area.progress}%`, background: area.color }} /></span><small>{area.isMax ? tr(`${area.experience} 经验 · 满级`, `${area.experience} XP · Max`) : tr(`${area.experience} / ${area.nextThreshold}`, `${area.experience} / ${area.nextThreshold} XP`)}</small></div>
            </button>
          ))}
        </div>
      </section>

      <div className="stat-grid">
        <article><span>{tr("全部记录", "All records")}</span><strong>{props.records.length}</strong><small>{tr("次成长", "moments")}</small></article>
        <article><span>{tr("本周", "This week")}</span><strong>{props.weekRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
        <article><span>{tr("本月", "This month")}</span><strong>{props.monthRecords.length}</strong><small>{tr("次行动", "actions")}</small></article>
      </div>

      <section className="content-section growth-section">
        <div className="growth-divider" aria-hidden="true" />
        <div className="growth-period-tabs" role="tablist" aria-label={tr("选择进度周期", "Choose progress period")}>
          {props.periodOptions.map((period) => <button className={props.period === period.id ? "active" : ""} type="button" role="tab" aria-selected={props.period === period.id} aria-controls="growth-period-panel" id={`growth-period-${period.id}`} key={period.id} onClick={() => props.setPeriod(period.id)}><span>{period.label}</span><small>{period.count}</small></button>)}
        </div>
        <div className={`growth-progress-group period-progress-group ${props.period}-progress-group`} id="growth-period-panel" role="tabpanel" aria-labelledby={`growth-period-${props.period}`} key={props.period}>
          <div className="growth-progress-heading"><h2>{props.period === "total" ? tr("总进度", "Total progress") : `${props.activePeriod.label}${tr("进度", " progress")}`}</h2><small>{props.activePeriod.count} {tr("件小事", "actions")}</small></div>
          <div className="growth-areas">
            {props.activePeriod.totals.map((area) => <button className="growth-area" type="button" key={`${props.period}-${area.id}`} aria-label={`${tr("查看", "View")} ${area.name}`} onClick={() => props.onOpenArea(area.id)}><span className="growth-area-icon" style={{ color: area.color, background: `${area.color}18` }}><ContentIcon value={area.icon} /></span><div><strong>{area.name}</strong><span className="progress-track"><i style={{ width: `${Math.max(area.total ? 12 : 0, (area.total / props.activePeriod.maxTotal) * 100)}%`, background: area.color }} /></span></div><strong className="area-total">{area.total}</strong></button>)}
          </div>
        </div>
      </section>

      <section className="content-section timeline-section">
        <div className="growth-divider" aria-hidden="true" />
        {props.activeRecords.length ? (
          <div className="timeline" key={`timeline-${props.period}`}>
            {props.activeRecords.slice(0, 12).map((record) => {
              const recordTags = props.tagsFor(record);
              const primaryTag = recordTags[0] || props.areas[0];
              return <article key={record.id}><i style={{ background: primaryTag.color }} /><div><small>{formatRecordDate(record.createdAt)}</small><strong><ContentIcon value={record.icon} style={{ color: primaryTag.color }} /> {record.actionName}</strong><span className="timeline-tags">{recordTags.map((tag) => <i key={tag.id} style={{ color: tag.color }}>{tag.name} +{record.value}</i>)}</span></div></article>;
            })}
          </div>
        ) : <div className="empty-state compact"><p>{props.period === "total" ? tr("你的长期成长轨迹，会从这里慢慢展开。", "Your growth history will unfold here.") : tr(`${props.activePeriod.label}还没有留下小事记录。`, `No actions recorded for ${props.activePeriod.label.toLowerCase()} yet.`)}</p></div>}
      </section>
    </div>
  );
}
