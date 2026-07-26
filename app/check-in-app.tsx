"use client";

import {
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

type ConfirmDialog =
  | { kind: "delete-action"; action: MicroAction }
  | { kind: "delete-reward"; reward: Reward }
  | { kind: "reset-data" };

const STORAGE_KEY = "lizi-growth-v2";
const SAMPLE_HISTORY_KEY = "lizi-sample-history-v1";

const DEFAULT_AREAS: Area[] = [
  { id: "health", name: "健康", icon: "💚", color: "#4f8069", isDefault: true },
  { id: "body", name: "身体", icon: "🌱", color: "#667957", isDefault: true },
  { id: "learn", name: "学习", icon: "📚", color: "#56748a", isDefault: true },
  { id: "create", name: "创造", icon: "🎨", color: "#8a6478", isDefault: true },
  { id: "mind", name: "精神", icon: "🧘", color: "#8d7650", isDefault: true },
  { id: "life", name: "生活", icon: "🏠", color: "#9a684f", isDefault: true },
];

const DEFAULT_ACTIONS: MicroAction[] = [
  { id: "water", name: "喝一杯水", icon: "💧", tagIds: ["health", "body"], value: 1, repeatable: true },
  { id: "stretch", name: "拉伸 5 秒", icon: "🙆", tagIds: ["health", "body"], value: 1, repeatable: true },
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
  const [tab, setTab] = useState<Tab>("today");
  const [areas, setAreas] = useState<Area[]>(DEFAULT_AREAS);
  const [actions, setActions] = useState<MicroAction[]>(DEFAULT_ACTIONS);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [orbitRippleKey, setOrbitRippleKey] = useState(0);
  const [recordActionMenu, setRecordActionMenu] = useState<MicroAction | null>(null);
  const [lastCheckedAction, setLastCheckedAction] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastTimers = useRef<number[]>([]);
  const [editingAction, setEditingAction] = useState<MicroAction | null>(null);
  const [showActionEditor, setShowActionEditor] = useState(false);
  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState("🌱");
  const [draftTags, setDraftTags] = useState<string[]>(["body"]);
  const [draftValue, setDraftValue] = useState(1);
  const [draftAreaName, setDraftAreaName] = useState("");
  const [draftAreaIcon, setDraftAreaIcon] = useState("🌿");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [shellBalance, setShellBalance] = useState(0);
  const [shellsEarned, setShellsEarned] = useState(0);
  const [bankDropKey, setBankDropKey] = useState(0);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
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

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored?.areas?.length) {
        setAreas([
          ...stored.areas,
          ...DEFAULT_AREAS.filter(
            (defaultArea) => !stored.areas.some((area: Area) => area.id === defaultArea.id),
          ),
        ]);
      }
      if (stored?.actions?.length) {
        setActions(
          stored.actions.map((action: MicroAction) => {
            const defaultAction = DEFAULT_ACTIONS.find((item) => item.id === action.id);
            return {
              ...action,
              tagIds: action.tagIds?.length
                ? action.tagIds
                : defaultAction?.tagIds || normalizedTagIds(action),
            };
          }),
        );
      }
      const storedRecords = Array.isArray(stored?.records)
        ? stored.records.map((record: GrowthRecord) => ({
            ...record,
            tagIds: normalizedTagIds(record),
          }))
        : [];
      const existingRecordIds = new Set(
        storedRecords.map((record: GrowthRecord) => record.id),
      );
      const shouldSeedHistory = localStorage.getItem(SAMPLE_HISTORY_KEY) !== "done";
      const mergedRecords = [
        ...storedRecords,
        ...(shouldSeedHistory
          ? buildSampleRecords().filter((record) => !existingRecordIds.has(record.id))
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
      if (Array.isArray(stored?.rewards)) setRewards(stored.rewards);
      setRewardClaims(Array.isArray(stored?.rewardClaims) ? stored.rewardClaims : []);
      if (shouldSeedHistory) localStorage.setItem(SAMPLE_HISTORY_KEY, "done");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    return () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        areas,
        actions,
        records,
        shellBalance,
        shellsEarned,
        rewards,
        rewardClaims,
      }),
    );
  }, [areas, actions, records, rewardClaims, rewards, shellBalance, shellsEarned, ready]);

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

  function showToast(
    message: string,
    title = "操作完成",
    undoRecordId?: string,
  ) {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = undoRecordId ? 3600 : 2200;

    setToasts((current) =>
      [...current, { id, title, message, undoRecordId }].slice(-3),
    );

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

  function dismissToast(id: string) {
    setToasts((current) =>
      current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
    );
    const removeTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 280);
    toastTimers.current.push(removeTimer);
  }

  function recordAction(action: MicroAction, source: Source = "主动记录") {
    const actionTags = tagsFor(action);
    const record: GrowthRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actionId: action.id,
      actionName: action.name,
      icon: action.icon,
      tagIds: actionTags.map((tag) => tag.id),
      value: action.value,
      source,
      createdAt: new Date().toISOString(),
    };
    setRecords((current) => [record, ...current]);
    setLastCheckedAction({ id: action.id, token: Date.now() });
    setShellBalance((current) => current + 1);
    setShellsEarned((current) => current + 1);
    const growthChanges = actionTags.map(
      (tag) => `${tag.name} +${action.value}`,
    );
    showToast(
      [...growthChanges, "栗壳 +1"].join(" · "),
      "成长已记录",
      record.id,
    );
  }

  function undoRecord(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setShellBalance((current) => Math.max(0, current - 1));
    setShellsEarned((current) => Math.max(0, current - 1));
    showToast("刚刚的成长记录已移除", "已撤销");
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startActionLongPress(
    action: MicroAction,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      suppressQuickClickRef.current = action.id;
      setRecordActionMenu(action);
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
    recordAction(action);
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

  function clearTodayActionRecords() {
    if (!recordActionMenu) return;
    const matchingIds = new Set(
      records
        .filter(
          (record) =>
            record.actionId === recordActionMenu.id
            && isToday(new Date(record.createdAt)),
        )
        .map((record) => record.id),
    );
    if (!matchingIds.size) {
      showToast("今天还没有这项记录", "没有可清除内容");
      setRecordActionMenu(null);
      return;
    }
    setRecords((current) => current.filter((record) => !matchingIds.has(record.id)));
    setShellBalance((current) => Math.max(0, current - matchingIds.size));
    setShellsEarned((current) => Math.max(0, current - matchingIds.size));
    setLastCheckedAction(null);
    showToast(`已清除今天的 ${matchingIds.size} 次“${recordActionMenu.name}”`, "记录已整理");
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
    setPendingReward(null);
  }

  function openRewardEditor(reward?: Reward) {
    setEditingReward(reward || null);
    setDraftRewardName(reward?.name || "");
    setDraftRewardDescription(reward?.description || "");
    setDraftRewardIcon(reward?.icon || "🎁");
    setDraftRewardCost(reward?.cost || 10);
    setShowRewardEditor(true);
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
    setShowRewardEditor(false);
  }

  function deleteReward(reward: Reward) {
    setShowRewardEditor(false);
    setConfirmDialog({ kind: "delete-reward", reward });
  }

  function openActionEditor(action?: MicroAction) {
    setEditingAction(action || null);
    setDraftName(action?.name || "");
    setDraftIcon(action?.icon || "🌱");
    setDraftTags(action ? normalizedTagIds(action) : [areas[0]?.id || "body"]);
    setDraftValue(action?.value || 1);
    setShowActionEditor(true);
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
    showToast("成长标签已创建");
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

  function returnToToday() {
    setShowCalendar(false);
    setShowActionEditor(false);
    setShowAreaEditor(false);
    setShowRewardEditor(false);
    setConfirmDialog(null);
    setPendingReward(null);
    setRecordActionMenu(null);
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

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (showCalendar) return;
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
    } else if (confirmDialog.kind === "delete-reward") {
      setRewards((current) =>
        current.filter((item) => item.id !== confirmDialog.reward.id),
      );
      if (pendingReward?.id === confirmDialog.reward.id) setPendingReward(null);
      showToast("奖励项目已删除");
    } else {
      setAreas(DEFAULT_AREAS);
      setActions(DEFAULT_ACTIONS);
      setRewards(DEFAULT_REWARDS);
      setRecords([]);
      setShellBalance(0);
      setShellsEarned(0);
      setRewardClaims([]);
      setPendingReward(null);
      changeTab("today");
      showToast("已恢复为新的开始");
    }
    setConfirmDialog(null);
  }

  const todayTotals = totalsFor(todayRecords).filter((area) => area.total > 0);
  const allTotals = totalsFor(records);
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

  return (
    <main className="shell">
      <button
        className="global-home-button"
        type="button"
        aria-label="回到主页今日"
        onClick={returnToToday}
      >
        <span aria-hidden="true">⌂</span>
      </button>

      <section className="app-frame">
        <header className="app-header">
          <button
            className="wordmark"
            type="button"
            onClick={() => {
              closeCalendar();
              changeTab("today");
            }}
          >
            <span className="brand-seed" aria-hidden="true">栗</span>
            <strong>栗子小事</strong>
          </button>
        </header>

        <div
          className="app-scroll"
          ref={appScrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={cancelTouchGesture}
        >
          {showCalendar && (
            <div className="screen calendar-screen">
              <section className="calendar-heading">
                <button
                  className="calendar-back"
                  type="button"
                  aria-label="返回今日"
                  onClick={closeCalendar}
                >
                  <span aria-hidden="true">‹</span>
                </button>
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

          {!showCalendar && (
            <div className="tab-viewport">
              <div
                className={`tab-track ${isDraggingTabs ? "dragging" : ""}`}
                style={{
                  transform: `translate3d(calc(${-activeTabIndex * 100}% + ${dragOffset}px), 0, 0)`,
                }}
              >
            <div className="screen tab-screen" data-tab="today" aria-hidden={tab !== "today"}>
              <section className="welcome">
                <button
                  className="date-display"
                  type="button"
                  aria-label={`打开日历，${new Intl.DateTimeFormat("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  }).format(new Date())}`}
                  onClick={openCalendar}
                >
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
                  <i className="date-display-chevron" aria-hidden="true">›</i>
                </button>
                <h1>{greeting()}，今天想留下什么？</h1>
                <p>不用完成一整件大事，记录一个已经发生的小行动就很好。</p>
              </section>

              <section className="today-card">
                <div className="today-card-copy">
                  <span>今日成长</span>
                  <strong>{todayRecords.length}</strong>
                  <small>次微小行动</small>
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
                    aria-label="点击栗子，播放涟漪"
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
                    <span className="quiet">今天的成长从第一颗栗子开始</span>
                  )}
                </div>
              </section>

              <section className="content-section">
                <div className="section-title-row simple-title-row">
                  <h2>记录一件小事</h2>
                  <button type="button" onClick={() => changeTab("profile")}>管理</button>
                </div>
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
                          setRecordActionMenu(action);
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

              <section className="content-section recent-section">
                <div className="recent-divider" aria-hidden="true" />
                <details className="recent-records">
                  <summary>
                    <span>成长记录</span>
                    <small>{records.length ? `近 ${Math.min(records.length, 5)} 条` : "暂无记录"}</small>
                    <i aria-hidden="true">⌄</i>
                  </summary>
                  {records.length ? (
                    <div className="record-list">
                      {records.slice(0, 5).map((record) => {
                        const recordTags = tagsFor(record);
                        return (
                          <article className="record-row" key={record.id}>
                            <span className="record-icon">{record.icon}</span>
                            <div>
                              <strong>{record.actionName}</strong>
                              <small>{formatRecordDate(record.createdAt)} · {record.source}</small>
                            </div>
                            <span className="record-tag-list">
                              {recordTags.map((tag) => (
                                <small key={tag.id} style={{ color: tag.color }}>
                                  {tag.name} +{record.value}
                                </small>
                              ))}
                            </span>
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
                </details>
              </section>
            </div>

            <div className="screen tab-screen" data-tab="growth" aria-hidden={tab !== "growth"}>
              <section className="page-heading">
                <span className="overline">GROWTH OVERVIEW</span>
                <h1>成长正在发生</h1>
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
                <div className="growth-divider" aria-hidden="true" />
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
              <section className="page-heading">
                <span className="overline">MY SPACE</span>
                <h1>我的栗子</h1>
                <p>在这里整理微行动与成长标签，记录请回到“今日”页面。</p>
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
                    <p>每完成一件小事，就存下一枚。</p>
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
                  <button type="button" onClick={() => openRewardEditor()}>＋ 新建</button>
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
                            className="reward-edit-button"
                            type="button"
                            onClick={() => openRewardEditor(reward)}
                          >
                            编辑
                          </button>
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
                    onClick={() => openRewardEditor()}
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
                  <button type="button" onClick={() => openActionEditor()}>＋ 新建</button>
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
                        <div className="row-actions">
                          <button type="button" onClick={() => openActionEditor(action)}>编辑项目</button>
                          <button type="button" onClick={() => deleteAction(action)}>删除</button>
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

        {!showCalendar && <nav className="bottom-nav" aria-label="主要导航">
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
              {item.label}
            </button>
          ))}
        </nav>}
      </section>

      {toasts.length > 0 && (
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div className={`toast ${toast.leaving ? "leaving" : ""}`} role="status" key={toast.id}>
              <span className="toast-check" aria-hidden="true">✓</span>
              <span className="toast-copy">
                <strong>{toast.title}</strong>
                <small>{toast.message}</small>
              </span>
              {toast.undoRecordId && (
                <button
                  className="toast-undo"
                  type="button"
                  onClick={() => {
                    dismissToast(toast.id);
                    undoRecord(toast.undoRecordId!);
                  }}
                >
                  撤销
                </button>
              )}
            </div>
          ))}
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
            <span className="overline">新的成长标签</span>
            <h2>你还想积累什么？</h2>
            <p className="sheet-description">创建一个标签，再把它贴到一个或多个微行动上。</p>
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
                标签名称
                <input
                  value={draftAreaName}
                  onChange={(event) => setDraftAreaName(event.target.value)}
                  placeholder="例如：关系"
                  autoFocus
                />
              </label>
            </div>
            <button className="save-button" type="submit">添加成长标签</button>
          </form>
        </div>
      )}

      {showRewardEditor && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowRewardEditor(false)}>
          <form
            className="bottom-sheet reward-editor"
            onSubmit={saveReward}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setShowRewardEditor(false)}
            >
              ×
            </button>
            <span className="overline">{editingReward ? "编辑奖励" : "新的奖励"}</span>
            <h2>{editingReward ? "调整这份小期待" : "想把栗壳换成什么？"}</h2>
            <div className="reward-form-row">
              <label>
                图标
                <input
                  value={draftRewardIcon}
                  onChange={(event) => setDraftRewardIcon(event.target.value)}
                  maxLength={4}
                />
              </label>
              <label>
                奖励名称
                <input
                  value={draftRewardName}
                  onChange={(event) => setDraftRewardName(event.target.value)}
                  placeholder="例如：看一场电影"
                  autoFocus
                />
              </label>
            </div>
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

      {recordActionMenu && (
        <div className="modal-backdrop" role="presentation" onClick={() => setRecordActionMenu(null)}>
          <section
            className="bottom-sheet record-action-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setRecordActionMenu(null)}
            >
              ×
            </button>
            <div className="record-action-heading">
              <span aria-hidden="true">{recordActionMenu.icon}</span>
              <div>
                <small>整理今天的打卡</small>
                <h2 id="record-action-title">{recordActionMenu.name}</h2>
              </div>
              <strong>{actionMenuTodayCount} 次</strong>
            </div>
            <p>长按不会新增记录。你可以修正刚才手快多按的次数。</p>
            <div className="record-action-options">
              <button
                type="button"
                disabled={actionMenuTodayCount === 0}
                onClick={undoLatestActionRecord}
              >
                <span aria-hidden="true">↶</span>
                <div>
                  <strong>撤销最近一次</strong>
                  <small>只移除今天最后一次打卡</small>
                </div>
              </button>
              <button
                className="clear-records"
                type="button"
                disabled={actionMenuTodayCount === 0}
                onClick={clearTodayActionRecords}
              >
                <span aria-hidden="true">−</span>
                <div>
                  <strong>清除今日记录</strong>
                  <small>移除今天这个项目的全部打卡</small>
                </div>
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingReward && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingReward(null)}>
          <section
            className="bottom-sheet reward-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
            aria-describedby="reward-description"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => setPendingReward(null)}
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
                onClick={() => setPendingReward(null)}
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
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDialog(null)}>
          <section
            className={`bottom-sheet confirm-sheet ${
              confirmDialog.kind === "reset-data" || confirmDialog.kind === "delete-reward"
                ? "danger-sheet"
                : ""
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
              {confirmDialog.kind === "reset-data"
                ? "谨慎操作"
                : confirmDialog.kind === "delete-reward"
                  ? "整理奖励"
                  : "整理微行动"}
            </span>
            <h2 id="confirm-title">
              {confirmDialog.kind === "reset-data"
                ? "要重新开始吗？"
                : confirmDialog.kind === "delete-reward"
                  ? "删除这个奖励？"
                  : "删除这个微行动？"}
            </h2>
            <p id="confirm-description">
              {confirmDialog.kind === "reset-data"
                ? "所有成长记录会被清空，微行动、成长标签和奖励清单将恢复默认状态。此操作无法撤销。"
                : confirmDialog.kind === "delete-reward"
                  ? `“${confirmDialog.reward.name}”将从奖励清单中移除，过去的兑换记录仍会保留。`
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

    </main>
  );
}
