"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Tab = "today" | "growth" | "profile";
type Source = "主动记录" | "随机行动";

type Area = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
};

type MicroAction = {
  id: string;
  name: string;
  icon: string;
  areaId: string;
  value: number;
  repeatable: boolean;
};

type GrowthRecord = {
  id: string;
  actionId: string;
  actionName: string;
  icon: string;
  areaId: string;
  value: number;
  source: Source;
  createdAt: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type ToastState = {
  title: string;
  message: string;
  undoRecordId?: string;
};

type ConfirmDialog =
  | { kind: "delete-action"; action: MicroAction }
  | { kind: "reset-data" };

const STORAGE_KEY = "lizi-growth-v2";

const DEFAULT_AREAS: Area[] = [
  { id: "body", name: "身体", icon: "🌱", color: "#667957", isDefault: true },
  { id: "learn", name: "学习", icon: "📚", color: "#56748a", isDefault: true },
  { id: "create", name: "创造", icon: "🎨", color: "#8a6478", isDefault: true },
  { id: "mind", name: "精神", icon: "🧘", color: "#8d7650", isDefault: true },
  { id: "life", name: "生活", icon: "🏠", color: "#9a684f", isDefault: true },
];

const DEFAULT_ACTIONS: MicroAction[] = [
  { id: "water", name: "喝一杯水", icon: "💧", areaId: "body", value: 1, repeatable: true },
  { id: "stretch", name: "拉伸 5 秒", icon: "🙆", areaId: "body", value: 1, repeatable: true },
  { id: "read", name: "阅读一页", icon: "📖", areaId: "learn", value: 1, repeatable: true },
  { id: "word", name: "学一个单词", icon: "🔤", areaId: "learn", value: 1, repeatable: true },
  { id: "sketch", name: "画一个草图", icon: "✏️", areaId: "create", value: 1, repeatable: true },
  { id: "idea", name: "记录一个灵感", icon: "💡", areaId: "create", value: 1, repeatable: true },
];

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "今日", icon: "◉" },
  { id: "growth", label: "成长", icon: "⌁" },
  { id: "profile", label: "我的", icon: "○" },
];

function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function isToday(date: Date) {
  return localDay(date) === localDay(new Date());
}

function startOfWeek() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function formatRecordDate(value: string) {
  const date = new Date(value);
  if (isToday(date)) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function CheckInApp() {
  const [tab, setTab] = useState<Tab>("today");
  const [areas, setAreas] = useState<Area[]>(DEFAULT_AREAS);
  const [actions, setActions] = useState<MicroAction[]>(DEFAULT_ACTIONS);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [editingAction, setEditingAction] = useState<MicroAction | null>(null);
  const [showActionEditor, setShowActionEditor] = useState(false);
  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState("🌱");
  const [draftArea, setDraftArea] = useState("body");
  const [draftValue, setDraftValue] = useState(1);
  const [draftAreaName, setDraftAreaName] = useState("");
  const [draftAreaIcon, setDraftAreaIcon] = useState("🌿");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored?.areas?.length) setAreas(stored.areas);
      if (stored?.actions?.length) setActions(stored.actions);
      if (Array.isArray(stored?.records)) setRecords(stored.records);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ areas, actions, records }));
  }, [areas, actions, records, ready]);

  const todayRecords = useMemo(
    () => records.filter((record) => isToday(new Date(record.createdAt))),
    [records],
  );
  const weekRecords = useMemo(() => {
    const start = startOfWeek().getTime();
    return records.filter((record) => new Date(record.createdAt).getTime() >= start);
  }, [records]);
  const monthRecords = useMemo(() => {
    const now = new Date();
    return records.filter((record) => {
      const date = new Date(record.createdAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [records]);

  function areaFor(id: string) {
    return areas.find((area) => area.id === id) || areas[0];
  }

  function totalsFor(source: GrowthRecord[]) {
    return areas.map((area) => ({
      ...area,
      total: source
        .filter((record) => record.areaId === area.id)
        .reduce((sum, record) => sum + record.value, 0),
    }));
  }

  function showToast(
    message: string,
    title = "操作完成",
    undoRecordId?: string,
  ) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ title, message, undoRecordId });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, undoRecordId ? 4200 : 2200);
  }

  function recordAction(action: MicroAction, source: Source = "主动记录") {
    const area = areaFor(action.areaId);
    const record: GrowthRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actionId: action.id,
      actionName: action.name,
      icon: action.icon,
      areaId: action.areaId,
      value: action.value,
      source,
      createdAt: new Date().toISOString(),
    };
    setRecords((current) => [record, ...current]);
    showToast(
      `${action.icon} ${action.name} · ${area.name} +${action.value}`,
      "成长已记录",
      record.id,
    );
  }

  function undoRecord(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    showToast("刚刚的成长记录已移除", "已撤销");
  }

  function openActionEditor(action?: MicroAction) {
    setEditingAction(action || null);
    setDraftName(action?.name || "");
    setDraftIcon(action?.icon || "🌱");
    setDraftArea(action?.areaId || areas[0]?.id || "body");
    setDraftValue(action?.value || 1);
    setShowActionEditor(true);
  }

  function saveAction(event: FormEvent) {
    event.preventDefault();
    if (!draftName.trim()) return;

    if (editingAction) {
      setActions((current) =>
        current.map((action) =>
          action.id === editingAction.id
            ? {
                ...action,
                name: draftName.trim(),
                icon: draftIcon.trim() || "🌱",
                areaId: draftArea,
                value: Math.max(1, draftValue),
              }
            : action,
        ),
      );
      showToast("微行动已更新");
    } else {
      setActions((current) => [
        ...current,
        {
          id: `action-${Date.now()}`,
          name: draftName.trim(),
          icon: draftIcon.trim() || "🌱",
          areaId: draftArea,
          value: Math.max(1, draftValue),
          repeatable: true,
        },
      ]);
      showToast("新的微行动已加入");
    }
    setShowActionEditor(false);
  }

  function deleteAction(action: MicroAction) {
    setConfirmDialog({ kind: "delete-action", action });
  }

  function addArea() {
    setDraftAreaName("");
    setDraftAreaIcon("🌿");
    setShowAreaEditor(true);
  }

  function saveArea(event: FormEvent) {
    event.preventDefault();
    if (!draftAreaName.trim()) return;
    const palette = ["#6b7f72", "#9b6a62", "#78698f", "#527d86"];
    const area: Area = {
      id: `area-${Date.now()}`,
      name: draftAreaName.trim(),
      icon: draftAreaIcon.trim() || "🌿",
      color: palette[areas.length % palette.length],
    };
    setAreas((current) => [...current, area]);
    setShowAreaEditor(false);
    showToast("成长领域已创建");
  }

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    setShowInstallHelp(true);
  }

  function resetData() {
    setConfirmDialog({ kind: "reset-data" });
  }

  function confirmAction() {
    if (!confirmDialog) return;

    if (confirmDialog.kind === "delete-action") {
      setActions((current) =>
        current.filter((item) => item.id !== confirmDialog.action.id),
      );
      showToast("微行动已删除");
    } else {
      setAreas(DEFAULT_AREAS);
      setActions(DEFAULT_ACTIONS);
      setRecords([]);
      setTab("today");
      showToast("已恢复为新的开始");
    }
    setConfirmDialog(null);
  }

  const todayTotals = totalsFor(todayRecords).filter((area) => area.total > 0);
  const allTotals = totalsFor(records);
  const maxAreaTotal = Math.max(1, ...allTotals.map((area) => area.total));

  return (
    <main className="shell">
      <section className="app-frame">
        <header className="app-header">
          <button className="wordmark" type="button" onClick={() => setTab("today")}>
            <span className="brand-seed" aria-hidden="true">栗</span>
            <span>
              <strong>栗子打卡</strong>
              <small>微小行动 · 长期成长</small>
            </span>
          </button>
          <button className="install-link" type="button" onClick={install}>
            安装到桌面
          </button>
        </header>

        <div className="app-scroll">
          {tab === "today" && (
            <div className="screen">
              <section className="welcome">
                <div className="date-display" aria-label={new Intl.DateTimeFormat("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                }).format(new Date())}>
                  <strong>
                    {new Intl.DateTimeFormat("zh-CN", { day: "2-digit" }).format(new Date())}
                  </strong>
                  <span>
                    <b>
                      {new Intl.DateTimeFormat("zh-CN", {
                        year: "numeric",
                        month: "long",
                      }).format(new Date())}
                    </b>
                    <small>
                      {new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(new Date())}
                    </small>
                  </span>
                </div>
                <h1>{greeting()}，今天想留下什么？</h1>
                <p>不用完成一整件大事，记录一个已经发生的小行动就很好。</p>
              </section>

              <section className="today-card">
                <div className="today-card-copy">
                  <span>今日成长</span>
                  <strong>{todayRecords.length}</strong>
                  <small>次微小行动</small>
                </div>
                <div className="today-orbit" aria-hidden="true">
                  <span className="orbit-core">🌰</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="today-domains">
                  {todayTotals.length ? (
                    todayTotals.map((area) => (
                      <span key={area.id}>
                        {area.icon} {area.name} +{area.total}
                      </span>
                    ))
                  ) : (
                    <span className="quiet">今天的成长从第一颗栗子开始</span>
                  )}
                </div>
              </section>

              <section className="content-section">
                <div className="section-title-row">
                  <div>
                    <span className="overline">快速记录</span>
                    <h2>点一下，3 秒完成</h2>
                  </div>
                  <button type="button" onClick={() => setTab("profile")}>管理</button>
                </div>
                <div className="quick-grid">
                  {actions.slice(0, 6).map((action) => {
                    const area = areaFor(action.areaId);
                    return (
                      <button
                        className="quick-action"
                        type="button"
                        key={action.id}
                        onClick={() => recordAction(action)}
                      >
                        <span className="action-icon" style={{ background: `${area.color}18` }}>
                          {action.icon}
                        </span>
                        <strong>{action.name}</strong>
                        <small style={{ color: area.color }}>{area.name} +{action.value}</small>
                        <i aria-hidden="true">＋</i>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="content-section recent-section">
                <div className="section-title-row">
                  <div>
                    <span className="overline">最近成长</span>
                    <h2>已经发生的，都算数</h2>
                  </div>
                </div>
                {records.length ? (
                  <div className="record-list">
                    {records.slice(0, 5).map((record) => {
                      const area = areaFor(record.areaId);
                      return (
                        <article className="record-row" key={record.id}>
                          <span className="record-icon">{record.icon}</span>
                          <div>
                            <strong>{record.actionName}</strong>
                            <small>{formatRecordDate(record.createdAt)} · {record.source}</small>
                          </div>
                          <span style={{ color: area.color }}>{area.name} +{record.value}</span>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>◌</span>
                    <p>完成一个微行动后，它会安静地留在这里。</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "growth" && (
            <div className="screen">
              <section className="page-heading">
                <span className="overline">GROWTH OVERVIEW</span>
                <h1>成长正在发生</h1>
                <p>不看完成率，只看你真实留下的积累。</p>
              </section>

              <div className="stat-grid">
                <article>
                  <span>全部记录</span>
                  <strong>{records.length}</strong>
                  <small>次成长</small>
                </article>
                <article>
                  <span>本周</span>
                  <strong>{weekRecords.length}</strong>
                  <small>次行动</small>
                </article>
                <article>
                  <span>本月</span>
                  <strong>{monthRecords.length}</strong>
                  <small>次行动</small>
                </article>
              </div>

              <section className="content-section growth-section">
                <div className="section-title-row">
                  <div>
                    <span className="overline">成长领域</span>
                    <h2>你在把时间放在哪里</h2>
                  </div>
                </div>
                <div className="growth-areas">
                  {allTotals.map((area) => (
                    <article className="growth-area" key={area.id}>
                      <span className="growth-area-icon" style={{ background: `${area.color}18` }}>
                        {area.icon}
                      </span>
                      <div>
                        <strong>{area.name}</strong>
                        <span className="progress-track">
                          <i
                            style={{
                              width: `${Math.max(area.total ? 12 : 0, (area.total / maxAreaTotal) * 100)}%`,
                              background: area.color,
                            }}
                          />
                        </span>
                      </div>
                      <strong className="area-total">{area.total}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-section timeline-section">
                <div className="section-title-row">
                  <div>
                    <span className="overline">成长时间轴</span>
                    <h2>每一颗栗子都有来处</h2>
                  </div>
                </div>
                {records.length ? (
                  <div className="timeline">
                    {records.slice(0, 12).map((record) => {
                      const area = areaFor(record.areaId);
                      return (
                        <article key={record.id}>
                          <i style={{ background: area.color }} />
                          <div>
                            <small>{formatRecordDate(record.createdAt)}</small>
                            <strong>{record.icon} {record.actionName}</strong>
                            <span style={{ color: area.color }}>{area.name} +{record.value}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <p>你的长期成长轨迹，会从这里慢慢展开。</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "profile" && (
            <div className="screen">
              <section className="page-heading">
                <span className="overline">MY SPACE</span>
                <h1>我的栗子</h1>
                <p>管理微行动和成长方向，让它更贴近你的节奏。</p>
              </section>

              <section className="settings-block profile-actions">
                <div className="settings-heading">
                  <div>
                    <span className="overline">微行动</span>
                    <h2>我的微行动</h2>
                  </div>
                  <button type="button" onClick={() => openActionEditor()}>＋ 新建</button>
                </div>

                <div className="action-library profile-library">
                  {areas.map((area) => {
                    const areaActions = actions.filter((action) => action.areaId === area.id);
                    if (!areaActions.length) return null;
                    return (
                      <section className="area-group" key={area.id}>
                        <div className="area-group-title">
                          <span>{area.icon}</span>
                          <strong>{area.name}</strong>
                          <small>{areaActions.length} 个行动</small>
                        </div>
                        {areaActions.map((action) => (
                          <article className="library-row" key={action.id}>
                            <button
                              className="library-record"
                              type="button"
                              onClick={() => recordAction(action)}
                            >
                              <span>{action.icon}</span>
                              <div>
                                <strong>{action.name}</strong>
                                <small>完成后 {area.name} +{action.value}</small>
                              </div>
                              <i>＋</i>
                            </button>
                            <div className="row-actions">
                              <button type="button" onClick={() => openActionEditor(action)}>编辑</button>
                              <button type="button" onClick={() => deleteAction(action)}>删除</button>
                            </div>
                          </article>
                        ))}
                      </section>
                    );
                  })}
                </div>
              </section>

              <section className="settings-block">
                <div className="settings-heading">
                  <div>
                    <span className="overline">成长领域</span>
                    <h2>我关注的方向</h2>
                  </div>
                  <button type="button" onClick={addArea}>＋ 添加</button>
                </div>
                <div className="area-chip-list">
                  {areas.map((area) => (
                    <span key={area.id} style={{ borderColor: `${area.color}55` }}>
                      {area.icon} {area.name}
                    </span>
                  ))}
                </div>
              </section>

              <details className="settings-block philosophy">
                <summary>
                  <span className="philosophy-title">
                    <i aria-hidden="true">○</i>
                    <span>
                      <strong>关于栗子打卡</strong>
                      <small>产品理念与记录原则</small>
                    </span>
                  </span>
                  <span className="summary-chevron" aria-hidden="true">⌄</span>
                </summary>
                <div className="philosophy-content">
                  <blockquote>
                    “成长不是由几个重大事件组成，而是由无数微小行动累积而成。”
                  </blockquote>
                  <ul>
                    <li>记录成长，而不是记录失败</li>
                    <li>默认展示已经做到的事情</li>
                    <li>数据服务于回顾，而不是竞争</li>
                  </ul>
                </div>
              </details>

              <section className="settings-block data-settings">
                <div>
                  <strong>设备本地数据</strong>
                  <small>当前共有 {records.length} 条成长记录</small>
                </div>
                <button type="button" onClick={resetData}>清空并重置</button>
              </section>
            </div>
          )}
        </div>

        <nav className="bottom-nav" aria-label="主要导航">
          {NAV_ITEMS.map((item) => (
            <button
              className={`${tab === item.id ? "active" : ""} ${
                item.id === "today" ? "primary-tab" : ""
              }`}
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      {toast && (
        <div className="toast" role="status">
          <span className="toast-check" aria-hidden="true">✓</span>
          <span className="toast-copy">
            <strong>{toast.title}</strong>
            <small>{toast.message}</small>
          </span>
          {toast.undoRecordId && (
            <button
              className="toast-undo"
              type="button"
              onClick={() => undoRecord(toast.undoRecordId!)}
            >
              撤销
            </button>
          )}
        </div>
      )}

      {showActionEditor && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowActionEditor(false)}>
          <form
            className="bottom-sheet action-editor"
            onSubmit={saveAction}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setShowActionEditor(false)}
            >
              ×
            </button>
            <span className="overline">{editingAction ? "编辑微行动" : "新的微行动"}</span>
            <h2>{editingAction ? "把行动调整得更顺手" : "从一件足够小的事开始"}</h2>
            <label>
              行动名称
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="例如：阅读一页"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                图标
                <input
                  value={draftIcon}
                  onChange={(event) => setDraftIcon(event.target.value)}
                  maxLength={4}
                />
              </label>
              <label>
                成长值
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={draftValue}
                  onChange={(event) => setDraftValue(Number(event.target.value))}
                />
              </label>
            </div>
            <label>
              成长领域
              <select value={draftArea} onChange={(event) => setDraftArea(event.target.value)}>
                {areas.map((area) => (
                  <option value={area.id} key={area.id}>{area.icon} {area.name}</option>
                ))}
              </select>
            </label>
            <button className="save-button" type="submit">
              {editingAction ? "保存修改" : "加入我的微行动"}
            </button>
          </form>
        </div>
      )}

      {showAreaEditor && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowAreaEditor(false)}>
          <form
            className="bottom-sheet area-editor"
            onSubmit={saveArea}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setShowAreaEditor(false)}
            >
              ×
            </button>
            <span className="overline">新的成长领域</span>
            <h2>你还想关注什么？</h2>
            <p className="sheet-description">给新的成长方向一个简单、容易辨认的名字。</p>
            <div className="area-form-row">
              <label>
                图标
                <input
                  value={draftAreaIcon}
                  onChange={(event) => setDraftAreaIcon(event.target.value)}
                  maxLength={4}
                />
              </label>
              <label>
                领域名称
                <input
                  value={draftAreaName}
                  onChange={(event) => setDraftAreaName(event.target.value)}
                  placeholder="例如：关系"
                  autoFocus
                />
              </label>
            </div>
            <button className="save-button" type="submit">添加成长领域</button>
          </form>
        </div>
      )}

      {confirmDialog && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDialog(null)}>
          <section
            className={`bottom-sheet confirm-sheet ${
              confirmDialog.kind === "reset-data" ? "danger-sheet" : ""
            }`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="dialog-symbol" aria-hidden="true">
              {confirmDialog.kind === "reset-data" ? "↺" : "−"}
            </span>
            <span className="overline">
              {confirmDialog.kind === "reset-data" ? "谨慎操作" : "整理微行动"}
            </span>
            <h2 id="confirm-title">
              {confirmDialog.kind === "reset-data" ? "要重新开始吗？" : "删除这个微行动？"}
            </h2>
            <p id="confirm-description">
              {confirmDialog.kind === "reset-data"
                ? "所有成长记录会被清空，微行动和成长领域将恢复默认状态。此操作无法撤销。"
                : `“${confirmDialog.action.name}”将从你的微行动中移除，已经留下的成长记录仍会保留。`}
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                type="button"
                onClick={() => setConfirmDialog(null)}
              >
                先保留
              </button>
              <button
                className="dialog-button danger"
                type="button"
                onClick={confirmAction}
              >
                {confirmDialog.kind === "reset-data" ? "清空并重置" : "确认删除"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showInstallHelp && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowInstallHelp(false)}>
          <section
            className="bottom-sheet install-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setShowInstallHelp(false)}
            >
              ×
            </button>
            <span className="brand-seed sheet-seed" aria-hidden="true">栗</span>
            <h2 id="install-title">添加到手机桌面</h2>
            <div className="instruction">
              <span>iPhone</span>
              <p>用 Safari 打开，点底部“分享”，再选“添加到主屏幕”。</p>
            </div>
            <div className="instruction">
              <span>Android</span>
              <p>用 Chrome 打开，点右上角菜单，再选“安装应用”。</p>
            </div>
            <button className="save-button" type="button" onClick={() => setShowInstallHelp(false)}>
              我知道了
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
