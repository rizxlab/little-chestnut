"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "lizi-checkins-v1";

function dayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildWeek() {
  const today = new Date();
  const weekday = today.getDay() || 7;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - weekday + 1 + index);
    return date;
  });
}

function calculateStreak(checkIns: string[]) {
  let streak = 0;
  const cursor = new Date();
  if (!checkIns.includes(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (checkIns.includes(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function CheckInApp() {
  const [checkIns, setCheckIns] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const today = dayKey();
  const checkedToday = checkIns.includes(today);
  const week = useMemo(buildWeek, []);
  const streak = calculateStreak(checkIns);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setCheckIns(stored);
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
    return () =>
      window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  function toggleToday() {
    const next = checkedToday
      ? checkIns.filter((date) => date !== today)
      : [...checkIns, today];
    setCheckIns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (!checkedToday) {
      setJustChecked(true);
      window.setTimeout(() => setJustChecked(false), 900);
    }
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

  return (
    <main className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="app-card">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              栗
            </span>
            <div>
              <strong>栗子打卡</strong>
              <span>把小事，慢慢做成大事</span>
            </div>
          </div>
          <button className="install-button" type="button" onClick={install}>
            <span aria-hidden="true">↓</span>
            安装
          </button>
        </header>

        <div className="date-row">
          <span>
            {new Intl.DateTimeFormat("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "long",
            }).format(new Date())}
          </span>
          <span className="local-pill">
            <i /> 已保存在本机
          </span>
        </div>

        <section className="hero-panel">
          <div className="streak-copy">
            <span className="eyebrow">连续坚持</span>
            <div className="streak-number">
              <strong>{ready ? streak : "—"}</strong>
              <span>天</span>
            </div>
            <p>{checkedToday ? "今天也稳稳接住了自己。" : "今天，也为自己留下一颗栗子吧。"}</p>
          </div>

          <button
            className={`check-button ${checkedToday ? "is-checked" : ""} ${
              justChecked ? "pop" : ""
            }`}
            type="button"
            onClick={toggleToday}
            aria-pressed={checkedToday}
          >
            <span className="check-ring">
              <span aria-hidden="true">{checkedToday ? "✓" : "＋"}</span>
            </span>
            <strong>{checkedToday ? "今日已打卡" : "今日打卡"}</strong>
            <small>{checkedToday ? "点按可以撤销" : "点按留下今天的记录"}</small>
          </button>
        </section>

        <section className="week-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">本周足迹</span>
              <h2>每一次都算数</h2>
            </div>
            <span className="week-count">
              {week.filter((date) => checkIns.includes(dayKey(date))).length}/7
            </span>
          </div>

          <div className="week-grid">
            {week.map((date, index) => {
              const key = dayKey(date);
              const done = checkIns.includes(key);
              const isToday = key === today;
              return (
                <div
                  className={`day ${done ? "done" : ""} ${
                    isToday ? "today" : ""
                  }`}
                  key={key}
                >
                  <span>{"一二三四五六日"[index]}</span>
                  <strong>{date.getDate()}</strong>
                  <i>{done ? "✓" : ""}</i>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="quote">
          <span aria-hidden="true">“</span>
          <p>不用一下子走很远，今天向前一点点就很好。</p>
        </footer>
      </section>

      {showInstallHelp && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowInstallHelp(false)}
        >
          <section
            className="install-sheet"
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
            <span className="sheet-icon" aria-hidden="true">
              栗
            </span>
            <h2 id="install-title">添加到手机桌面</h2>
            <div className="instruction">
              <span>iPhone</span>
              <p>用 Safari 打开，点底部“分享”，再选“添加到主屏幕”。</p>
            </div>
            <div className="instruction">
              <span>Android</span>
              <p>用 Chrome 打开，点右上角菜单，再选“安装应用”。</p>
            </div>
            <button
              className="got-it"
              type="button"
              onClick={() => setShowInstallHelp(false)}
            >
              我知道了
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
