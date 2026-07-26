"use client";

import {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tab = "today" | "growth" | "profile";
type Source = "主动记录" | "随机行动";
type Language = "zh" | "en";
type Theme = "light" | "dark";

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
  tagIds: string[];
  areaId?: string;
  value: number;
  repeatable: boolean;
  timerSeconds?: number;
};

type GrowthRecord = {
  id: string;
  actionId: string;
  actionName: string;
  icon: string;
  tagIds: string[];
  areaId?: string;
  value: number;
  source: Source;
  createdAt: string;
};

type ToastState = {
  id: string;
  title: string;
  message: string;
  undoRecordId?: string;
  undone?: boolean;
  leaving?: boolean;
};

type Reward = {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
};

type RewardClaim = {
  id: string;
  rewardId: string;
  rewardName: string;
  icon: string;
  cost: number;
  createdAt: string;
};

type Account = {
  username: string;
};

type ConfirmDialog =
  | { kind: "delete-action"; action: MicroAction }
  | { kind: "delete-area"; area: Area }
  | { kind: "delete-reward"; reward: Reward }
  | { kind: "reset-data" };

const STORAGE_KEY = "lizi-growth-v2";
const GUEST_STORAGE_KEY = `${STORAGE_KEY}:guest`;
const SAMPLE_HISTORY_KEY = "lizi-sample-history-v1";
const ACTION_ICON_OPTIONS = [
  "🌱", "💧", "🧘", "💪", "🏃", "🚶", "📖", "✏️", "📝", "🎨",
  "🎧", "🧹", "☀️", "🌙", "🍎", "🥗", "☕", "🫁", "🧠", "🛏️",
];
const AREA_ICON_OPTIONS = [
  "🌿", "💚", "🌱", "📚", "🎨", "🧘", "🤝", "☀️", "🌙", "💼",
  "🏡", "🎯", "💡", "🌸", "🫶", "✨", "🧠", "💪",
];
const REWARD_ICON_OPTIONS = [
  "🎁", "🍵", "☕", "🎧", "🍰", "🧁", "🌙", "🎬", "📚", "🎮",
  "🛁", "🌸", "🍜", "🛍️", "🎵", "🌿", "✈️", "🍽️", "🧸", "🎟️",
];

function IconPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (icon: string) => void;
}) {
  const visibleOptions = options.includes(value) ? options : [value, ...options];
  return (
    <fieldset className="icon-picker">
      <legend>{label}</legend>
      <div>
        {visibleOptions.map((icon) => (
          <button
            className={value === icon ? "selected" : ""}
            type="button"
            key={icon}
            aria-label={`选择图标 ${icon}`}
            aria-pressed={value === icon}
            onClick={() => onChange(icon)}
          >
            {icon}
            {value === icon && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const DEFAULT_AREAS: Area[] = [
  { id: "health", name: "健康", icon: "💚", color: "#4f8069", isDefault: true },
  { id: "body", name: "身体", icon: "🌱", color: "#667957", isDefault: true },
  { id: "learn", name: "学习", icon: "📚", color: "#56748a", isDefault: true },
  { id: "create", name: "创造", icon: "🎨", color: "#8a6478", isDefault: true },
  { id: "mind", name: "精神", icon: "🧘", color: "#8d7650", isDefault: true },
  { id: "life", name: "生活", icon: "🏠", color: "#9a684f", isDefault: true },
];
const AREA_COLORS = ["#4f8069", "#9b6a62", "#78698f", "#527d86", "#8d7650", "#56748a"];

const DEFAULT_ACTIONS: MicroAction[] = [
  { id: "water", name: "喝一杯水", icon: "💧", tagIds: ["health", "body"], value: 1, repeatable: true },
  { id: "stretch", name: "平板支撑 5 秒", icon: "💪", tagIds: ["health", "body"], value: 1, repeatable: true, timerSeconds: 5 },
  { id: "read", name: "阅读一页", icon: "📖", tagIds: ["learn", "mind"], value: 1, repeatable: true },
  { id: "word", name: "学一个单词", icon: "🔤", tagIds: ["learn"], value: 1, repeatable: true },
  { id: "sketch", name: "画一个草图", icon: "✏️", tagIds: ["create", "mind"], value: 1, repeatable: true },
  { id: "idea", name: "记录一个灵感", icon: "💡", tagIds: ["create", "mind"], value: 1, repeatable: true },
];

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "今日", icon: "◉" },
  { id: "growth", label: "成长", icon: "⌁" },
  { id: "profile", label: "我的", icon: "○" },
];

const DEFAULT_REWARDS: Reward[] = [
  {
    id: "favorite-drink",
    name: "喜欢的饮品",
    description: "认真喝一杯自己喜欢的东西",
    icon: "🍵",
    cost: 5,
  },
  {
    id: "slow-half-hour",
    name: "兴趣半小时",
    description: "留半小时，只做真正想做的事",
    icon: "🎧",
    cost: 12,
  },
  {
    id: "small-treat",
    name: "一份小甜点",
    description: "给今天的自己一点甜",
    icon: "🍰",
    cost: 25,
  },
  {
    id: "rest-evening",
    name: "完整休息一晚",
    description: "今晚不赶进度，安心休息",
    icon: "🌙",
    cost: 50,
  },
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

function greeting(language: Language) {
  const hour = new Date().getHours();
  if (language === "en") {
    if (hour < 6) return "Good night";
    if (hour < 11) return "Good morning";
    if (hour < 14) return "Good afternoon";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
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

function normalizedTagIds(value: { tagIds?: string[]; areaId?: string }) {
  if (value.tagIds?.length) return value.tagIds;
  return value.areaId ? [value.areaId] : [];
}

function sampleDate(daysAgo: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildSampleRecords(): GrowthRecord[] {
  return [
    {
      id: "sample-history-water",
      actionId: "water",
      actionName: "喝一杯水",
      icon: "💧",
      tagIds: ["health", "body"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(2, 9, 20),
    },
    {
      id: "sample-history-read",
      actionId: "read",
      actionName: "阅读一页",
      icon: "📖",
      tagIds: ["learn", "mind"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(4, 21, 10),
    },
    {
      id: "sample-history-idea",
      actionId: "idea",
      actionName: "记录一个灵感",
      icon: "💡",
      tagIds: ["create", "mind"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(4, 15, 35),
    },
    {
      id: "sample-history-stretch",
      actionId: "stretch",
      actionName: "拉伸 5 秒",
      icon: "🙆",
      tagIds: ["health", "body"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(7, 8, 45),
    },
    {
      id: "sample-history-word",
      actionId: "word",
      actionName: "学一个单词",
      icon: "🔤",
      tagIds: ["learn"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(12, 12, 15),
    },
    {
      id: "sample-history-sketch",
      actionId: "sketch",
      actionName: "画一个草图",
      icon: "✏️",
      tagIds: ["create", "mind"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(18, 18, 30),
    },
    {
      id: "sample-history-last-month",
      actionId: "water",
      actionName: "喝一杯水",
      icon: "💧",
      tagIds: ["health", "body"],
      value: 1,
      source: "主动记录",
      createdAt: sampleDate(31, 10, 5),
    },
  ];
}

export function CheckInApp() {
  const [account, setAccount] = useState<Account | null>(null);
  const [nickname, setNickname] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [serverHydrated, setServerHydrated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [closingModal, setClosingModal] = useState<string | null>(null);
  const [modalDrag, setModalDrag] = useState<{ id: string; offset: number } | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [areas, setAreas] = useState<Area[]>(DEFAULT_AREAS);
  const [actions, setActions] = useState<MicroAction[]>(DEFAULT_ACTIONS);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [orbitRippleKey, setOrbitRippleKey] = useState(0);
  const [recordActionMenu, setRecordActionMenu] = useState<MicroAction | null>(null);
  const [recordActionMenuPosition, setRecordActionMenuPosition] = useState({
    left: 12,
    top: 12,
  });
  const [lastCheckedAction, setLastCheckedAction] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastTimers = useRef<number[]>([]);
  const [editingAction, setEditingAction] = useState<MicroAction | null>(null);
  const [showActionManager, setShowActionManager] = useState(false);
  const [showActionEditor, setShowActionEditor] = useState(false);
  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState("🌱");
  const [draftTags, setDraftTags] = useState<string[]>(["body"]);
  const [draftValue, setDraftValue] = useState(1);
  const [draftUsesTimer, setDraftUsesTimer] = useState(false);
  const [draftTimerSeconds, setDraftTimerSeconds] = useState(5);
  const [timerAction, setTimerAction] = useState<MicroAction | null>(null);
  const [timerPhase, setTimerPhase] = useState<"idle" | "preparing" | "running" | "success">("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerMultiplier, setTimerMultiplier] = useState(1);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showAreaManager, setShowAreaManager] = useState(false);
  const [draftAreaName, setDraftAreaName] = useState("");
  const [draftAreaIcon, setDraftAreaIcon] = useState("🌿");
  const [draftAreaColor, setDraftAreaColor] = useState(AREA_COLORS[0]);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [draftProfileNickname, setDraftProfileNickname] = useState("");
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [shellBalance, setShellBalance] = useState(0);
  const [shellsEarned, setShellsEarned] = useState(0);
  const [bankDropKey, setBankDropKey] = useState(0);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showRewardManager, setShowRewardManager] = useState(false);
  const [showRewardEditor, setShowRewardEditor] = useState(false);
  const [draftRewardName, setDraftRewardName] = useState("");
  const [draftRewardDescription, setDraftRewardDescription] = useState("");
  const [draftRewardIcon, setDraftRewardIcon] = useState("🎁");
  const [draftRewardCost, setDraftRewardCost] = useState(10);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => localDay(new Date()));
  const appScrollRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressQuickClickRef = useRef<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureAxisRef = useRef<"horizontal" | "vertical" | null>(null);
  const modalDragStartRef = useRef<{
    id: string;
    y: number;
    time: number;
  } | null>(null);
  const modalDragCloseRef = useRef<(() => void) | null>(null);
  const modalAnimationTimerRef = useRef<number | null>(null);

  function applyAccountData(value: unknown, username: string) {
    const stored =
      value && typeof value === "object" ? (value as Record<string, unknown>) : null;
    const storedAreas = Array.isArray(stored?.areas) ? (stored.areas as Area[]) : [];
    setAreas(
      storedAreas.length
        ? [
            ...storedAreas,
            ...DEFAULT_AREAS.filter(
              (defaultArea) =>
                !storedAreas.some((area) => area.id === defaultArea.id),
            ),
          ]
        : DEFAULT_AREAS,
    );

    const storedActions = Array.isArray(stored?.actions)
      ? (stored.actions as MicroAction[])
      : [];
    setActions(
      storedActions.length
        ? storedActions.map((action) => {
            const defaultAction = DEFAULT_ACTIONS.find(
              (item) => item.id === action.id,
            );
            return {
              ...action,
              name:
                action.id === "stretch" && action.name === "拉伸 5 秒"
                  ? defaultAction?.name || action.name
                  : action.name,
              icon:
                action.id === "stretch" && action.name === "拉伸 5 秒"
                  ? defaultAction?.icon || action.icon
                  : action.icon,
              tagIds: action.tagIds?.length
                ? action.tagIds
                : defaultAction?.tagIds || normalizedTagIds(action),
              timerSeconds: action.timerSeconds ?? defaultAction?.timerSeconds,
            };
          })
        : DEFAULT_ACTIONS,
    );

    const storedRecords = Array.isArray(stored?.records)
      ? (stored.records as GrowthRecord[]).map((record) => ({
          ...record,
          tagIds: normalizedTagIds(record),
        }))
      : [];
    const existingRecordIds = new Set(storedRecords.map((record) => record.id));
    const sampleKey = `${SAMPLE_HISTORY_KEY}:${username}`;
    const shouldSeedHistory = localStorage.getItem(sampleKey) !== "done";
    const mergedRecords = [
      ...storedRecords,
      ...(shouldSeedHistory
        ? buildSampleRecords().filter(
            (record) => !existingRecordIds.has(record.id),
          )
        : []),
    ];
    setRecords(mergedRecords);
    setShellBalance(
      typeof stored?.shellBalance === "number"
        ? Math.max(0, stored.shellBalance)
        : mergedRecords.length,
    );
    setShellsEarned(
      typeof stored?.shellsEarned === "number"
        ? Math.max(0, stored.shellsEarned)
        : mergedRecords.length,
    );
    setRewards(
      Array.isArray(stored?.rewards)
        ? (stored.rewards as Reward[])
        : DEFAULT_REWARDS,
    );
    setRewardClaims(
      Array.isArray(stored?.rewardClaims)
        ? (stored.rewardClaims as RewardClaim[])
        : [],
    );
    const preferences =
      stored?.preferences && typeof stored.preferences === "object"
        ? (stored.preferences as { language?: Language; theme?: Theme })
        : null;
    const profile =
      stored?.profile && typeof stored.profile === "object"
        ? (stored.profile as { nickname?: string })
        : null;
    setNickname(
      typeof profile?.nickname === "string"
        ? profile.nickname.slice(0, 16)
        : "",
    );
    setLanguage(preferences?.language === "en" ? "en" : "zh");
    setTheme(preferences?.theme === "dark" ? "dark" : "light");
    if (shouldSeedHistory) localStorage.setItem(sampleKey, "done");
  }

  async function hydrateAccount(nextAccount: Account) {
    setReady(false);
    setServerHydrated(false);
    const response = await fetch("/api/account-data", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 401) throw new Error("登录状态已失效");
    if (!response.ok) throw new Error("账号数据暂时无法读取");
    const result = (await response.json()) as { data?: unknown };

    let fallback: unknown = null;
    try {
      fallback = JSON.parse(
        localStorage.getItem(`${STORAGE_KEY}:${nextAccount.username}`)
          || (nextAccount.username === "123456"
            ? localStorage.getItem(STORAGE_KEY)
            : "")
          || "null",
      );
    } catch {
      fallback = null;
    }

    applyAccountData(result.data ?? fallback, nextAccount.username);
    setAccount(nextAccount);
    setReady(true);
    setServerHydrated(true);
  }

  function hydrateGuest() {
    let stored: unknown = null;
    try {
      stored = JSON.parse(
        localStorage.getItem(GUEST_STORAGE_KEY)
          || localStorage.getItem(STORAGE_KEY)
          || "null",
      );
    } catch {
      stored = null;
    }
    applyAccountData(stored, "guest");
    setNickname("");
    setAccount(null);
    setReady(true);
    setServerHydrated(false);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (response.ok) {
          const result = (await response.json()) as { account: Account };
          await hydrateAccount(result.account);
        } else {
          hydrateGuest();
        }
      } catch {
        hydrateGuest();
      } finally {
        if (active) setAuthReady(true);
      }
    })();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    return () => {
      active = false;
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      if (modalAnimationTimerRef.current) window.clearTimeout(modalAnimationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const data = {
      areas,
      actions,
      records,
      shellBalance,
      shellsEarned,
      rewards,
      rewardClaims,
      profile: { nickname: account ? nickname.trim() : "" },
      preferences: { language, theme },
    };
    localStorage.setItem(
      account ? `${STORAGE_KEY}:${account.username}` : GUEST_STORAGE_KEY,
      JSON.stringify(data),
    );
    if (!account || !serverHydrated) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/account-data", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [
    account,
    areas,
    actions,
    records,
    rewardClaims,
    rewards,
    language,
    nickname,
    serverHydrated,
    shellBalance,
    shellsEarned,
    theme,
    ready,
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  }, [language, theme]);

  useEffect(() => {
    if (!timerAction || timerPhase === "idle") return;

    if (timerPhase === "success") {
      const completedAction = timerAction;
      const completedCount = timerMultiplier;
      const timer = window.setTimeout(() => {
        closeSecondaryModal("timer", () => {
          setTimerAction(null);
          setTimerPhase("idle");
          setTimerSecondsLeft(0);
          setTimerMultiplier(1);
          recordActionMultiple(completedAction, completedCount);
        });
      }, 1900);
      return () => window.clearTimeout(timer);
    }

    if (timerSecondsLeft > 0) {
      const timer = window.setTimeout(() => {
        setTimerSecondsLeft((current) => Math.max(0, current - 1));
      }, 1000);
      return () => window.clearTimeout(timer);
    }

    if (timerPhase === "preparing") {
      setTimerPhase("running");
      setTimerSecondsLeft(
        Math.max(1, (timerAction.timerSeconds || 1) * timerMultiplier),
      );
      if ("vibrate" in navigator) navigator.vibrate(18);
      return;
    }

    setTimerPhase("success");
    setTimerSecondsLeft(0);
    if ("vibrate" in navigator) navigator.vibrate([28, 45, 28]);
  }, [timerAction, timerMultiplier, timerPhase, timerSecondsLeft]);

  useEffect(() => {
    if (tab !== "profile") return;
    const frame = window.requestAnimationFrame(() => {
      setBankDropKey((current) => current + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

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
  const calendarRecordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      const key = localDay(new Date(record.createdAt));
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [records]);
  const selectedDayRecords = useMemo(
    () =>
      records.filter(
        (record) => localDay(new Date(record.createdAt)) === selectedCalendarDay,
      ),
    [records, selectedCalendarDay],
  );
  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return { date, key: localDay(date) };
      }),
    ];
  }, [calendarMonth]);

  function tagsFor(value: { tagIds?: string[]; areaId?: string }) {
    return normalizedTagIds(value)
      .map((id) => areas.find((area) => area.id === id))
      .filter((area): area is Area => Boolean(area));
  }

  function totalsFor(source: GrowthRecord[]) {
    return areas.map((area) => ({
      ...area,
      total: source
        .filter((record) => normalizedTagIds(record).includes(area.id))
        .reduce((sum, record) => sum + record.value, 0),
    }));
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return;
    setLoginPending(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        account?: Account;
        error?: string;
      } | null;
      if (!response.ok || !result?.account) {
        throw new Error(result?.error || "暂时无法登录");
      }
      await hydrateAccount(result.account);
      setLoginPassword("");
      closeSecondaryModal("login", () => setShowLogin(false));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "暂时无法登录");
    } finally {
      setLoginPending(false);
    }
  }

  async function logout() {
    if (account && serverHydrated) {
      await fetch("/api/account-data", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas,
          actions,
          records,
          shellBalance,
          shellsEarned,
          rewards,
          rewardClaims,
          profile: { nickname: nickname.trim() },
          preferences: { language, theme },
        }),
      }).catch(() => null);
    }
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => null);
    hydrateGuest();
    setShowLogin(false);
    setLoginPassword("");
  }

  function showToast(
    message: string,
    title = "操作完成",
    undoRecordId?: string,
  ) {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = undoRecordId ? 3600 : 2200;

    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current = [];
    setToasts([{ id, title, message, undoRecordId }]);

    const exitTimer = window.setTimeout(() => {
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
      );
    }, duration);
    const removeTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, duration + 300);
    toastTimers.current.push(exitTimer, removeTimer);
  }

  function markToastUndone(toastId: string, recordId: string) {
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current = [];
    undoRecord(recordId, false);
    setToasts((current) =>
      current.map((item) =>
        item.id === toastId
          ? {
              ...item,
              title: "已撤销",
              message: "这次成长记录已移除",
              undoRecordId: undefined,
              undone: true,
              leaving: false,
            }
          : item,
      ),
    );

    const exitTimer = window.setTimeout(() => {
      setToasts((current) =>
        current.map((item) =>
          item.id === toastId ? { ...item, leaving: true } : item,
        ),
      );
    }, 1700);
    const removeTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toastId));
    }, 1980);
    toastTimers.current.push(exitTimer, removeTimer);
  }

  function recordActionMultiple(
    action: MicroAction,
    count: number,
    source: Source = "主动记录",
  ) {
    const actionTags = tagsFor(action);
    const safeCount = Math.max(1, Math.floor(count));
    const timestamp = Date.now();
    const newRecords = Array.from({ length: safeCount }, (_, index): GrowthRecord => ({
      id: `${timestamp}-${index}-${Math.random().toString(16).slice(2)}`,
      actionId: action.id,
      actionName: action.name,
      icon: action.icon,
      tagIds: actionTags.map((tag) => tag.id),
      value: action.value,
      source,
      createdAt: new Date(timestamp + index).toISOString(),
    })).reverse();
    setRecords((current) => [...newRecords, ...current]);
    setLastCheckedAction({ id: action.id, token: Date.now() });
    setShellBalance((current) => current + safeCount);
    setShellsEarned((current) => current + safeCount);
    const growthChanges = actionTags.map(
      (tag) => `${tag.name} +${action.value * safeCount}`,
    );
    showToast(
      [...growthChanges, `栗壳 +${safeCount}`].join(" · "),
      "成长已记录",
      newRecords[0].id,
    );
  }

  function recordAction(action: MicroAction, source: Source = "主动记录") {
    recordActionMultiple(action, 1, source);
  }

  function undoRecord(recordId: string, showFeedback = true) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setShellBalance((current) => Math.max(0, current - 1));
    setShellsEarned((current) => Math.max(0, current - 1));
    if (showFeedback) showToast("刚刚的成长记录已移除", "已撤销");
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function closeSecondaryModal(id: string, close: () => void) {
    if (closingModal) return;
    setClosingModal(id);
    if (modalAnimationTimerRef.current) {
      window.clearTimeout(modalAnimationTimerRef.current);
    }
    modalAnimationTimerRef.current = window.setTimeout(() => {
      close();
      setClosingModal(null);
      setModalDrag(null);
      modalDragStartRef.current = null;
      modalDragCloseRef.current = null;
      modalAnimationTimerRef.current = null;
    }, 240);
  }

  function startModalDrag(
    id: string,
    close: () => void,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    modalDragStartRef.current = { id, y: event.clientY, time: Date.now() };
    modalDragCloseRef.current = close;
    setModalDrag({ id, offset: 0 });
  }

  function moveModalDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = modalDragStartRef.current;
    if (!start) return;
    setModalDrag({
      id: start.id,
      offset: Math.max(0, event.clientY - start.y),
    });
  }

  function finishModalDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = modalDragStartRef.current;
    if (!start) return;
    const offset = Math.max(0, event.clientY - start.y);
    const velocity = offset / Math.max(1, Date.now() - start.time);
    const close = modalDragCloseRef.current;
    modalDragStartRef.current = null;
    modalDragCloseRef.current = null;
    if (close && (offset >= 78 || velocity >= 0.55)) {
      closeSecondaryModal(start.id, close);
    } else {
      setModalDrag({ id: start.id, offset: 0 });
      window.setTimeout(() => {
        setModalDrag((current) =>
          current?.id === start.id && current.offset === 0 ? null : current,
        );
      }, 180);
    }
  }

  function cancelModalDrag() {
    modalDragStartRef.current = null;
    modalDragCloseRef.current = null;
    setModalDrag(null);
  }

  function modalMotionClass(id: string, className: string) {
    return `${className} secondary-modal-card${
      closingModal === id ? " modal-closing" : ""
    }${modalDrag?.id === id ? " modal-dragging" : ""}`;
  }

  function modalMotionStyle(id: string) {
    return {
      "--modal-drag-y": `${modalDrag?.id === id ? modalDrag.offset : 0}px`,
    } as CSSProperties;
  }

  function modalDragHandle(id: string, close: () => void) {
    return (
      <button
        className="modal-drag-handle"
        type="button"
        aria-label={tr("向下拖动关闭", "Drag down to close")}
        onPointerDown={(event) => startModalDrag(id, close, event)}
        onPointerMove={moveModalDrag}
        onPointerUp={finishModalDrag}
        onPointerCancel={cancelModalDrag}
      >
        <span aria-hidden="true" />
      </button>
    );
  }

  function openRecordActionMenu(action: MicroAction, rect: DOMRect) {
    const menuWidth = 132;
    const menuHeight = 52;
    const viewportPadding = 12;
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.left + rect.width - menuWidth),
    );
    const top = Math.max(viewportPadding, rect.top - menuHeight - 7);

    setRecordActionMenuPosition({ left, top });
    setRecordActionMenu(action);
  }

  function startActionLongPress(
    action: MicroAction,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    const actionRect = event.currentTarget.getBoundingClientRect();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressQuickClickRef.current = action.id;
      openRecordActionMenu(action, actionRect);
      if ("vibrate" in navigator) navigator.vibrate(12);
      window.setTimeout(() => {
        if (suppressQuickClickRef.current === action.id) {
          suppressQuickClickRef.current = null;
        }
      }, 700);
      longPressTimerRef.current = null;
    }, 520);
  }

  function moveActionLongPress(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = longPressStartRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      clearLongPressTimer();
      longPressStartRef.current = null;
    }
  }

  function finishActionLongPress() {
    clearLongPressTimer();
    longPressStartRef.current = null;
  }

  function handleQuickActionClick(action: MicroAction) {
    if (suppressQuickClickRef.current === action.id) {
      suppressQuickClickRef.current = null;
      return;
    }
    if (action.timerSeconds && action.timerSeconds > 0) {
      setTimerAction(action);
      setTimerPhase("idle");
      setTimerMultiplier(1);
      setTimerSecondsLeft(action.timerSeconds);
      return;
    }
    recordAction(action);
  }

  function startActionTimer() {
    if (!timerAction || timerPhase !== "idle") return;
    setTimerPhase("preparing");
    setTimerSecondsLeft(3);
  }

  function closeActionTimer() {
    if (timerPhase === "success") return;
    setTimerAction(null);
    setTimerPhase("idle");
    setTimerSecondsLeft(0);
    setTimerMultiplier(1);
  }

  function changeTimerMultiplier(delta: number) {
    if (!timerAction || timerPhase !== "idle") return;
    const nextMultiplier = Math.min(60, Math.max(1, timerMultiplier + delta));
    setTimerMultiplier(nextMultiplier);
    setTimerSecondsLeft(
      Math.max(1, (timerAction.timerSeconds || 1) * nextMultiplier),
    );
  }

  function skipActionTimer() {
    if (!timerAction || timerPhase === "success") return;
    setTimerPhase("success");
    setTimerSecondsLeft(0);
    if ("vibrate" in navigator) navigator.vibrate([28, 45, 28]);
  }

  function undoLatestActionRecord() {
    if (!recordActionMenu) return;
    const latestRecord = records.find(
      (record) =>
        record.actionId === recordActionMenu.id
        && isToday(new Date(record.createdAt)),
    );
    if (!latestRecord) {
      showToast("今天还没有这项记录", "没有可撤销内容");
      setRecordActionMenu(null);
      return;
    }
    undoRecord(latestRecord.id);
    setRecordActionMenu(null);
  }

  function requestReward(reward: Reward) {
    if (shellBalance < reward.cost) {
      showToast(`再积累 ${reward.cost - shellBalance} 枚栗壳就可以兑换`, "栗壳还不够");
      return;
    }
    setPendingReward(reward);
  }

  function redeemReward() {
    if (!pendingReward || shellBalance < pendingReward.cost) return;
    const claim: RewardClaim = {
      id: `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      rewardId: pendingReward.id,
      rewardName: pendingReward.name,
      icon: pendingReward.icon,
      cost: pendingReward.cost,
      createdAt: new Date().toISOString(),
    };
    setShellBalance((current) => Math.max(0, current - pendingReward.cost));
    setRewardClaims((current) => [claim, ...current]);
    showToast(`${pendingReward.icon} ${pendingReward.name}，现在就去享受吧`, "奖励已兑换");
    closeSecondaryModal("reward-confirm", () => setPendingReward(null));
  }

  function openRewardEditor(reward?: Reward) {
    closeSecondaryModal("reward-manager", () => {
      setShowRewardManager(false);
      setEditingReward(reward || null);
      setDraftRewardName(reward?.name || "");
      setDraftRewardDescription(reward?.description || "");
      setDraftRewardIcon(reward?.icon || "🎁");
      setDraftRewardCost(reward?.cost || 10);
      setShowRewardEditor(true);
    });
  }

  function saveReward(event: FormEvent) {
    event.preventDefault();
    if (!draftRewardName.trim()) return;
    const rewardValues = {
      name: draftRewardName.trim(),
      description: draftRewardDescription.trim(),
      icon: draftRewardIcon.trim() || "🎁",
      cost: Math.max(1, Math.round(draftRewardCost || 1)),
    };

    if (editingReward) {
      setRewards((current) =>
        current.map((reward) =>
          reward.id === editingReward.id ? { ...reward, ...rewardValues } : reward,
        ),
      );
      showToast("奖励项目已更新");
    } else {
      setRewards((current) => [
        ...current,
        { id: `reward-${Date.now()}`, ...rewardValues },
      ]);
      showToast("新的奖励已加入");
    }
    closeSecondaryModal("reward-editor", () => {
      setShowRewardEditor(false);
      setShowRewardManager(true);
    });
  }

  function deleteReward(reward: Reward) {
    if (showRewardEditor) {
      closeSecondaryModal("reward-editor", () => {
        setShowRewardEditor(false);
        setConfirmDialog({ kind: "delete-reward", reward });
      });
    } else {
      setConfirmDialog({ kind: "delete-reward", reward });
    }
  }

  function openActionEditor(action?: MicroAction) {
    closeSecondaryModal("action-manager", () => {
      setShowActionManager(false);
      setEditingAction(action || null);
      setDraftName(action?.name || "");
      setDraftIcon(action?.icon || "🌱");
      setDraftTags(action ? normalizedTagIds(action) : [areas[0]?.id || "body"]);
      setDraftValue(action?.value || 1);
      setDraftUsesTimer(Boolean(action?.timerSeconds));
      setDraftTimerSeconds(action?.timerSeconds || 5);
      setShowActionEditor(true);
    });
  }

  function closeActionEditor() {
    setShowActionEditor(false);
    setShowActionManager(true);
  }

  function toggleDraftTag(tagId: string) {
    setDraftTags((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  function saveAction(event: FormEvent) {
    event.preventDefault();
    if (!draftName.trim() || !draftTags.length) return;

    if (editingAction) {
      setActions((current) =>
        current.map((action) =>
          action.id === editingAction.id
            ? {
                ...action,
                name: draftName.trim(),
                icon: draftIcon.trim() || "🌱",
                tagIds: draftTags,
                value: Math.max(1, draftValue),
                timerSeconds: draftUsesTimer
                  ? Math.min(3600, Math.max(1, draftTimerSeconds))
                  : 0,
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
          tagIds: draftTags,
          value: Math.max(1, draftValue),
          repeatable: true,
          timerSeconds: draftUsesTimer
            ? Math.min(3600, Math.max(1, draftTimerSeconds))
            : 0,
        },
      ]);
      showToast("新的微行动已加入");
    }
    closeSecondaryModal("action-editor", closeActionEditor);
  }

  function deleteAction(action: MicroAction) {
    closeSecondaryModal("action-editor", () => {
      setShowActionEditor(false);
      setShowActionManager(true);
      setConfirmDialog({ kind: "delete-action", action });
    });
  }

  function openAreaEditor(area?: Area) {
    closeSecondaryModal("area-manager", () => {
      setShowAreaManager(false);
      setEditingArea(area || null);
      setDraftAreaName(area?.name || "");
      setDraftAreaIcon(area?.icon || "🌿");
      setDraftAreaColor(area?.color || AREA_COLORS[areas.length % AREA_COLORS.length]);
      setShowAreaEditor(true);
    });
  }

  function closeAreaEditor() {
    closeSecondaryModal("area-editor", closeAreaEditor);
  }

  function saveArea(event: FormEvent) {
    event.preventDefault();
    if (!draftAreaName.trim()) return;

    if (editingArea) {
      setAreas((current) =>
        current.map((area) =>
          area.id === editingArea.id
            ? {
                ...area,
                name: draftAreaName.trim(),
                icon: draftAreaIcon.trim() || "🌿",
                color: draftAreaColor,
              }
            : area,
        ),
      );
      showToast("成长标签已更新");
    } else {
      const area: Area = {
        id: `area-${Date.now()}`,
        name: draftAreaName.trim(),
        icon: draftAreaIcon.trim() || "🌿",
        color: draftAreaColor,
      };
      setAreas((current) => [...current, area]);
      showToast("成长标签已创建");
    }
    setShowAreaEditor(false);
    setShowAreaManager(true);
  }

  function deleteArea(area: Area) {
    if (areas.length <= 1) {
      showToast("至少保留一个成长标签", "暂时不能删除");
      return;
    }
    const blockingAction = actions.find((action) => {
      const tagIds = normalizedTagIds(action);
      return tagIds.includes(area.id) && tagIds.length === 1;
    });
    if (blockingAction) {
      showToast(`请先为“${blockingAction.name}”添加其他标签`, "暂时不能删除");
      return;
    }
    closeSecondaryModal("area-editor", () => {
      setShowAreaEditor(false);
      setShowAreaManager(true);
      setConfirmDialog({ kind: "delete-area", area });
    });
  }

  function scrollScreenToTop(selector: string) {
    window.requestAnimationFrame(() => {
      const screen = appScrollRef.current?.querySelector<HTMLElement>(selector);
      if (screen) screen.scrollTop = 0;
    });
  }

  function changeTab(nextTab: Tab) {
    setDragOffset(0);
    setIsDraggingTabs(false);
    if (nextTab === tab) return;
    setTab(nextTab);
    scrollScreenToTop(`[data-tab="${nextTab}"]`);
  }

  function openCalendar() {
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedCalendarDay(localDay(now));
    setShowCalendar(true);
    scrollScreenToTop(".calendar-screen");
  }

  function closeCalendar() {
    setShowCalendar(false);
    scrollScreenToTop(`[data-tab="${tab}"]`);
  }

  function openSettings() {
    setShowSettings(true);
    scrollScreenToTop(".settings-screen");
  }

  function closeSettings() {
    setShowSettings(false);
    scrollScreenToTop('[data-tab="profile"]');
  }

  function openProfileEditor() {
    if (!account) {
      setLoginError("");
      setShowLogin(true);
      return;
    }
    setDraftProfileNickname(nickname);
    setShowProfileEditor(true);
  }

  function closeProfileEditor() {
    closeSecondaryModal("profile-editor", () => setShowProfileEditor(false));
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    setNickname(draftProfileNickname.trim().slice(0, 16));
    closeSecondaryModal("profile-editor", () => {
      setShowProfileEditor(false);
      showToast("个人信息已更新", "保存成功");
    });
  }

  function returnToToday() {
    setShowCalendar(false);
    setShowSettings(false);
    setShowProfileEditor(false);
    setShowActionManager(false);
    setShowActionEditor(false);
    setShowAreaManager(false);
    setShowAreaEditor(false);
    setShowRewardManager(false);
    setShowRewardEditor(false);
    setConfirmDialog(null);
    setPendingReward(null);
    setRecordActionMenu(null);
    closeActionTimer();
    changeTab("today");
    scrollScreenToTop('[data-tab="today"]');
  }

  function shiftCalendarMonth(offset: number) {
    setCalendarMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      setSelectedCalendarDay(localDay(next));
      return next;
    });
  }

  function returnCalendarToToday() {
    const today = new Date();
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDay(localDay(today));
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (showCalendar || showSettings) return;
    if (event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea")) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: Date.now(),
    };
    gestureAxisRef.current = null;
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    if (!start || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - start.x;
    const deltaY = event.touches[0].clientY - start.y;
    if (!gestureAxisRef.current) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 7) return;
      gestureAxisRef.current =
        Math.abs(deltaX) > Math.abs(deltaY) * 1.08 ? "horizontal" : "vertical";
    }
    if (gestureAxisRef.current === "vertical") {
      if (recordActionMenu) setRecordActionMenu(null);
      return;
    }
    if (gestureAxisRef.current !== "horizontal") return;

    event.preventDefault();
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === tab);
    const atFirstEdge = currentIndex === 0 && deltaX > 0;
    const atLastEdge = currentIndex === NAV_ITEMS.length - 1 && deltaX < 0;
    setIsDraggingTabs(true);
    setDragOffset(atFirstEdge || atLastEdge ? deltaX * 0.24 : deltaX);
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const gestureAxis = gestureAxisRef.current;
    gestureAxisRef.current = null;
    if (!start || event.changedTouches.length !== 1 || gestureAxis !== "horizontal") {
      setIsDraggingTabs(false);
      setDragOffset(0);
      return;
    }

    const deltaX = event.changedTouches[0].clientX - start.x;
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === tab);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const velocity = Math.abs(deltaX) / Math.max(1, Date.now() - start.time);
    const shouldSwitch = Math.abs(deltaX) >= 68 || velocity >= 0.42;

    if (shouldSwitch && nextIndex >= 0 && nextIndex < NAV_ITEMS.length) {
      changeTab(NAV_ITEMS[nextIndex].id);
    } else {
      setIsDraggingTabs(false);
      setDragOffset(0);
    }
  }

  function cancelTouchGesture() {
    touchStartRef.current = null;
    gestureAxisRef.current = null;
    setIsDraggingTabs(false);
    setDragOffset(0);
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
    } else if (confirmDialog.kind === "delete-area") {
      const areaId = confirmDialog.area.id;
      setAreas((current) => current.filter((area) => area.id !== areaId));
      setActions((current) =>
        current.map((action) => ({
          ...action,
          areaId: action.areaId === areaId ? undefined : action.areaId,
          tagIds: normalizedTagIds(action).filter((tagId) => tagId !== areaId),
        })),
      );
      setRecords((current) =>
        current.map((record) => ({
          ...record,
          areaId: record.areaId === areaId ? undefined : record.areaId,
          tagIds: normalizedTagIds(record).filter((tagId) => tagId !== areaId),
        })),
      );
      showToast("成长标签已删除");
      setShowAreaManager(true);
    } else if (confirmDialog.kind === "delete-reward") {
      setRewards((current) =>
        current.filter((item) => item.id !== confirmDialog.reward.id),
      );
      if (pendingReward?.id === confirmDialog.reward.id) setPendingReward(null);
      showToast("奖励项目已删除");
      setShowRewardManager(true);
    } else {
      setAreas(DEFAULT_AREAS);
      setActions(DEFAULT_ACTIONS);
      setRewards(DEFAULT_REWARDS);
      setRecords([]);
      setShellBalance(0);
      setShellsEarned(0);
      setRewardClaims([]);
      setPendingReward(null);
      setLanguage("zh");
      setTheme("light");
      changeTab("today");
      showToast("已恢复为新的开始");
    }
    closeSecondaryModal("confirm", () => setConfirmDialog(null));
  }

  if (!authReady) {
    return (
      <main className="account-gate">
        <div className="account-loading" role="status">
          <span aria-hidden="true">栗</span>
          <p>正在打开栗子小事…</p>
        </div>
      </main>
    );
  }

  const tr = (zh: string, en: string) => (language === "zh" ? zh : en);
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const todayTotals = totalsFor(todayRecords).filter((area) => area.total > 0);
  const todayProgressTotals = totalsFor(todayRecords);
  const weekProgressTotals = totalsFor(weekRecords);
  const monthProgressTotals = totalsFor(monthRecords);
  const allTotals = totalsFor(records);
  const maxTodayAreaTotal = Math.max(1, ...todayProgressTotals.map((area) => area.total));
  const maxWeekAreaTotal = Math.max(1, ...weekProgressTotals.map((area) => area.total));
  const maxMonthAreaTotal = Math.max(1, ...monthProgressTotals.map((area) => area.total));
  const maxAreaTotal = Math.max(1, ...allTotals.map((area) => area.total));
  const nextReward = [...rewards]
    .filter((reward) => reward.cost > shellBalance)
    .sort((first, second) => first.cost - second.cost)[0];
  const shellProgress = nextReward
    ? Math.min(100, (shellBalance / nextReward.cost) * 100)
    : rewards.length
      ? 100
      : 0;
  const actionMenuTodayCount = recordActionMenu
    ? todayRecords.filter((record) => record.actionId === recordActionMenu.id).length
    : 0;
  const visibleShellCount = Math.min(12, shellBalance);
  const activeTabIndex = NAV_ITEMS.findIndex((item) => item.id === tab);
  const todayCardMilestone =
    todayRecords.length >= 20
      ? "milestone-20"
      : todayRecords.length >= 10
        ? "milestone-10"
        : "";

  return (
    <main className="shell">
      <button
        className="global-home-button"
        type="button"
        aria-label={tr("回到主页今日", "Return to Today")}
        onClick={returnToToday}
      >
        <span aria-hidden="true">⌂</span>
      </button>

      <section className="app-frame">
        <div
          className="app-scroll"
          ref={appScrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={cancelTouchGesture}
          onScrollCapture={() => {
            if (recordActionMenu) setRecordActionMenu(null);
          }}
        >
          {showCalendar && (
            <div className="screen calendar-screen">
              <section className="calendar-heading">
                <div className="calendar-heading-actions">
                  <button
                    className="calendar-back"
                    type="button"
                    aria-label="返回今日页面"
                    onClick={closeCalendar}
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    className="calendar-today-button"
                    type="button"
                    aria-label="回到今天"
                    title="回到今天"
                    onClick={returnCalendarToToday}
                  >
                    <span className="calendar-today-icon" aria-hidden="true">
                      <i />
                    </span>
                  </button>
                </div>
                <span className="overline">CALENDAR</span>
                <h1>日历记录</h1>
                <p>回看过去发生的小事，每一次都算成长。</p>
              </section>

              <section className="calendar-card">
                <div className="calendar-toolbar">
                  <button
                    type="button"
                    aria-label="上一个月"
                    onClick={() => shiftCalendarMonth(-1)}
                  >
                    ‹
                  </button>
                  <strong>
                    {new Intl.DateTimeFormat("zh-CN", {
                      year: "numeric",
                      month: "long",
                    }).format(calendarMonth)}
                  </strong>
                  <button
                    type="button"
                    aria-label="下一个月"
                    disabled={
                      calendarMonth.getFullYear() === new Date().getFullYear()
                      && calendarMonth.getMonth() === new Date().getMonth()
                    }
                    onClick={() => shiftCalendarMonth(1)}
                  >
                    ›
                  </button>
                </div>

                <div className="calendar-weekdays" aria-hidden="true">
                  {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {calendarCells.map((cell, index) =>
                    cell ? (
                      <button
                        className={`${cell.key === selectedCalendarDay ? "selected" : ""} ${
                          cell.key === localDay(new Date()) ? "today" : ""
                        } ${calendarRecordCounts.has(cell.key) ? "has-records" : ""}`}
                        type="button"
                        key={cell.key}
                        aria-label={`${new Intl.DateTimeFormat("zh-CN", {
                          month: "long",
                          day: "numeric",
                        }).format(cell.date)}，${calendarRecordCounts.get(cell.key) || 0} 条记录`}
                        onClick={() => setSelectedCalendarDay(cell.key)}
                      >
                        <span>{cell.date.getDate()}</span>
                        {calendarRecordCounts.has(cell.key) && (
                          <small>{calendarRecordCounts.get(cell.key)}</small>
                        )}
                      </button>
                    ) : (
                      <span className="calendar-empty" key={`empty-${index}`} />
                    ),
                  )}
                </div>
              </section>

              <section className="calendar-day-detail">
                <div className="section-title-row">
                  <div>
                    <span className="overline">当天记录</span>
                    <h2>
                      {new Intl.DateTimeFormat("zh-CN", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      }).format(new Date(`${selectedCalendarDay}T12:00:00`))}
                    </h2>
                  </div>
                  <small>{selectedDayRecords.length} 件小事</small>
                </div>
                {selectedDayRecords.length ? (
                  <div className="calendar-record-list">
                    {selectedDayRecords.map((record) => (
                      <article key={record.id}>
                        <span className="record-icon">{record.icon}</span>
                        <div>
                          <strong>{record.actionName}</strong>
                          <small>{formatRecordDate(record.createdAt)} · {record.source}</small>
                          <span className="action-tag-list">
                            {tagsFor(record).map((tag) => (
                              <i
                                key={tag.id}
                                style={{ color: tag.color, borderColor: `${tag.color}35` }}
                              >
                                {tag.name} +{record.value}
                              </i>
                            ))}
                            <i className="shell-gain-tag">
                              <span aria-hidden="true">🌰</span>
                              栗壳 +1
                            </i>
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <p>这一天还没有留下记录。</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {showSettings && (
            <div className="screen settings-screen">
              <section className="settings-page-heading">
                <button
                  className="settings-back"
                  type="button"
                  aria-label={tr("返回我的页面", "Back to profile")}
                  onClick={closeSettings}
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <span className="overline">SETTINGS</span>
                <h1>{tr("设置", "Settings")}</h1>
              </section>

              <section className="settings-panel">
                <div className="settings-option-copy">
                  <span className="settings-option-icon" aria-hidden="true">文</span>
                  <div>
                    <strong>{tr("界面语言", "Language")}</strong>
                  </div>
                </div>
                <div className="settings-segmented" role="group" aria-label={tr("界面语言", "Language")}>
                  <button
                    className={language === "zh" ? "selected" : ""}
                    type="button"
                    aria-pressed={language === "zh"}
                    onClick={() => setLanguage("zh")}
                  >
                    简体中文
                  </button>
                  <button
                    className={language === "en" ? "selected" : ""}
                    type="button"
                    aria-pressed={language === "en"}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                </div>
              </section>

              <section className="settings-panel">
                <div className="settings-option-copy">
                  <span className="settings-option-icon" aria-hidden="true">◐</span>
                  <div>
                    <strong>{tr("外观模式", "Appearance")}</strong>
                  </div>
                </div>
                <div className="theme-choice-grid" role="group" aria-label={tr("外观模式", "Appearance")}>
                  <button
                    className={theme === "light" ? "selected" : ""}
                    type="button"
                    aria-pressed={theme === "light"}
                    onClick={() => setTheme("light")}
                  >
                    <span aria-hidden="true">☀</span>
                    <strong>{tr("日间", "Light")}</strong>
                    <small>{tr("温暖明亮", "Warm and bright")}</small>
                  </button>
                  <button
                    className={theme === "dark" ? "selected" : ""}
                    type="button"
                    aria-pressed={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  >
                    <span aria-hidden="true">☾</span>
                    <strong>{tr("夜间", "Dark")}</strong>
                    <small>{tr("柔和低亮", "Soft and dim")}</small>
                  </button>
                </div>
              </section>

              <div className="settings-sync-note">
                <span aria-hidden="true">✓</span>
                <p>
                  {account
                    ? tr("设置会自动保存到当前账号。", "Settings are saved to your account automatically.")
                    : tr("设置与记录会保存在当前设备。", "Settings and records are saved on this device.")}
                </p>
              </div>
            </div>
          )}

          {!showCalendar && !showSettings && (
            <div className="tab-viewport">
              <div
                className={`tab-track ${isDraggingTabs ? "dragging" : ""}`}
                style={{
                  transform: `translate3d(calc(${-activeTabIndex * 100}% + ${dragOffset}px), 0, 0)`,
                }}
              >
            <div className="screen tab-screen" data-tab="today" aria-hidden={tab !== "today"}>
              <section className="welcome">
                <div className="welcome-meta">
                  <button
                    className="date-display"
                    type="button"
                    aria-label={`${tr("打开日历", "Open calendar")}，${new Intl.DateTimeFormat(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    }).format(new Date())}`}
                    onClick={openCalendar}
                  >
                    <strong>
                      {new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(new Date())}
                    </strong>
                    <span>
                      <b>
                        {new Intl.DateTimeFormat(locale, {
                          year: "numeric",
                          month: "long",
                        }).format(new Date())}
                      </b>
                      <small>
                        {new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date())}
                      </small>
                    </span>
                    <i className="date-display-chevron" aria-hidden="true">›</i>
                  </button>
                  <span
                    className={`day-phase-icon ${
                      new Date().getHours() >= 6 && new Date().getHours() < 18 ? "day" : "night"
                    }`}
                    role="img"
                    aria-label={tr(
                      new Date().getHours() >= 6 && new Date().getHours() < 18 ? "白天" : "夜晚",
                      new Date().getHours() >= 6 && new Date().getHours() < 18 ? "Daytime" : "Night",
                    )}
                  >
                    {new Date().getHours() >= 6 && new Date().getHours() < 18 ? "☀️" : "🌙"}
                  </span>
                </div>
                <h1>
                  {greeting(language)}
                  {account && nickname.trim()
                    ? `${language === "zh" ? "，" : ", "}${nickname.trim()}`
                    : ""}
                </h1>
              </section>

              <section className={`today-card ${todayCardMilestone}`}>
                <span className="today-milestone-stars" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                  <b />
                  <b />
                  <b />
                </span>
                <div className="today-card-copy">
                  <span>{tr("今日成长", "TODAY")}</span>
                  <strong>{todayRecords.length}</strong>
                  <small>{tr("次微小行动", "small actions")}</small>
                </div>
                <div className="today-orbit">
                  {orbitRippleKey > 0 && (
                    <span className="orbit-ripple" key={orbitRippleKey} aria-hidden="true">
                      <b />
                      <b />
                      <b />
                    </span>
                  )}
                  <button
                    className="orbit-core"
                    type="button"
                    aria-label={tr("点击栗子，播放涟漪", "Tap the chestnut for a ripple")}
                    onClick={() => setOrbitRippleKey((current) => current + 1)}
                  >
                    🌰
                  </button>
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                </div>
                <div className="today-domains">
                  {todayTotals.length ? (
                    todayTotals.map((area) => (
                      <span key={area.id}>
                        {area.icon} {area.name} +{area.total}
                      </span>
                    ))
                  ) : (
                    <span className="quiet">{tr("今天的成长从第一颗栗子开始", "Today starts with one small action")}</span>
                  )}
                </div>
              </section>

              <section className="content-section today-actions-section">
                <div className="quick-grid">
                  {actions.slice(0, 6).map((action) => {
                    const actionTags = tagsFor(action);
                    const primaryTag = actionTags[0] || areas[0];
                    const todayCount = todayRecords.filter(
                      (record) => record.actionId === action.id,
                    ).length;
                    const justChecked = lastCheckedAction?.id === action.id;
                    return (
                      <button
                        className={`quick-action ${todayCount ? "completed" : ""}`}
                        type="button"
                        key={action.id}
                        aria-label={`记录${action.name}，今天已记录 ${todayCount} 次，可重复记录`}
                        onClick={() => handleQuickActionClick(action)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          openRecordActionMenu(
                            action,
                            event.currentTarget.getBoundingClientRect(),
                          );
                        }}
                        onPointerDown={(event) => startActionLongPress(action, event)}
                        onPointerMove={moveActionLongPress}
                        onPointerUp={finishActionLongPress}
                        onPointerCancel={finishActionLongPress}
                        onPointerLeave={finishActionLongPress}
                      >
                        <span className="action-icon" style={{ background: `${primaryTag.color}18` }}>
                          {action.icon}
                        </span>
                        <strong>{action.name}</strong>
                        {action.timerSeconds && (
                          <span className="action-timer-badge" aria-hidden="true">
                            ◷ {action.timerSeconds}s
                          </span>
                        )}
                        <span
                          className={`check-control ${todayCount ? "checked" : ""} ${
                            justChecked ? "just-checked" : ""
                          }`}
                          key={
                            justChecked
                              ? `${action.id}-${lastCheckedAction.token}`
                              : `${action.id}-idle`
                          }
                          aria-hidden="true"
                        >
                          <i>✓</i>
                          {todayCount > 1 && <small>×{todayCount}</small>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="screen tab-screen" data-tab="growth" aria-hidden={tab !== "growth"}>
              <section className="page-heading growth-page-heading">
                <button
                  className="date-display"
                  type="button"
                  aria-label={`${tr("打开日历", "Open calendar")}，${new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  }).format(new Date())}`}
                  onClick={openCalendar}
                >
                  <strong>
                    {new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(new Date())}
                  </strong>
                  <span>
                    <b>
                      {new Intl.DateTimeFormat(locale, {
                        year: "numeric",
                        month: "long",
                      }).format(new Date())}
                    </b>
                    <small>
                      {new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date())}
                    </small>
                  </span>
                  <i className="date-display-chevron" aria-hidden="true">›</i>
                </button>
                <span className="overline">GROWTH OVERVIEW</span>
                <h1>{tr("成长正在发生", "Growth in progress")}</h1>
              </section>

              <div className="stat-grid">
                <article>
                  <span>{tr("全部记录", "All records")}</span>
                  <strong>{records.length}</strong>
                  <small>{tr("次成长", "moments")}</small>
                </article>
                <article>
                  <span>{tr("本周", "This week")}</span>
                  <strong>{weekRecords.length}</strong>
                  <small>{tr("次行动", "actions")}</small>
                </article>
                <article>
                  <span>{tr("本月", "This month")}</span>
                  <strong>{monthRecords.length}</strong>
                  <small>{tr("次行动", "actions")}</small>
                </article>
              </div>

              <section className="content-section growth-section">
                <div className="growth-divider" aria-hidden="true" />
                <div className="growth-progress-group today-progress-group">
                  <div className="growth-progress-heading">
                    <h2>{tr("今日进度", "Today's progress")}</h2>
                    <small>{todayRecords.length} {tr("件小事", "actions")}</small>
                  </div>
                  <div className="growth-areas">
                    {todayProgressTotals.map((area) => (
                      <article className="growth-area" key={`today-${area.id}`}>
                        <span className="growth-area-icon" style={{ background: `${area.color}18` }}>
                          {area.icon}
                        </span>
                        <div>
                          <strong>{area.name}</strong>
                          <span className="progress-track">
                            <i
                              style={{
                                width: `${Math.max(area.total ? 12 : 0, (area.total / maxTodayAreaTotal) * 100)}%`,
                                background: area.color,
                              }}
                            />
                          </span>
                        </div>
                        <strong className="area-total">{area.total}</strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="growth-progress-group week-progress-group">
                  <div className="growth-progress-heading">
                    <h2>{tr("本周进度", "This week's progress")}</h2>
                    <small>{weekRecords.length} {tr("件小事", "actions")}</small>
                  </div>
                  <div className="growth-areas">
                    {weekProgressTotals.map((area) => (
                      <article className="growth-area" key={`week-${area.id}`}>
                        <span className="growth-area-icon" style={{ background: `${area.color}18` }}>
                          {area.icon}
                        </span>
                        <div>
                          <strong>{area.name}</strong>
                          <span className="progress-track">
                            <i
                              style={{
                                width: `${Math.max(area.total ? 12 : 0, (area.total / maxWeekAreaTotal) * 100)}%`,
                                background: area.color,
                              }}
                            />
                          </span>
                        </div>
                        <strong className="area-total">{area.total}</strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="growth-progress-group month-progress-group">
                  <div className="growth-progress-heading">
                    <h2>{tr("本月进度", "This month's progress")}</h2>
                    <small>{monthRecords.length} {tr("件小事", "actions")}</small>
                  </div>
                  <div className="growth-areas">
                    {monthProgressTotals.map((area) => (
                      <article className="growth-area" key={`month-${area.id}`}>
                        <span className="growth-area-icon" style={{ background: `${area.color}18` }}>
                          {area.icon}
                        </span>
                        <div>
                          <strong>{area.name}</strong>
                          <span className="progress-track">
                            <i
                              style={{
                                width: `${Math.max(area.total ? 12 : 0, (area.total / maxMonthAreaTotal) * 100)}%`,
                                background: area.color,
                              }}
                            />
                          </span>
                        </div>
                        <strong className="area-total">{area.total}</strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="growth-progress-group total-progress-group">
                  <div className="growth-progress-heading">
                    <h2>{tr("总进度", "Total progress")}</h2>
                    <small>{records.length} {tr("次成长", "moments")}</small>
                  </div>
                  <div className="growth-areas">
                    {allTotals.map((area) => (
                      <article className="growth-area" key={`total-${area.id}`}>
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
                </div>
              </section>

              <section className="content-section timeline-section">
                <div className="growth-divider" aria-hidden="true" />
                {records.length ? (
                  <div className="timeline">
                    {records.slice(0, 12).map((record) => {
                      const recordTags = tagsFor(record);
                      const primaryTag = recordTags[0] || areas[0];
                      return (
                        <article key={record.id}>
                          <i style={{ background: primaryTag.color }} />
                          <div>
                            <small>{formatRecordDate(record.createdAt)}</small>
                            <strong>{record.icon} {record.actionName}</strong>
                            <span className="timeline-tags">
                              {recordTags.map((tag) => (
                                <i key={tag.id} style={{ color: tag.color }}>
                                  {tag.name} +{record.value}
                                </i>
                              ))}
                            </span>
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

            <div className="screen tab-screen" data-tab="profile" aria-hidden={tab !== "profile"}>
              <section className="page-heading profile-page-heading">
                <span className="overline">MY SPACE</span>
                <div className="profile-heading-row">
                  <h1>{tr("我的栗子", "My Chestnuts")}</h1>
                  <button
                    className="settings-entry-button"
                    type="button"
                    aria-label={tr("打开设置", "Open settings")}
                    onClick={openSettings}
                  >
                    <span className="settings-sliders-icon" aria-hidden="true">
                      <i><b /></i>
                      <i><b /></i>
                      <i><b /></i>
                    </span>
                  </button>
                </div>
              </section>

              <section className="account-strip" aria-label={tr("账号状态", "Account status")}>
                <button
                  className="account-avatar-button"
                  type="button"
                  aria-label={
                    account
                      ? tr("编辑个人信息", "Edit profile")
                      : tr("登录账号", "Sign in")
                  }
                  onClick={openProfileEditor}
                >
                  <span aria-hidden="true">栗</span>
                </button>
                <div>
                  <small>{tr("账号状态", "Account status")}</small>
                  <strong>
                    {account?.username || tr("未登录", "Not signed in")}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (account) {
                      void logout();
                    } else {
                      setLoginError("");
                      setShowLogin(true);
                    }
                  }}
                >
                  {account ? tr("退出登录", "Sign out") : tr("登录", "Sign in")}
                </button>
              </section>

              <section className="shell-bank" aria-labelledby="shell-bank-title">
                <div className="shell-bank-top">
                  <div className="shell-jar" aria-hidden="true">
                    <span className="jar-lid" />
                    <span className="jar-glass">
                      {visibleShellCount === 0 && <small>等待第一枚</small>}
                      {Array.from({ length: visibleShellCount }, (_, index) => {
                        const isNewest = index === visibleShellCount - 1;
                        return (
                          <i
                            className={isNewest ? "falling-shell" : ""}
                            key={
                              isNewest
                                ? `newest-shell-${bankDropKey}`
                                : `settled-shell-${index}`
                            }
                          >
                            栗
                          </i>
                        );
                      })}
                    </span>
                  </div>
                  <div className="shell-balance">
                    <span className="overline">栗壳储蓄罐</span>
                    <h2 id="shell-bank-title">
                      <strong>{shellBalance}</strong>
                      <small>枚栗壳</small>
                    </h2>
                  </div>
                </div>

                <div className="shell-progress-copy">
                  <span>
                    {nextReward
                      ? `距离“${nextReward.name}”还差 ${nextReward.cost - shellBalance} 枚`
                      : rewards.length
                        ? "所有奖励档位都已解锁"
                        : "添加一个想送给自己的奖励"}
                  </span>
                  <small>累计获得 {shellsEarned} 枚</small>
                </div>
                <span
                  className="shell-progress-track"
                  role="progressbar"
                  aria-label={
                    nextReward
                      ? `下一档奖励进度：${Math.round(shellProgress)}%`
                      : rewards.length
                        ? "全部奖励已解锁"
                        : "尚未设置奖励"
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(shellProgress)}
                >
                  <i style={{ width: `${shellProgress}%` }} />
                </span>
              </section>

              <section className="reward-section">
                <div className="section-title-row reward-section-heading">
                  <div>
                    <span className="overline">给自己的奖励</span>
                    <h2>把积累换成一点开心</h2>
                  </div>
                  <button type="button" onClick={() => setShowRewardManager(true)}>奖励管理</button>
                </div>

                {rewards.length ? (
                  <div className="reward-grid">
                  {rewards.map((reward) => {
                    const available = shellBalance >= reward.cost;
                    return (
                      <article className={available ? "available" : ""} key={reward.id}>
                        <span className="reward-icon" aria-hidden="true">{reward.icon}</span>
                        <div>
                          <strong>{reward.name}</strong>
                          {reward.description && <p>{reward.description}</p>}
                        </div>
                        <div className="reward-card-controls">
                          <button
                            type="button"
                            className={`reward-redeem-button ${available ? "ready" : ""}`}
                            onClick={() => requestReward(reward)}
                          >
                            {available ? `${reward.cost} 栗壳 · 兑换` : `还差 ${reward.cost - shellBalance}`}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  </div>
                ) : (
                  <button
                    className="reward-empty"
                    type="button"
                    onClick={() => setShowRewardManager(true)}
                  >
                    <span aria-hidden="true">＋</span>
                    <strong>添加第一个奖励</strong>
                    <small>写下你想用栗壳换取的小开心</small>
                  </button>
                )}

                {rewardClaims.length > 0 && (
                  <details className="reward-history">
                    <summary>
                      <span>最近兑换</span>
                      <span aria-hidden="true">⌄</span>
                    </summary>
                    <div>
                      {rewardClaims.slice(0, 5).map((claim) => (
                        <article key={claim.id}>
                          <span>{claim.icon}</span>
                          <strong>{claim.rewardName}</strong>
                          <small>{formatRecordDate(claim.createdAt)} · −{claim.cost} 栗壳</small>
                        </article>
                      ))}
                    </div>
                  </details>
                )}
              </section>

              <section className="settings-block profile-actions">
                <div className="settings-heading">
                  <div>
                    <span className="overline">行动管理</span>
                    <h2>我的微行动</h2>
                  </div>
                  <button type="button" onClick={() => setShowActionManager(true)}>编辑</button>
                </div>

                <div className="tag-action-grid">
                  {actions.map((action) => {
                    const actionTags = tagsFor(action);
                    return (
                      <article className="tag-action-card" key={action.id}>
                        <div className="tag-action-summary">
                          <span className="tag-action-icon">{action.icon}</span>
                          <strong>{action.name}</strong>
                          <span className="action-tag-list">
                            {actionTags.map((tag) => (
                              <small
                                key={tag.id}
                                style={{ color: tag.color, borderColor: `${tag.color}35` }}
                              >
                                {tag.name} +{action.value}
                              </small>
                            ))}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="settings-block">
                <div className="settings-heading">
                  <div>
                    <span className="overline">成长标签</span>
                    <h2>我的标签</h2>
                  </div>
                  <button type="button" onClick={() => setShowAreaManager(true)}>编辑</button>
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
                      <strong>关于栗子小事</strong>
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
              </div>
            </div>
          )}
        </div>

        {!showCalendar && !showSettings && <nav className="bottom-nav" aria-label={tr("主要导航", "Main navigation")}>
          {NAV_ITEMS.map((item) => (
            <button
              className={`${tab === item.id ? "active" : ""} ${
                item.id === "today" ? "primary-tab" : ""
              }`}
              type="button"
              key={item.id}
              onClick={() => changeTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {language === "zh"
                ? item.label
                : item.id === "today"
                  ? "Today"
                  : item.id === "growth"
                    ? "Growth"
                    : "Me"}
            </button>
          ))}
        </nav>}
      </section>

      {toasts.length > 0 && (
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div className={`toast ${toast.leaving ? "leaving" : ""}`} role="status" key={toast.id}>
              <span
                className={`toast-check ${toast.undone ? "undone" : ""}`}
                aria-hidden="true"
              >
                {toast.undone ? "↶" : "✓"}
              </span>
              <span className="toast-copy">
                <strong>{toast.title}</strong>
                <small>{toast.message}</small>
              </span>
              {toast.undoRecordId && (
                <button
                  className="toast-undo"
                  type="button"
                  onClick={() => markToastUndone(toast.id, toast.undoRecordId!)}
                >
                  撤销
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showProfileEditor && account && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeProfileEditor}
        >
          <form
            className={modalMotionClass(
              "profile-editor",
              "bottom-sheet profile-editor",
            )}
            style={modalMotionStyle("profile-editor")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-editor-title"
            onSubmit={saveProfile}
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("profile-editor", () => setShowProfileEditor(false))}
            <button
              className="close-button"
              type="button"
              aria-label={tr("关闭个人信息", "Close profile")}
              onClick={closeProfileEditor}
            >
              ×
            </button>
            <span className="overline">{tr("个人资料", "PROFILE")}</span>
            <h2 id="profile-editor-title">{tr("编辑个人信息", "Edit profile")}</h2>
            <div className="profile-editor-account">
              <span aria-hidden="true">栗</span>
              <div>
                <small>{tr("账号", "Account")}</small>
                <strong>{account.username}</strong>
              </div>
            </div>
            <label>
              {tr("昵称", "Nickname")}
              <input
                value={draftProfileNickname}
                maxLength={16}
                autoComplete="nickname"
                placeholder={tr("例如：小栗", "For example: Lizi")}
                onChange={(event) => setDraftProfileNickname(event.target.value)}
                autoFocus
              />
            </label>
            <button className="save-button" type="submit">
              {tr("保存", "Save")}
            </button>
          </form>
        </div>
      )}

      {showActionManager && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("action-manager", () => setShowActionManager(false))}
        >
          <section
            className={modalMotionClass("action-manager", "bottom-sheet action-manager")}
            style={modalMotionStyle("action-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("action-manager", () => setShowActionManager(false))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("action-manager", () => setShowActionManager(false))}
            >
              ×
            </button>
            <span className="overline">行动管理</span>
            <h2 id="action-manager-title">微行动管理</h2>
            <button
              className="action-manager-create"
              type="button"
              onClick={() => openActionEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建微行动</strong>
                <small>添加一件想记录的小事</small>
              </div>
            </button>
            <div className="action-manager-list">
              {actions.map((action) => {
                const actionTags = tagsFor(action);
                return (
                  <button
                    type="button"
                    key={action.id}
                    aria-label={`修改${action.name}`}
                    onClick={() => openActionEditor(action)}
                  >
                    <span aria-hidden="true">{action.icon}</span>
                    <div>
                      <strong>{action.name}</strong>
                      <small>
                        {actionTags.map((tag) => tag.name).join(" · ")}
                        {action.timerSeconds ? ` · 计时 ${action.timerSeconds} 秒` : ""}
                      </small>
                    </div>
                    <i aria-hidden="true">›</i>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showActionEditor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("action-editor", closeActionEditor)}
        >
          <form
            className={modalMotionClass("action-editor", "bottom-sheet action-editor")}
            style={modalMotionStyle("action-editor")}
            onSubmit={saveAction}
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("action-editor", closeActionEditor)}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("action-editor", closeActionEditor)}
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
            <IconPicker
              label="选择图标"
              value={draftIcon}
              options={ACTION_ICON_OPTIONS}
              onChange={setDraftIcon}
            />
            <div className="timer-editor-setting">
              <button
                className={draftUsesTimer ? "enabled" : ""}
                type="button"
                role="switch"
                aria-checked={draftUsesTimer}
                onClick={() => setDraftUsesTimer((current) => !current)}
              >
                <span aria-hidden="true">◷</span>
                <div>
                  <strong>完成前先倒计时</strong>
                  <small>开始前会有 3 秒准备时间</small>
                </div>
                <i aria-hidden="true"><b /></i>
              </button>
              {draftUsesTimer && (
                <label>
                  计时时长（秒）
                  <input
                    type="number"
                    min="1"
                    max="3600"
                    inputMode="numeric"
                    value={draftTimerSeconds}
                    onChange={(event) => setDraftTimerSeconds(Number(event.target.value))}
                  />
                </label>
              )}
            </div>
            <fieldset className="tag-fieldset">
              <legend>成长标签 <small>可多选</small></legend>
              <div className="tag-picker">
                {areas.map((area) => {
                  const selected = draftTags.includes(area.id);
                  return (
                    <button
                      className={selected ? "selected" : ""}
                      type="button"
                      key={area.id}
                      aria-pressed={selected}
                      style={selected ? { borderColor: area.color, color: area.color } : undefined}
                      onClick={() => toggleDraftTag(area.id)}
                    >
                      {area.icon} {area.name}
                      <span>{selected ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
              {!draftTags.length && <small className="field-hint">至少选择一个成长标签</small>}
            </fieldset>
            <button
              className="save-button"
              type="submit"
              disabled={!draftName.trim() || !draftTags.length}
            >
              {editingAction ? "保存修改" : "加入我的微行动"}
            </button>
            {editingAction && (
              <button
                className="delete-action-button"
                type="button"
                onClick={() => deleteAction(editingAction)}
              >
                删除这个微行动
              </button>
            )}
          </form>
        </div>
      )}

      {showAreaManager && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("area-manager", () => setShowAreaManager(false))}
        >
          <section
            className={modalMotionClass("area-manager", "bottom-sheet action-manager area-manager")}
            style={modalMotionStyle("area-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("area-manager", () => setShowAreaManager(false))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("area-manager", () => setShowAreaManager(false))}
            >
              ×
            </button>
            <span className="overline">成长标签</span>
            <h2 id="area-manager-title">标签管理</h2>
            <button
              className="action-manager-create"
              type="button"
              onClick={() => openAreaEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建标签</strong>
                <small>添加一个新的成长方向</small>
              </div>
            </button>
            <div className="action-manager-list">
              {areas.map((area) => (
                <button
                  type="button"
                  key={area.id}
                  aria-label={`修改${area.name}`}
                  onClick={() => openAreaEditor(area)}
                >
                  <span
                    aria-hidden="true"
                    style={{ color: area.color, background: `${area.color}18` }}
                  >
                    {area.icon}
                  </span>
                  <div>
                    <strong>{area.name}</strong>
                    <small>
                      {actions.filter((action) => normalizedTagIds(action).includes(area.id)).length}
                      {" "}个微行动使用
                    </small>
                  </div>
                  <i aria-hidden="true">›</i>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showAreaEditor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("area-editor", closeAreaEditor)}
        >
          <form
            className={modalMotionClass("area-editor", "bottom-sheet area-editor")}
            style={modalMotionStyle("area-editor")}
            onSubmit={saveArea}
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("area-editor", closeAreaEditor)}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("area-editor", closeAreaEditor)}
            >
              ×
            </button>
            <span className="overline">{editingArea ? "编辑成长标签" : "新的成长标签"}</span>
            <h2>{editingArea ? "调整这个成长方向" : "你还想积累什么？"}</h2>
            <p className="sheet-description">
              {editingArea
                ? "修改后，所有关联微行动和历史记录会同步显示新名称。"
                : "创建一个标签，再把它贴到一个或多个微行动上。"}
            </p>
            <label>
              标签名称
              <input
                value={draftAreaName}
                onChange={(event) => setDraftAreaName(event.target.value)}
                placeholder="例如：关系"
                autoFocus
              />
            </label>
            <IconPicker
              label="选择图标"
              value={draftAreaIcon}
              options={AREA_ICON_OPTIONS}
              onChange={setDraftAreaIcon}
            />
            <fieldset className="area-color-fieldset">
              <legend>标签颜色</legend>
              <div>
                {AREA_COLORS.map((color) => (
                  <button
                    className={draftAreaColor === color ? "selected" : ""}
                    type="button"
                    key={color}
                    aria-label={`选择颜色 ${color}`}
                    aria-pressed={draftAreaColor === color}
                    style={{ background: color }}
                    onClick={() => setDraftAreaColor(color)}
                  >
                    {draftAreaColor === color && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="save-button" type="submit">
              {editingArea ? "保存标签修改" : "添加成长标签"}
            </button>
            {editingArea && (
              <button
                className="delete-area-button"
                type="button"
                onClick={() => deleteArea(editingArea)}
              >
                删除这个标签
              </button>
            )}
          </form>
        </div>
      )}

      {showRewardEditor && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("reward-editor", () => setShowRewardEditor(false))}
        >
          <form
            className={modalMotionClass("reward-editor", "bottom-sheet reward-editor")}
            style={modalMotionStyle("reward-editor")}
            onSubmit={saveReward}
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("reward-editor", () => setShowRewardEditor(false))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("reward-editor", () => setShowRewardEditor(false))}
            >
              ×
            </button>
            <span className="overline">{editingReward ? "编辑奖励" : "新的奖励"}</span>
            <h2>{editingReward ? "调整这份小期待" : "想把栗壳换成什么？"}</h2>
            <label>
              奖励名称
              <input
                value={draftRewardName}
                onChange={(event) => setDraftRewardName(event.target.value)}
                placeholder="例如：看一场电影"
                autoFocus
              />
            </label>
            <IconPicker
              label="选择图标"
              value={draftRewardIcon}
              options={REWARD_ICON_OPTIONS}
              onChange={setDraftRewardIcon}
            />
            <label>
              简短说明
              <input
                value={draftRewardDescription}
                onChange={(event) => setDraftRewardDescription(event.target.value)}
                placeholder="例如：留一个晚上给喜欢的故事"
                maxLength={48}
              />
            </label>
            <label>
              所需栗壳
              <input
                type="number"
                min="1"
                max="9999"
                value={draftRewardCost}
                onChange={(event) => setDraftRewardCost(Number(event.target.value))}
              />
            </label>
            <button
              className="save-button"
              type="submit"
              disabled={!draftRewardName.trim() || draftRewardCost < 1}
            >
              {editingReward ? "保存奖励" : "加入奖励清单"}
            </button>
            {editingReward && (
              <button
                className="delete-reward-button"
                type="button"
                onClick={() => deleteReward(editingReward)}
              >
                删除这个奖励
              </button>
            )}
          </form>
        </div>
      )}

      {showRewardManager && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("reward-manager", () => setShowRewardManager(false))}
        >
          <section
            className={modalMotionClass("reward-manager", "bottom-sheet reward-manager")}
            style={modalMotionStyle("reward-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("reward-manager", () => setShowRewardManager(false))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("reward-manager", () => setShowRewardManager(false))}
            >
              ×
            </button>
            <span className="overline">给自己的奖励</span>
            <h2 id="reward-manager-title">奖励管理</h2>
            <button
              className="reward-manager-create"
              type="button"
              onClick={() => openRewardEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建奖励</strong>
                <small>添加一个新的栗壳目标</small>
              </div>
            </button>
            <div className="reward-manager-list">
              {rewards.map((reward) => (
                <div className="reward-manager-item" key={reward.id}>
                  <button
                    className="reward-manager-edit"
                    type="button"
                    aria-label={`修改${reward.name}`}
                    onClick={() => openRewardEditor(reward)}
                  >
                    <span aria-hidden="true">{reward.icon}</span>
                    <div>
                      <strong>{reward.name}</strong>
                      <small>{reward.cost} 栗壳{reward.description ? ` · ${reward.description}` : ""}</small>
                    </div>
                    <i aria-hidden="true">›</i>
                  </button>
                  <button
                    className="reward-manager-delete"
                    type="button"
                    aria-label={`删除${reward.name}`}
                    onClick={() => deleteReward(reward)}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {showLogin && (
        <div
          className="account-gate login-modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("login", () => setShowLogin(false))}
        >
          <form
            className={modalMotionClass("login", "login-card")}
            style={modalMotionStyle("login")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            onSubmit={handleLogin}
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("login", () => setShowLogin(false))}
            <button
              className="close-button"
              type="button"
              aria-label={tr("关闭登录", "Close sign in")}
              onClick={() => closeSecondaryModal("login", () => setShowLogin(false))}
            >
              ×
            </button>
            <div className="login-brand">
              <span aria-hidden="true">栗</span>
              <div>
                <strong>{tr("栗子小事", "Little Chestnut")}</strong>
                <small>{tr("登录后，继续积累自己的小事", "Sign in to continue your progress")}</small>
              </div>
            </div>
            <div className="login-heading">
              <span className="overline">WELCOME BACK</span>
              <h1 id="login-title">{tr("欢迎回来", "Welcome back")}</h1>
            </div>
            <label>
              {tr("账号", "Account")}
              <input
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                autoComplete="username"
                inputMode="numeric"
                placeholder={tr("请输入账号", "Enter account")}
                autoFocus
              />
            </label>
            <label>
              {tr("密码", "Password")}
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                placeholder={tr("请输入密码", "Enter password")}
              />
            </label>
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            <button
              className="login-button"
              type="submit"
              disabled={loginPending || !loginUsername.trim() || !loginPassword}
            >
              {loginPending ? tr("正在登录…", "Signing in…") : tr("登录", "Sign in")}
            </button>
            <small className="login-note">
              {tr("账号数据将独立保存并同步。", "Account data is saved and synced separately.")}
            </small>
          </form>
        </div>
      )}

      {timerAction && (
        <div
          className="modal-backdrop timer-backdrop"
          role="presentation"
          onClick={
            timerPhase === "success"
              ? undefined
              : () => closeSecondaryModal("timer", closeActionTimer)
          }
        >
          <section
            className={modalMotionClass(
              "timer",
              `bottom-sheet timer-sheet ${timerPhase === "success" ? "timer-succeeded" : ""}`,
            )}
            style={modalMotionStyle("timer")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="timer-title"
            aria-describedby="timer-description"
            onClick={(event) => event.stopPropagation()}
          >
            {timerPhase !== "success" && modalDragHandle("timer", closeActionTimer)}
            {timerPhase !== "success" && (
              <button
                className="close-button"
                type="button"
                aria-label={tr("关闭计时", "Close timer")}
                onClick={() => closeSecondaryModal("timer", closeActionTimer)}
              >
                ×
              </button>
            )}
            <span className="overline">
              {timerPhase === "success"
                ? tr("完成", "COMPLETE")
                : timerPhase === "preparing"
                ? tr("准备一下", "GET READY")
                : timerPhase === "running"
                  ? tr("正在计时", "IN PROGRESS")
                  : tr("计时小事", "TIMED ACTION")}
            </span>
            <div
              className={`timer-clock ${timerPhase}`}
              style={{
                background:
                  timerPhase === "success"
                    ? "conic-gradient(#6f9466 360deg, rgba(111, 148, 102, .12) 0deg)"
                    : `conic-gradient(var(--chestnut) ${
                        timerPhase === "preparing"
                          ? (timerSecondsLeft / 3) * 360
                          : (
                              timerSecondsLeft
                              / Math.max(
                                1,
                                (timerAction.timerSeconds || 1) * timerMultiplier,
                              )
                            ) * 360
                      }deg, rgba(111, 59, 39, .1) 0deg)`,
              }}
            >
              {timerPhase === "success" && (
                <span className="timer-success-burst" aria-hidden="true">
                  <b /><b /><b /><b /><b /><b />
                </span>
              )}
              <div>
                {timerPhase === "success" ? (
                  <span className="timer-success-check" aria-hidden="true">✓</span>
                ) : (
                  <>
                    <span aria-hidden="true">
                      {timerPhase === "preparing" ? "●" : timerAction.icon}
                    </span>
                    <strong>{timerSecondsLeft}</strong>
                    <small>{tr("秒", "sec")}</small>
                  </>
                )}
              </div>
            </div>
            <h2 id="timer-title">
              {timerPhase === "success" ? tr("打卡成功", "Check-in complete") : timerAction.name}
            </h2>
            <p id="timer-description" aria-live="polite">
              {timerPhase === "success"
                ? tr(
                    `${timerAction.name}已完成 ${timerMultiplier} 次，成长正在记录`,
                    `${timerAction.name} is complete ×${timerMultiplier} and being recorded`,
                  )
                : timerPhase === "preparing"
                ? tr("保持准备，计时马上开始", "Get ready — the timer is about to start")
                : timerPhase === "running"
                  ? tr(
                      `保持住，结束后会自动打卡 ${timerMultiplier} 次`,
                      `Keep going — completion will check in ×${timerMultiplier}`,
                    )
                  : tr("点击开始，3 秒准备后进入倒计时", "Start for a 3-second preparation, then the countdown begins")}
            </p>
            {timerPhase === "idle" && (
              <div className="timer-duration-picker">
                <span>{tr("选择时长", "Duration")}</span>
                <div>
                  <button
                    type="button"
                    aria-label={tr("减少一档时长", "Decrease duration")}
                    disabled={timerMultiplier === 1}
                    onClick={() => changeTimerMultiplier(-1)}
                  >
                    −
                  </button>
                  <strong>
                    <b>{(timerAction.timerSeconds || 1) * timerMultiplier}</b>
                    <small>{tr("秒", " sec")}</small>
                    <em>× {timerMultiplier} {tr("次", "check-ins")}</em>
                  </strong>
                  <button
                    type="button"
                    aria-label={tr("增加一档时长", "Increase duration")}
                    disabled={timerMultiplier === 60}
                    onClick={() => changeTimerMultiplier(1)}
                  >
                    +
                  </button>
                </div>
                <small>
                  {tr(
                    `每档增加 ${timerAction.timerSeconds || 1} 秒，完成后按倍数记录`,
                    `Each step adds ${timerAction.timerSeconds || 1} seconds and one check-in`,
                  )}
                </small>
              </div>
            )}
            {timerPhase === "idle" ? (
              <div className="dialog-actions">
                <button
                  className="dialog-button secondary"
                  type="button"
                  onClick={() => closeSecondaryModal("timer", closeActionTimer)}
                >
                  {tr("取消", "Cancel")}
                </button>
                <button className="dialog-button timer-start-button" type="button" onClick={startActionTimer}>
                  {tr("开始", "Start")}
                </button>
              </div>
            ) : timerPhase !== "success" ? (
              <div className="dialog-actions timer-live-actions">
                <button
                  className="dialog-button secondary"
                  type="button"
                  onClick={() => closeSecondaryModal("timer", closeActionTimer)}
                >
                  {tr("取消计时", "Cancel timer")}
                </button>
                <button className="dialog-button timer-skip-button" type="button" onClick={skipActionTimer}>
                  {tr("跳过并完成", "Skip and complete")}
                </button>
              </div>
            ) : (
              <small className="timer-success-note">{tr("正在保存…", "Saving…")}</small>
            )}
            {timerPhase === "idle" && (
              <button className="timer-skip-link" type="button" onClick={skipActionTimer}>
                {tr("已经完成？跳过计时直接打卡", "Already done? Skip the timer")}
              </button>
            )}
          </section>
        </div>
      )}

      {recordActionMenu && (
        <div
          className="record-action-layer"
          role="presentation"
          onClick={() => setRecordActionMenu(null)}
        >
          <section
            className="record-action-popover"
            role="menu"
            aria-label={tr("调整打卡记录", "Adjust check-in")}
            style={{
              left: recordActionMenuPosition.left,
              top: recordActionMenuPosition.top,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              disabled={actionMenuTodayCount === 0}
              onClick={undoLatestActionRecord}
            >
              <span aria-hidden="true">↶</span>
              <strong>{tr("撤销一次", "Undo once")}</strong>
            </button>
          </section>
        </div>
      )}

      {pendingReward && (
        <div
          className="modal-backdrop reward-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("reward-confirm", () => setPendingReward(null))}
        >
          <section
            className={modalMotionClass("reward-confirm", "bottom-sheet reward-sheet")}
            style={modalMotionStyle("reward-confirm")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
            aria-describedby="reward-description"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("reward-confirm", () => setPendingReward(null))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("reward-confirm", () => setPendingReward(null))}
            >
              ×
            </button>
            <span className="reward-sheet-icon" aria-hidden="true">{pendingReward.icon}</span>
            <span className="overline">奖励确认</span>
            <h2 id="reward-title">兑换“{pendingReward.name}”</h2>
            <p id="reward-description">
              将使用 {pendingReward.cost} 枚栗壳。兑换后，别忘了真的把这份奖励送给自己。
            </p>
            <div className="reward-cost-preview">
              <span>当前 {shellBalance}</span>
              <i aria-hidden="true">→</i>
              <strong>剩余 {shellBalance - pendingReward.cost}</strong>
            </div>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                type="button"
                onClick={() => closeSecondaryModal("reward-confirm", () => setPendingReward(null))}
              >
                再想想
              </button>
              <button className="dialog-button reward-confirm" type="button" onClick={redeemReward}>
                确认兑换
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("confirm", () => setConfirmDialog(null))}
        >
          <section
            className={modalMotionClass(
              "confirm",
              `bottom-sheet confirm-sheet ${
                confirmDialog.kind === "reset-data"
                || confirmDialog.kind === "delete-reward"
                || confirmDialog.kind === "delete-area"
                  ? "danger-sheet"
                  : ""
              }`,
            )}
            style={modalMotionStyle("confirm")}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("confirm", () => setConfirmDialog(null))}
            <span className="dialog-symbol" aria-hidden="true">
              {confirmDialog.kind === "reset-data" ? "↺" : "−"}
            </span>
            <span className="overline">
              {confirmDialog.kind === "reset-data"
                ? "谨慎操作"
                : confirmDialog.kind === "delete-reward"
                  ? "整理奖励"
                  : confirmDialog.kind === "delete-area"
                    ? "整理标签"
                    : "整理微行动"}
            </span>
            <h2 id="confirm-title">
              {confirmDialog.kind === "reset-data"
                ? "要重新开始吗？"
                : confirmDialog.kind === "delete-reward"
                  ? "删除这个奖励？"
                  : confirmDialog.kind === "delete-area"
                    ? "删除这个标签？"
                    : "删除这个微行动？"}
            </h2>
            <p id="confirm-description">
              {confirmDialog.kind === "reset-data"
                ? "所有成长记录会被清空，微行动、成长标签和奖励清单将恢复默认状态。此操作无法撤销。"
                : confirmDialog.kind === "delete-reward"
                  ? `“${confirmDialog.reward.name}”将从奖励清单中移除，过去的兑换记录仍会保留。`
                  : confirmDialog.kind === "delete-area"
                    ? `“${confirmDialog.area.name}”将从标签清单中移除，微行动和历史记录中的关联也会同步移除。`
                    : `“${confirmDialog.action.name}”将从你的微行动中移除，已经留下的成长记录仍会保留。`}
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                type="button"
                onClick={() => closeSecondaryModal("confirm", () => setConfirmDialog(null))}
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

    </main>
  );
}
