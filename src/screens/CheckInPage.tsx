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

import { DEFAULT_CARD_MILESTONE_FIRST, DEFAULT_CARD_MILESTONE_SECOND, NAV_ITEMS } from "../app/constants";
import type { ConfirmDialog, GrowthPeriod, Tab, ToastState } from "../app/types";
import { BottomNavigation } from "../components/layout/BottomNavigation";
import { IconPicker } from "../components/ui/IconPicker";
import { ToastStack } from "../components/ui/ToastStack";
import { CalendarPage } from "./CalendarPage";
import { SettingsPage } from "./SettingsPage";
import { TodayPage } from "./TodayPage";
import { GrowthPage } from "./GrowthPage";
import { ProfilePage } from "./ProfilePage";
import { AREA_COLORS, AREA_ICON_OPTIONS, DEFAULT_AREAS } from "../features/growth/constants";
import { areaIntroduction, growthLevelFor, growthTotals, normalizedTagIds } from "../features/growth/domain/growth-rules";
import type { GrowthArea as Area, GrowthRecord, GrowthSource as Source } from "../features/growth/types";
import { DEFAULT_REWARDS, REWARD_COST_OPTIONS, REWARD_ICON_OPTIONS } from "../features/rewards/constants";
import type { Reward } from "../features/rewards/types";
import { createRewardClaim } from "../features/rewards/domain/redeem-reward";
import { useRewardEditorState } from "../features/rewards/store/useRewardEditorState";
import { addShells, canAfford, removeShells, spendShells } from "../features/shells/domain/wallet";
import { ACTION_ICON_OPTIONS, ACTION_TIME_OPTIONS, DEFAULT_ACTIONS, PROFILE_ACTION_SWIPE_WIDTH } from "../features/tasks/constants";
import { actionTimeOptionFor, actionTimeWindowFor, actionsInTimeOrder, isActionAvailableNow, isTemporaryActionExpired, shellValueFor, temporaryActionDays, temporaryExpirationDay } from "../features/tasks/domain/task-rules";
import { completeTask } from "../features/tasks/domain/complete-task";
import { useTaskEditorState } from "../features/tasks/store/useTaskEditorState";
import type { MicroAction } from "../features/tasks/types";
import type { Account } from "../features/user/types";
import { useProfileEditorState } from "../features/user/store/useProfileEditorState";
import { useGrowthEditorState } from "../features/growth/store/useGrowthEditorState";
import { isToday, localDay, recordsForMonth, recordsForToday, recordsForWeek } from "../features/statistics/domain/date-ranges";
import { getSessionAccount, loginAccount, logoutAccount, readAccountData, writeAccountData } from "../services/api/account-api";
import { createAppDataSnapshot, normalizeAppData } from "../services/persistence/app-data";
import { readAccountFallback, readGuestData, saveBrowserData } from "../services/persistence/browser-storage";
import { createRuntimeId, runtimeNow } from "../shared/utils/runtime";
import { useAppDataState } from "../stores/useAppDataState";
import { useAuthState } from "../stores/useAuthState";


export function CheckInPage() {
  const taskEditor = useTaskEditorState();
  const growthEditor = useGrowthEditorState();
  const rewardEditor = useRewardEditorState();
  const profileEditor = useProfileEditorState();
  const {
    editingAction, setEditingAction,
    showActionManager, setShowActionManager,
    showActionEditor, setShowActionEditor,
    draftName, setDraftName,
    draftIcon, setDraftIcon,
    draftPresetId, setDraftPresetId,
    showActionIconPicker, setShowActionIconPicker,
    draftTags, setDraftTags,
    draftValue, setDraftValue,
    draftShellValue, setDraftShellValue,
    draftRepeatable, setDraftRepeatable,
    draftTemporary, setDraftTemporary,
    draftTemporaryDays, setDraftTemporaryDays,
    draftTimeWindow, setDraftTimeWindow,
    draftUsesTimer, setDraftUsesTimer,
    draftTimerSeconds, setDraftTimerSeconds,
    timerAction, setTimerAction,
    timerPhase, setTimerPhase,
    timerSecondsLeft, setTimerSecondsLeft,
    timerMultiplier, setTimerMultiplier,
    timerRingResetting, setTimerRingResetting,
  } = taskEditor;
  const {
    editingArea, setEditingArea,
    showAreaManager, setShowAreaManager,
    showAreaEditor, setShowAreaEditor,
    growthAreaDetailId, setGrowthAreaDetailId,
    draftAreaName, setDraftAreaName,
    draftAreaIcon, setDraftAreaIcon,
    draftAreaColor, setDraftAreaColor,
    areaEditorReturnToManager, setAreaEditorReturnToManager,
  } = growthEditor;
  const {
    pendingReward, setPendingReward,
    editingReward, setEditingReward,
    showRewardManager, setShowRewardManager,
    showRewardEditor, setShowRewardEditor,
    draftRewardName, setDraftRewardName,
    draftRewardDescription, setDraftRewardDescription,
    draftRewardIcon, setDraftRewardIcon,
    draftRewardCost, setDraftRewardCost,
  } = rewardEditor;
  const {
    showProfileEditor,
    setShowProfileEditor,
    draftProfileNickname,
    setDraftProfileNickname,
  } = profileEditor;
  const {
    account,
    setAccount,
    authReady,
    setAuthReady,
    serverHydrated,
    setServerHydrated,
  } = useAuthState();
  const {
    nickname,
    setNickname,
    areas,
    setAreas,
    actions,
    setActions,
    records,
    setRecords,
    language,
    setLanguage,
    theme,
    setTheme,
    cardMilestoneFirst,
    setCardMilestoneFirst,
    cardMilestoneSecond,
    setCardMilestoneSecond,
    shellBalance,
    setShellBalance,
    shellsEarned,
    setShellsEarned,
    rewardClaims,
    setRewardClaims,
    rewards,
    setRewards,
  } = useAppDataState();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [closingModal, setClosingModal] = useState<string | null>(null);
  const [modalDrag, setModalDrag] = useState<{ id: string; offset: number } | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [clockNow, setClockNow] = useState(() => new Date());
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>("today");
  const [actionAreaFilter, setActionAreaFilter] = useState("all");
  const [ready, setReady] = useState(false);
  const [orbitRippleKey, setOrbitRippleKey] = useState(1);
  const [recordActionMenu, setRecordActionMenu] = useState<MicroAction | null>(null);
  const [recordActionMenuPosition, setRecordActionMenuPosition] = useState({
    left: 12,
    top: 12,
  });
  const [manageActionMenu, setManageActionMenu] = useState<MicroAction | null>(null);
  const [manageActionMenuPosition, setManageActionMenuPosition] = useState({
    left: 12,
    top: 12,
  });
  const [profileActionSwipe, setProfileActionSwipe] = useState<{
    id: string;
    offset: number;
    dragging: boolean;
  } | null>(null);
  const [lastCheckedAction, setLastCheckedAction] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastTimers = useRef<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bankDropKey, setBankDropKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => localDay(new Date()));
  const appScrollRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressQuickClickRef = useRef<string | null>(null);
  const profileActionSwipeStartRef = useRef<{
    id: string;
    x: number;
    y: number;
    time: number;
    baseOffset: number;
    axis: "horizontal" | "vertical" | null;
  } | null>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    screen: HTMLElement | null;
    scrollTop: number;
  } | null>(null);
  const gestureAxisRef = useRef<"horizontal" | "vertical" | null>(null);
  const modalDragStartRef = useRef<{
    id: string;
    y: number;
    time: number;
    instantClose: boolean;
  } | null>(null);
  const modalDragCloseRef = useRef<(() => void) | null>(null);
  const editorSheetSwipeRef = useRef<{
    id: string;
    x: number;
    y: number;
    time: number;
    axis: "horizontal" | "vertical" | null;
    close: () => void;
    instantClose: boolean;
  } | null>(null);
  const modalAnimationTimerRef = useRef<number | null>(null);

  function applyAccountData(value: unknown) {
    const data = normalizeAppData(value);
    setAreas(data.areas);
    setActions(data.actions);
    setRecords(data.records);
    setShellBalance(data.shellBalance);
    setShellsEarned(data.shellsEarned);
    setRewards(data.rewards);
    setRewardClaims(data.rewardClaims);
    setNickname(data.profile.nickname);
    setLanguage(data.preferences.language);
    setTheme(data.preferences.theme);
    setCardMilestoneFirst(data.preferences.cardMilestoneFirst);
    setCardMilestoneSecond(data.preferences.cardMilestoneSecond);
  }

  async function hydrateAccount(nextAccount: Account) {
    setReady(false);
    setServerHydrated(false);
    const serverData = await readAccountData();
    const fallback = readAccountFallback(nextAccount.username);
    applyAccountData(serverData ?? fallback);
    setAccount(nextAccount);
    setReady(true);
    setServerHydrated(true);
  }

  function hydrateGuest() {
    applyAccountData(readGuestData());
    setNickname("");
    setAccount(null);
    setReady(true);
    setServerHydrated(false);
  }

  const persistedData = useMemo(
    () => createAppDataSnapshot({
      areas,
      actions,
      records,
      shellBalance,
      shellsEarned,
      rewards,
      rewardClaims,
      profile: { nickname },
      preferences: {
        language,
        theme,
        cardMilestoneFirst,
        cardMilestoneSecond,
      },
      accountUsername: account?.username,
    }),
    [
      account?.username,
      actions,
      areas,
      cardMilestoneFirst,
      cardMilestoneSecond,
      language,
      nickname,
      records,
      rewardClaims,
      rewards,
      shellBalance,
      shellsEarned,
      theme,
    ],
  );

  // Session bootstrap is intentionally one-shot; later account changes happen
  // only through the explicit login/logout flows below.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const sessionAccount = await getSessionAccount();
        if (sessionAccount) {
          await hydrateAccount(sessionAccount);
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
      void navigator.serviceWorker.register("/sw.js").catch(() => null);
    }

    return () => {
      active = false;
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      if (modalAnimationTimerRef.current) window.clearTimeout(modalAnimationTimerRef.current);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!ready) return;
    saveBrowserData(account?.username ?? null, persistedData);
    if (!account || !serverHydrated) return;
    const timer = window.setTimeout(() => {
      void writeAccountData(persistedData).catch(() => null);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [account, persistedData, ready, serverHydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  }, [language, theme]);

  useEffect(() => {
    const refreshTimeAndTemporaryActions = () => {
      const now = new Date();
      setClockNow(now);
      setActions((current) => {
        const activeActions = current.filter(
          (action) => !isTemporaryActionExpired(action, now),
        );
        return activeActions.length === current.length ? current : activeActions;
      });
    };
    const timer = window.setInterval(refreshTimeAndTemporaryActions, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTimeAndTemporaryActions();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setActions]);

  // The timer is an explicit phase state machine. Its synchronous transition
  // from preparation to running is required to keep the ring and count aligned.
  /* eslint-disable react-hooks/exhaustive-deps */
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
      setTimerRingResetting(true);
      setTimerPhase("running");
      setTimerSecondsLeft(
        Math.max(1, (timerAction.timerSeconds || 1) * timerMultiplier),
      );
      if ("vibrate" in navigator) navigator.vibrate(18);
      return;
    }

    const finishTimer = window.setTimeout(() => {
      setTimerPhase("success");
      setTimerSecondsLeft(0);
      if ("vibrate" in navigator) navigator.vibrate([28, 45, 28]);
    }, 100);
    return () => window.clearTimeout(finishTimer);
  }, [timerAction, timerMultiplier, timerPhase, timerSecondsLeft]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!timerRingResetting) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setTimerRingResetting(false);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [setTimerRingResetting, timerRingResetting]);

  useEffect(() => {
    if (tab !== "profile") return;
    const frame = window.requestAnimationFrame(() => {
      setBankDropKey((current) => current + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  const todayRecords = useMemo(
    () => recordsForToday(records),
    [records],
  );
  const weekRecords = useMemo(() => recordsForWeek(records), [records]);
  const monthRecords = useMemo(() => recordsForMonth(records), [records]);
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

  function tagsFor(value: { tagIds?: string[] }) {
    return normalizedTagIds(value)
      .map((id) => areas.find((area) => area.id === id))
      .filter((area): area is Area => Boolean(area));
  }

  function totalsFor(source: GrowthRecord[]) {
    return growthTotals(areas, source);
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return;
    setLoginPending(true);
    setLoginError("");
    try {
      const nextAccount = await loginAccount(loginUsername.trim(), loginPassword);
      await hydrateAccount(nextAccount);
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
      await writeAccountData(persistedData).catch(() => null);
    }
    await logoutAccount();
    hydrateGuest();
    setShowLogin(false);
    setLoginPassword("");
  }

  function showToast(
    message: string,
    title = "操作完成",
    undoRecordId?: string,
  ) {
    const id = createRuntimeId("toast");
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
    if (!isActionAvailableNow(action)) {
      const option = actionTimeOptionFor(action);
      showToast(`${option.label} ${option.range}`, "当前不可打卡");
      return;
    }
    if (
      action.repeatable === false
      && records.some(
        (record) =>
          record.actionId === action.id && isToday(new Date(record.createdAt)),
      )
    ) {
      showToast("这件小事每天只能打卡一次", "今日已完成");
      return;
    }
    const actionTags = tagsFor(action);
    const completion = completeTask(action, {
      count,
      source,
      tagIds: actionTags.map((tag) => tag.id),
      timestamp: runtimeNow(),
    });
    setRecords((current) => [...completion.records, ...current]);
    setLastCheckedAction({ id: action.id, token: runtimeNow() });
    setShellBalance((current) => addShells(current, completion.shellGain));
    setShellsEarned((current) => addShells(current, completion.shellGain));
    const growthChanges = actionTags.map(
      (tag) => `${tag.name} +${action.value * completion.count}`,
    );
    showToast(
      [...growthChanges, `栗壳 +${completion.shellGain}`].join(" · "),
      "成长已记录",
      completion.records[0].id,
    );
  }

  function recordAction(action: MicroAction, source: Source = "主动记录") {
    recordActionMultiple(action, 1, source);
  }

  function undoRecord(recordId: string, showFeedback = true) {
    const shellValue = shellValueFor(
      records.find((record) => record.id === recordId),
    );
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setShellBalance((current) => removeShells(current, shellValue));
    setShellsEarned((current) => removeShells(current, shellValue));
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
      editorSheetSwipeRef.current = null;
      modalAnimationTimerRef.current = null;
    }, 240);
  }

  function startModalDrag(
    id: string,
    close: () => void,
    event: ReactPointerEvent<HTMLButtonElement>,
    instantClose = false,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    modalDragStartRef.current = {
      id,
      y: event.clientY,
      time: runtimeNow(),
      instantClose,
    };
    modalDragCloseRef.current = close;
    setModalDrag({ id, offset: 0 });
  }

  function moveModalDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = modalDragStartRef.current;
    if (!start) return;
    const offset = Math.max(0, event.clientY - start.y);
    if (start.instantClose && offset >= 7) {
      const close = modalDragCloseRef.current;
      modalDragStartRef.current = null;
      modalDragCloseRef.current = null;
      setModalDrag(null);
      if (close) closeSecondaryModal(start.id, close);
      return;
    }
    setModalDrag({
      id: start.id,
      offset,
    });
  }

  function finishModalDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = modalDragStartRef.current;
    if (!start) return;
    const offset = Math.max(0, event.clientY - start.y);
    const velocity = offset / Math.max(1, runtimeNow() - start.time);
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

  function startEditorSheetSwipe(
    id: string,
    close: () => void,
    event: ReactTouchEvent<HTMLElement>,
    instantClose = false,
  ) {
    if (event.touches.length !== 1 || event.currentTarget.scrollTop > 1) return;
    if (
      (event.target as HTMLElement).closest(
        ".modal-drag-handle, input, select, textarea",
      )
    ) return;
    const touch = event.touches[0];
    editorSheetSwipeRef.current = {
      id,
      x: touch.clientX,
      y: touch.clientY,
      time: runtimeNow(),
      axis: null,
      close,
      instantClose,
    };
  }

  function moveEditorSheetSwipe(event: ReactTouchEvent<HTMLElement>) {
    const start = editorSheetSwipeRef.current;
    if (!start || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 7) {
      start.axis = Math.abs(deltaY) > Math.abs(deltaX) ? "vertical" : "horizontal";
    }
    if (start.axis === "horizontal") {
      editorSheetSwipeRef.current = null;
      return;
    }
    if (start.axis !== "vertical") return;
    if (deltaY <= 0) {
      editorSheetSwipeRef.current = null;
      setModalDrag(null);
      return;
    }

    event.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (start.instantClose) {
      editorSheetSwipeRef.current = null;
      setModalDrag(null);
      closeSecondaryModal(start.id, start.close);
      return;
    }
    setModalDrag({ id: start.id, offset: deltaY });
  }

  function finishEditorSheetSwipe(event: ReactTouchEvent<HTMLElement>) {
    const start = editorSheetSwipeRef.current;
    if (!start) return;
    editorSheetSwipeRef.current = null;
    if (start.axis !== "vertical" || event.changedTouches.length !== 1) {
      setModalDrag(null);
      return;
    }

    const offset = Math.max(0, event.changedTouches[0].clientY - start.y);
    const velocity = offset / Math.max(1, runtimeNow() - start.time);
    if (offset >= 78 || velocity >= 0.55) {
      closeSecondaryModal(start.id, start.close);
      return;
    }

    setModalDrag({ id: start.id, offset: 0 });
    window.setTimeout(() => {
      setModalDrag((current) =>
        current?.id === start.id && current.offset === 0 ? null : current,
      );
    }, 180);
  }

  function cancelEditorSheetSwipe() {
    editorSheetSwipeRef.current = null;
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

  function modalDragHandle(
    id: string,
    close: () => void,
    instantClose = false,
  ) {
    return (
      <button
        className="modal-drag-handle"
        type="button"
        aria-label={tr("向下拖动关闭", "Drag down to close")}
        onPointerDown={(event) =>
          startModalDrag(id, close, event, instantClose)
        }
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
    const menuHeight = 96;
    const viewportPadding = 12;
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.left + rect.width - menuWidth),
    );
    const top = Math.max(viewportPadding, rect.top - menuHeight - 7);

    setRecordActionMenuPosition({ left, top });
    setManageActionMenu(null);
    setRecordActionMenu(action);
  }

  function openManageActionMenu(action: MicroAction, rect: DOMRect) {
    const menuWidth = 144;
    const menuHeight = 96;
    const viewportPadding = 12;
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.left + rect.width - menuWidth),
    );
    const top = Math.max(viewportPadding, rect.top - menuHeight - 7);

    setManageActionMenuPosition({ left, top });
    setRecordActionMenu(null);
    setProfileActionSwipe(null);
    setManageActionMenu(action);
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

  function startProfileActionSwipe(
    action: MicroAction,
    event: ReactTouchEvent<HTMLDivElement>,
  ) {
    if (event.touches.length !== 1) return;
    if ((event.target as HTMLElement).closest(".profile-action-swipe-actions")) return;
    event.stopPropagation();
    const touch = event.touches[0];
    const baseOffset =
      profileActionSwipe?.id === action.id ? profileActionSwipe.offset : 0;
    profileActionSwipeStartRef.current = {
      id: action.id,
      x: touch.clientX,
      y: touch.clientY,
      time: runtimeNow(),
      baseOffset,
      axis: null,
    };
    setProfileActionSwipe({
      id: action.id,
      offset: baseOffset,
      dragging: true,
    });
  }

  function moveProfileActionSwipe(event: ReactTouchEvent<HTMLDivElement>) {
    const start = profileActionSwipeStartRef.current;
    if (!start || event.touches.length !== 1) return;
    event.stopPropagation();
    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 6) {
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }
    if (start.axis === "vertical") {
      clearLongPressTimer();
      profileActionSwipeStartRef.current = null;
      setProfileActionSwipe(null);
      return;
    }
    if (start.axis !== "horizontal") return;

    event.preventDefault();
    clearLongPressTimer();
    const offset = Math.max(
      -PROFILE_ACTION_SWIPE_WIDTH,
      Math.min(8, start.baseOffset + deltaX),
    );
    setProfileActionSwipe({ id: start.id, offset, dragging: true });
  }

  function finishProfileActionSwipe(event: ReactTouchEvent<HTMLDivElement>) {
    const start = profileActionSwipeStartRef.current;
    if (!start) return;
    event.stopPropagation();
    profileActionSwipeStartRef.current = null;

    if (start.axis !== "horizontal" || event.changedTouches.length !== 1) {
      setProfileActionSwipe(null);
      return;
    }

    const deltaX = event.changedTouches[0].clientX - start.x;
    const velocity = deltaX / Math.max(1, runtimeNow() - start.time);
    const finalOffset = Math.max(
      -PROFILE_ACTION_SWIPE_WIDTH,
      Math.min(8, start.baseOffset + deltaX),
    );
    const shouldOpen =
      velocity < -0.25
      || (velocity <= 0.25 && finalOffset < -PROFILE_ACTION_SWIPE_WIDTH / 2);

    setProfileActionSwipe(
      shouldOpen
        ? { id: start.id, offset: -PROFILE_ACTION_SWIPE_WIDTH, dragging: false }
        : null,
    );
  }

  function cancelProfileActionSwipe(event: ReactTouchEvent<HTMLDivElement>) {
    event.stopPropagation();
    profileActionSwipeStartRef.current = null;
    setProfileActionSwipe(null);
  }

  function startManageActionLongPress(
    action: MicroAction,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    const actionRect = event.currentTarget.getBoundingClientRect();
    longPressTimerRef.current = window.setTimeout(() => {
      openManageActionMenu(action, actionRect);
      if ("vibrate" in navigator) navigator.vibrate(12);
      longPressTimerRef.current = null;
    }, 520);
  }

  function startAreaLongPress(
    area: Area,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      openAreaEditor(area);
      if ("vibrate" in navigator) navigator.vibrate(12);
      longPressTimerRef.current = null;
    }, 520);
  }

  function handleQuickActionClick(action: MicroAction) {
    if (suppressQuickClickRef.current === action.id) {
      suppressQuickClickRef.current = null;
      return;
    }
    if (!isActionAvailableNow(action)) {
      const option = actionTimeOptionFor(action);
      showToast(`${option.label} ${option.range}`, "当前不可打卡");
      return;
    }
    if (
      action.repeatable === false
      && records.some(
        (record) =>
          record.actionId === action.id && isToday(new Date(record.createdAt)),
      )
    ) {
      showToast("这件小事每天只能打卡一次", "今日已完成");
      return;
    }
    if (action.timerSeconds && action.timerSeconds > 0) {
      setTimerAction(action);
      setTimerPhase("idle");
      setTimerRingResetting(false);
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
    setTimerRingResetting(false);
    setTimerSecondsLeft(0);
    setTimerMultiplier(1);
  }

  function changeTimerMultiplier(delta: number) {
    if (!timerAction || timerPhase !== "idle") return;
    if (timerAction.repeatable === false) return;
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
    if (!canAfford(shellBalance, reward.cost)) {
      showToast(`再积累 ${reward.cost - shellBalance} 枚栗壳就可以兑换`, "栗壳还不够");
      return;
    }
    setPendingReward(reward);
  }

  function redeemReward() {
    if (!pendingReward || !canAfford(shellBalance, pendingReward.cost)) return;
    const claim = createRewardClaim(pendingReward);
    setShellBalance((current) => spendShells(current, pendingReward.cost));
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
        { id: createRuntimeId("reward"), ...rewardValues },
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

  function prepareActionEditor(action?: MicroAction) {
    setEditingAction(action || null);
    setDraftName(action?.name || "");
    setDraftIcon(action?.icon || "🌱");
    setDraftPresetId(action ? null : "custom");
    setShowActionIconPicker(false);
    setDraftTags(action ? normalizedTagIds(action) : [areas[0]?.id || "body"]);
    setDraftValue(action?.value || 1);
    setDraftShellValue(shellValueFor(action));
    setDraftRepeatable(action?.repeatable !== false);
    setDraftTemporary(action?.temporary === true);
    setDraftTemporaryDays(
      action?.temporary ? temporaryActionDays(action.temporaryDays) : 1,
    );
    setDraftTimeWindow(actionTimeWindowFor(action));
    setDraftUsesTimer(Boolean(action?.timerSeconds));
    setDraftTimerSeconds(action?.timerSeconds || 5);
    setShowActionEditor(true);
  }

  function applyActionPreset(action: MicroAction) {
    setDraftPresetId(action.id);
    setDraftName(action.name);
    setDraftIcon(action.icon);
    setDraftTags(normalizedTagIds(action));
    setDraftValue(action.value);
    setDraftShellValue(shellValueFor(action));
    setDraftRepeatable(action.repeatable !== false);
    setDraftTemporary(false);
    setDraftTemporaryDays(1);
    setDraftTimeWindow(actionTimeWindowFor(action));
    setDraftUsesTimer(Boolean(action.timerSeconds));
    setDraftTimerSeconds(action.timerSeconds || 5);
    setShowActionIconPicker(false);
  }

  function startCustomAction() {
    setDraftPresetId("custom");
    setDraftName("");
    setDraftIcon("🌱");
    setDraftTags([areas[0]?.id || "body"]);
    setDraftValue(1);
    setDraftShellValue(1);
    setDraftRepeatable(true);
    setDraftTemporary(false);
    setDraftTemporaryDays(1);
    setDraftTimeWindow("anytime");
    setDraftUsesTimer(false);
    setDraftTimerSeconds(5);
    setShowActionIconPicker(false);
  }

  function openTemporaryActionEditor() {
    setManageActionMenu(null);
    setEditingAction(null);
    setDraftName("");
    setDraftIcon("⏳");
    setDraftPresetId(null);
    setShowActionIconPicker(false);
    setDraftTags([]);
    setDraftValue(1);
    setDraftShellValue(1);
    setDraftRepeatable(true);
    setDraftTemporary(true);
    setDraftTemporaryDays(1);
    setDraftTimeWindow("anytime");
    setDraftUsesTimer(false);
    setDraftTimerSeconds(5);
    setShowActionEditor(true);
  }

  function openActionEditor(action?: MicroAction) {
    setManageActionMenu(null);
    if (showActionManager) {
      closeSecondaryModal("action-manager", () => {
        setShowActionManager(false);
        prepareActionEditor(action);
      });
      return;
    }
    prepareActionEditor(action);
  }

  function requestActionDelete(action: MicroAction) {
    setManageActionMenu(null);
    setConfirmDialog({ kind: "delete-action", action });
  }

  function closeActionEditor() {
    setShowActionEditor(false);
    setShowActionManager(false);
    setShowActionIconPicker(false);
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
    if (!draftName.trim() || (!draftTemporary && !draftTags.length)) return;
    const nextTemporaryDays = temporaryActionDays(draftTemporaryDays);
    const nextTemporaryExpiration = draftTemporary
      ? editingAction?.temporary
        && temporaryActionDays(editingAction.temporaryDays) === nextTemporaryDays
        && editingAction.expiresOn
          ? editingAction.expiresOn
          : temporaryExpirationDay(nextTemporaryDays)
      : undefined;

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
                shellValue: shellValueFor({ shellValue: draftShellValue }),
                repeatable: draftRepeatable,
                temporary: draftTemporary,
                temporaryDays: draftTemporary ? nextTemporaryDays : undefined,
                expiresOn: nextTemporaryExpiration,
                timeWindow: draftTimeWindow,
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
          id: createRuntimeId("action"),
          name: draftName.trim(),
          icon: draftIcon.trim() || "🌱",
          tagIds: draftTags,
          value: Math.max(1, draftValue),
          shellValue: shellValueFor({ shellValue: draftShellValue }),
          repeatable: draftRepeatable,
          temporary: draftTemporary,
          temporaryDays: draftTemporary ? nextTemporaryDays : undefined,
          expiresOn: nextTemporaryExpiration,
          timeWindow: draftTimeWindow,
          timerSeconds: draftUsesTimer
            ? Math.min(3600, Math.max(1, draftTimerSeconds))
            : 0,
        },
      ]);
      showToast("新的微行动已加入");
    }
    closeActionEditor();
  }

  function deleteAction(action: MicroAction) {
    setShowActionEditor(false);
    setShowActionManager(false);
    setConfirmDialog({ kind: "delete-action", action });
  }

  function prepareAreaEditor(area?: Area, returnToManager = false) {
    setAreaEditorReturnToManager(returnToManager);
    setEditingArea(area || null);
    setDraftAreaName(area?.name || "");
    setDraftAreaIcon(area?.icon || "🌿");
    setDraftAreaColor(area?.color || AREA_COLORS[areas.length % AREA_COLORS.length]);
    setShowAreaEditor(true);
  }

  function openAreaEditor(area?: Area) {
    if (showAreaManager) {
      closeSecondaryModal("area-manager", () => {
        setShowAreaManager(false);
        prepareAreaEditor(area, true);
      });
      return;
    }
    prepareAreaEditor(area);
  }

  function closeAreaEditor() {
    setShowAreaEditor(false);
    if (areaEditorReturnToManager) {
      setShowAreaManager(true);
    }
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
      showToast("成长领域已更新");
    } else {
      const area: Area = {
        id: createRuntimeId("area"),
        name: draftAreaName.trim(),
        icon: draftAreaIcon.trim() || "🌿",
        color: draftAreaColor,
      };
      setAreas((current) => [...current, area]);
      showToast("成长领域已创建");
    }
    setShowAreaEditor(false);
    setShowAreaManager(areaEditorReturnToManager);
  }

  function deleteArea(area: Area) {
    if (areas.length <= 1) {
      showToast("至少保留一个成长领域", "暂时不能删除");
      return;
    }
    const blockingAction = actions.find((action) => {
      const tagIds = normalizedTagIds(action);
      return tagIds.includes(area.id) && tagIds.length === 1;
    });
    if (blockingAction) {
      showToast(`请先为“${blockingAction.name}”添加其他成长领域`, "暂时不能删除");
      return;
    }
    closeSecondaryModal("area-editor", () => {
      setShowAreaEditor(false);
      setShowAreaManager(areaEditorReturnToManager);
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
    setManageActionMenu(null);
    setProfileActionSwipe(null);
    if (nextTab === "growth") setGrowthPeriod("today");
    if (nextTab === "today") {
      setOrbitRippleKey((current) => current + 1);
    }
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
    if (tab === "today") {
      setOrbitRippleKey((current) => current + 1);
    }
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
    setManageActionMenu(null);
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

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (showCalendar || showSettings) return;
    if (event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea")) {
      touchStartRef.current = null;
      return;
    }
    const screen = target.closest<HTMLElement>(".tab-screen");
    touchStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: runtimeNow(),
      screen,
      scrollTop: screen?.scrollTop || 0,
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

    if (event.cancelable) event.preventDefault();
    if (start.screen && start.screen.scrollTop !== start.scrollTop) {
      start.screen.scrollTop = start.scrollTop;
    }
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
    const velocity = Math.abs(deltaX) / Math.max(1, runtimeNow() - start.time);
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
          tagIds: normalizedTagIds(action).filter((tagId) => tagId !== areaId),
        })),
      );
      setRecords((current) =>
        current.map((record) => ({
          ...record,
          tagIds: normalizedTagIds(record).filter((tagId) => tagId !== areaId),
        })),
      );
      showToast("成长领域已删除");
      setShowAreaManager(areaEditorReturnToManager);
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
      setCardMilestoneFirst(DEFAULT_CARD_MILESTONE_FIRST);
      setCardMilestoneSecond(DEFAULT_CARD_MILESTONE_SECOND);
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
  const growthLevels = allTotals.map((area) => ({
    ...area,
    ...growthLevelFor(area.total),
  }));
  const growthAreaDetail =
    growthLevels.find((area) => area.id === growthAreaDetailId) || null;
  const growthAreaDetailActions = growthAreaDetail
    ? actionsInTimeOrder(
        actions.filter((action) =>
          normalizedTagIds(action).includes(growthAreaDetail.id),
        ),
      )
    : [];
  const maxTodayAreaTotal = Math.max(1, ...todayProgressTotals.map((area) => area.total));
  const maxWeekAreaTotal = Math.max(1, ...weekProgressTotals.map((area) => area.total));
  const maxMonthAreaTotal = Math.max(1, ...monthProgressTotals.map((area) => area.total));
  const maxAreaTotal = Math.max(1, ...allTotals.map((area) => area.total));
  const growthPeriodOptions: {
    id: GrowthPeriod;
    label: string;
    count: number;
    totals: ReturnType<typeof totalsFor>;
    maxTotal: number;
  }[] = [
    {
      id: "today",
      label: tr("今日", "Today"),
      count: todayRecords.length,
      totals: todayProgressTotals,
      maxTotal: maxTodayAreaTotal,
    },
    {
      id: "week",
      label: tr("本周", "This week"),
      count: weekRecords.length,
      totals: weekProgressTotals,
      maxTotal: maxWeekAreaTotal,
    },
    {
      id: "month",
      label: tr("本月", "This month"),
      count: monthRecords.length,
      totals: monthProgressTotals,
      maxTotal: maxMonthAreaTotal,
    },
    {
      id: "total",
      label: tr("总计", "Total"),
      count: records.length,
      totals: allTotals,
      maxTotal: maxAreaTotal,
    },
  ];
  const activeGrowthPeriod =
    growthPeriodOptions.find((period) => period.id === growthPeriod)
    || growthPeriodOptions[0];
  const activeGrowthRecords =
    growthPeriod === "today"
      ? todayRecords
      : growthPeriod === "week"
        ? weekRecords
        : growthPeriod === "month"
          ? monthRecords
          : records;
  const actionMenuTodayCount = recordActionMenu
    ? todayRecords.filter((record) => record.actionId === recordActionMenu.id).length
    : 0;
  const activeTabIndex = NAV_ITEMS.findIndex((item) => item.id === tab);
  const todayCardMilestone =
    todayRecords.length >= cardMilestoneSecond
      ? "milestone-20"
      : todayRecords.length >= cardMilestoneFirst
        ? "milestone-10"
        : "";
  const activeActionAreaFilter =
    actionAreaFilter === "all" || areas.some((area) => area.id === actionAreaFilter)
      ? actionAreaFilter
      : "all";
  const visibleTodayActions = actionsInTimeOrder(
    activeActionAreaFilter === "all"
      ? actions
      : actions.filter((action) =>
          normalizedTagIds(action).includes(activeActionAreaFilter),
        ),
  );
  const safeDraftTimerSeconds = Math.min(
    3600,
    Math.max(
      1,
      Number.isFinite(draftTimerSeconds) ? Math.floor(draftTimerSeconds) : 1,
    ),
  );
  const timerSliderMax = Math.min(
    3600,
    Math.max(300, Math.ceil(safeDraftTimerSeconds / 60) * 60),
  );
  const timerSliderProgress =
    ((safeDraftTimerSeconds - 1) / Math.max(1, timerSliderMax - 1)) * 100;
  return (
    <main
      className={`shell${
        showActionEditor
        || showAreaEditor
        || showAreaManager
        || showRewardEditor
        || showRewardManager
        || showProfileEditor
          ? " editor-modal-open"
          : ""
      }`}
    >
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
          className={`app-scroll${isDraggingTabs ? " tab-swipe-active" : ""}`}
          ref={appScrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={cancelTouchGesture}
          onScrollCapture={() => {
            clearLongPressTimer();
            if (recordActionMenu) setRecordActionMenu(null);
            if (manageActionMenu) setManageActionMenu(null);
            if (profileActionSwipe) setProfileActionSwipe(null);
          }}
        >
          {showCalendar && (
            <CalendarPage
              month={calendarMonth}
              cells={calendarCells}
              recordCounts={calendarRecordCounts}
              selectedDay={selectedCalendarDay}
              selectedRecords={selectedDayRecords}
              onClose={closeCalendar}
              onShiftMonth={shiftCalendarMonth}
              onSelectDay={setSelectedCalendarDay}
              tagsFor={tagsFor}
            />
          )}

          {showSettings && (
            <SettingsPage
              language={language}
              theme={theme}
              cardMilestoneFirst={cardMilestoneFirst}
              cardMilestoneSecond={cardMilestoneSecond}
              isSignedIn={Boolean(account)}
              onClose={closeSettings}
              setLanguage={setLanguage}
              setTheme={setTheme}
              setCardMilestoneFirst={setCardMilestoneFirst}
              setCardMilestoneSecond={setCardMilestoneSecond}
            />
          )}

          {!showCalendar && !showSettings && (
            <div className="tab-viewport">
              <div
                className={`tab-track ${isDraggingTabs ? "dragging" : ""}`}
                style={{
                  transform: `translate3d(calc(${-activeTabIndex * 100}% + ${dragOffset}px), 0, 0)`,
                }}
              >
            <TodayPage
              active={tab === "today"}
              language={language}
              locale={locale}
              account={account}
              nickname={nickname}
              todayRecords={todayRecords}
              todayTotals={todayTotals}
              milestoneClass={todayCardMilestone}
              orbitRippleKey={orbitRippleKey}
              setOrbitRippleKey={setOrbitRippleKey}
              areas={areas}
              activeAreaFilter={activeActionAreaFilter}
              setAreaFilter={setActionAreaFilter}
              visibleActions={visibleTodayActions}
              clockNow={clockNow}
              lastCheckedAction={lastCheckedAction}
              tagsFor={tagsFor}
              onOpenCalendar={openCalendar}
              onAddTemporaryAction={openTemporaryActionEditor}
              onActionClick={handleQuickActionClick}
              onOpenActionMenu={openRecordActionMenu}
              onStartLongPress={startActionLongPress}
              onMoveLongPress={moveActionLongPress}
              onFinishLongPress={finishActionLongPress}
            />

            <GrowthPage
              active={tab === "growth"}
              language={language}
              locale={locale}
              now={clockNow}
              records={records}
              weekRecords={weekRecords}
              monthRecords={monthRecords}
              growthLevels={growthLevels}
              period={growthPeriod}
              periodOptions={growthPeriodOptions}
              activePeriod={activeGrowthPeriod}
              activeRecords={activeGrowthRecords}
              areas={areas}
              setPeriod={setGrowthPeriod}
              onOpenCalendar={openCalendar}
              onOpenArea={setGrowthAreaDetailId}
              tagsFor={tagsFor}
            />

            <ProfilePage
              active={tab === "profile"}
              account={account}
              areas={areas}
              actions={actions}
              records={records}
              rewards={rewards}
              rewardClaims={rewardClaims}
              shellBalance={shellBalance}
              shellsEarned={shellsEarned}
              bankDropKey={bankDropKey}
              profileActionSwipe={profileActionSwipe}
              tr={tr}
              tagsFor={tagsFor}
              onOpenProfile={openProfileEditor}
              onOpenSettings={openSettings}
              onOpenRewardManager={() => setShowRewardManager(true)}
              onRequestReward={requestReward}
              onOpenActionManager={() => setShowActionManager(true)}
              onEditAction={(action) => {
                setProfileActionSwipe(null);
                openActionEditor(action);
              }}
              onDeleteAction={(action) => {
                setProfileActionSwipe(null);
                requestActionDelete(action);
              }}
              onStartActionSwipe={startProfileActionSwipe}
              onMoveActionSwipe={moveProfileActionSwipe}
              onFinishActionSwipe={finishProfileActionSwipe}
              onCancelActionSwipe={cancelProfileActionSwipe}
              onStartActionLongPress={startManageActionLongPress}
              onMoveLongPress={moveActionLongPress}
              onFinishLongPress={finishActionLongPress}
              onOpenActionMenu={openManageActionMenu}
              onOpenAreaManager={() => setShowAreaManager(true)}
              onStartAreaLongPress={startAreaLongPress}
              onOpenAreaEditor={openAreaEditor}
              onResetData={resetData}
            />
              </div>
            </div>
          )}
        </div>

        {!showCalendar && !showSettings && (
          <BottomNavigation
            activeTab={tab}
            language={language}
            onChange={changeTab}
          />
        )}
      </section>

      <ToastStack toasts={toasts} onUndo={markToastUndone} />

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
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "profile-editor",
                () => setShowProfileEditor(false),
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
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
              />
            </label>
            <button className="save-button" type="submit">
              {tr("保存", "Save")}
            </button>
            <button
              className="profile-editor-logout"
              type="button"
              onClick={() => {
                setShowProfileEditor(false);
                void logout();
              }}
            >
              {tr("退出登录", "Sign out")}
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
            <h2 id="action-manager-title">我的小事</h2>
            <button
              className="action-manager-create"
              type="button"
              onClick={() => openActionEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建小事</strong>
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
                        {action.temporary
                          ? `${actionTags.length ? " · " : ""}临时至 ${
                              action.expiresOn?.slice(5).replace("-", "/") || "今天"
                            }`
                          : ""}
                        {action.timerSeconds ? ` · 计时 ${action.timerSeconds} 秒` : ""}
                        {action.repeatable === false ? " · 每日一次" : ""}
                        {actionTimeWindowFor(action) !== "anytime"
                          ? ` · ${actionTimeOptionFor(action).label}`
                          : ""}
                        {` · 栗壳 +${shellValueFor(action)}`}
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
        <div className="action-editor-page-layer">
          <form
            className="screen action-editor action-editor-page"
            onSubmit={saveAction}
          >
            <section className="action-editor-page-heading">
              <button
                className="settings-back"
                type="button"
                aria-label={tr("返回原页面", "Back")}
                onClick={closeActionEditor}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <span className="overline">
                {draftTemporary
                  ? editingAction
                    ? "编辑临时小事"
                    : "新的临时小事"
                  : editingAction
                    ? "编辑小事"
                    : "新的小事"}
              </span>
              <h1>我的小事</h1>
            </section>
            {draftTemporary && (
              <section className="temporary-action-settings">
                <div className="temporary-action-settings-copy">
                  <span aria-hidden="true">⏳</span>
                  <div>
                    <strong>临时小事</strong>
                    <small>到期后只删除小事，打卡记录和栗壳会保留</small>
                  </div>
                </div>
                <div className="temporary-duration-control">
                  <div>
                    <strong>有效天数</strong>
                    <small>
                      {draftTemporaryDays === 1
                        ? "明天自动删除"
                        : `保留至 ${temporaryExpirationDay(draftTemporaryDays).slice(5).replace("-", "月")}日`}
                    </small>
                  </div>
                  <div role="group" aria-label="调整临时小事有效天数">
                    <button
                      type="button"
                      disabled={draftTemporaryDays <= 1}
                      onClick={() =>
                        setDraftTemporaryDays((current) => Math.max(1, current - 1))
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="30"
                      value={draftTemporaryDays}
                      aria-label="临时小事有效天数"
                      onChange={(event) =>
                        setDraftTemporaryDays(
                          temporaryActionDays(event.target.value),
                        )
                      }
                    />
                    <button
                      type="button"
                      disabled={draftTemporaryDays >= 30}
                      onClick={() =>
                        setDraftTemporaryDays((current) => Math.min(30, current + 1))
                      }
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </section>
            )}
            {!editingAction && !draftTemporary && (
              <fieldset className="action-preset-picker">
                <legend>系统小事</legend>
                <div>
                  <button
                    className={draftPresetId === "custom" ? "selected" : ""}
                    type="button"
                    onClick={startCustomAction}
                  >
                    <span aria-hidden="true">✦</span>
                    <strong>自定义</strong>
                  </button>
                  {DEFAULT_ACTIONS.map((action) => (
                    <button
                      className={draftPresetId === action.id ? "selected" : ""}
                      type="button"
                      key={action.id}
                      onClick={() => applyActionPreset(action)}
                    >
                      <span aria-hidden="true">{action.icon}</span>
                      <strong>{action.name}</strong>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="action-name-label">
              行动名称
              <div className="action-name-control">
                <button
                  className="action-icon-trigger"
                  type="button"
                  aria-label="选择小事图标"
                  aria-expanded={showActionIconPicker}
                  aria-haspopup="dialog"
                  onClick={() => setShowActionIconPicker(true)}
                >
                  <span aria-hidden="true">{draftIcon}</span>
                  <small aria-hidden="true">⌄</small>
                </button>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="例如：阅读一页"
                />
              </div>
            </label>
            <div className="action-shell-stepper action-growth-stepper">
              <div>
                <span aria-hidden="true">🌱</span>
                <strong>成长值</strong>
              </div>
              <div role="group" aria-label="调整每次完成获得的成长值">
                <button
                  type="button"
                  disabled={draftValue <= 1}
                  aria-label="成长值减一"
                  onClick={() =>
                    setDraftValue((current) => Math.max(1, current - 1))
                  }
                >
                  −1
                </button>
                <output aria-live="polite">+{draftValue}</output>
                <button
                  type="button"
                  disabled={draftValue >= 10}
                  aria-label="成长值加一"
                  onClick={() =>
                    setDraftValue((current) => Math.min(10, current + 1))
                  }
                >
                  +1
                </button>
              </div>
            </div>
            {draftTemporary && !draftTags.length && (
              <p className="temporary-growth-note">
                当前不关联成长领域，因此不会增加成长值或领域经验。
              </p>
            )}
            <div className="action-shell-stepper">
              <div>
                <span aria-hidden="true">🌰</span>
                <strong>栗壳获取</strong>
              </div>
              <div role="group" aria-label="调整每次完成获得的栗壳">
                <button
                  type="button"
                  disabled={draftShellValue <= 1}
                  aria-label="栗壳获取值减一"
                  onClick={() =>
                    setDraftShellValue((current) => Math.max(1, current - 1))
                  }
                >
                  −1
                </button>
                <output aria-live="polite">+{draftShellValue}</output>
                <button
                  type="button"
                  disabled={draftShellValue >= 99}
                  aria-label="栗壳获取值加一"
                  onClick={() =>
                    setDraftShellValue((current) => Math.min(99, current + 1))
                  }
                >
                  +1
                </button>
              </div>
            </div>
            <div className="timer-editor-setting action-repeat-setting">
              <button
                className={draftRepeatable ? "enabled" : ""}
                type="button"
                role="switch"
                aria-checked={draftRepeatable}
                onClick={() => setDraftRepeatable((current) => !current)}
              >
                <span aria-hidden="true">↻</span>
                <div>
                  <strong>当日可重复</strong>
                  <small>{draftRepeatable ? "可多次打卡" : "每天仅一次"}</small>
                </div>
                <i aria-hidden="true"><b /></i>
              </button>
            </div>
            <fieldset className="action-time-setting">
              <legend>可打卡时段</legend>
              <div>
                {ACTION_TIME_OPTIONS.map((option) => (
                  <button
                    className={draftTimeWindow === option.id ? "selected" : ""}
                    type="button"
                    key={option.id}
                    aria-pressed={draftTimeWindow === option.id}
                    onClick={() => setDraftTimeWindow(option.id)}
                  >
                    <span aria-hidden="true">{option.icon}</span>
                    <strong>{option.label}</strong>
                    <small>{option.range}</small>
                  </button>
                ))}
              </div>
            </fieldset>
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
                  <strong>计时</strong>
                  <small>开始前会有 3 秒准备时间</small>
                </div>
                <i aria-hidden="true"><b /></i>
              </button>
              {draftUsesTimer && (
                <div className="timer-duration-editor">
                  <div className="timer-duration-editor-heading">
                    <strong>计时时长</strong>
                    <output aria-live="polite">
                      {safeDraftTimerSeconds}<small>秒</small>
                    </output>
                  </div>
                  <label className="timer-duration-slider">
                    <span>滑动选择时长</span>
                    <input
                      type="range"
                      min="1"
                      max={timerSliderMax}
                      step="1"
                      value={safeDraftTimerSeconds}
                      aria-label="滑动选择计时时长"
                      style={
                        {
                          "--timer-slider-progress": `${timerSliderProgress}%`,
                        } as CSSProperties
                      }
                      onChange={(event) =>
                        setDraftTimerSeconds(Number(event.target.value))
                      }
                    />
                    <small aria-hidden="true">
                      <span>1 秒</span>
                      <span>{Math.round(timerSliderMax / 2)} 秒</span>
                      <span>{timerSliderMax} 秒</span>
                    </small>
                  </label>
                  <label className="timer-duration-number">
                    <span>精确输入</span>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        inputMode="numeric"
                        value={draftTimerSeconds}
                        onChange={(event) =>
                          setDraftTimerSeconds(Number(event.target.value))
                        }
                      />
                      <small>秒</small>
                    </div>
                  </label>
                </div>
              )}
            </div>
            <fieldset className="tag-fieldset">
              <legend>
                成长领域 <small>{draftTemporary ? "可不选" : "可多选"}</small>
              </legend>
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
              {!draftTags.length && !draftTemporary && (
                <small className="field-hint">至少选择一个成长领域</small>
              )}
            </fieldset>
            <button
              className="save-button"
              type="submit"
              disabled={
                !draftName.trim()
                || (!draftTemporary && !draftTags.length)
              }
            >
              {editingAction ? "保存修改" : "加入我的小事"}
            </button>
            {editingAction && (
              <button
                className="delete-action-button"
                type="button"
                onClick={() => deleteAction(editingAction)}
              >
                删除这件小事
              </button>
            )}
          </form>
          {showActionIconPicker && (
            <div
              className="action-icon-dialog-backdrop"
              role="presentation"
              onClick={() => setShowActionIconPicker(false)}
            >
              <section
                className="action-icon-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="action-icon-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="action-icon-dialog-heading">
                  <div>
                    <span className="overline">小事图标</span>
                    <h2 id="action-icon-dialog-title">选择一个图标</h2>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭图标选择"
                    onClick={() => setShowActionIconPicker(false)}
                  >
                    ×
                  </button>
                </div>
                <IconPicker
                  label="所有可选图标"
                  value={draftIcon}
                  options={ACTION_ICON_OPTIONS}
                  onChange={(icon) => {
                    setDraftIcon(icon);
                    setShowActionIconPicker(false);
                  }}
                />
              </section>
            </div>
          )}
        </div>
      )}

      {growthAreaDetail && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() =>
            closeSecondaryModal(
              "growth-area-detail",
              () => setGrowthAreaDetailId(null),
            )
          }
        >
          <section
            className={modalMotionClass(
              "growth-area-detail",
              "bottom-sheet growth-area-detail",
            )}
            style={modalMotionStyle("growth-area-detail")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="growth-area-detail-title"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "growth-area-detail",
                () => setGrowthAreaDetailId(null),
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
          >
            {modalDragHandle(
              "growth-area-detail",
              () => setGrowthAreaDetailId(null),
            )}
            <button
              className="close-button"
              type="button"
              aria-label={tr("关闭", "Close")}
              onClick={() =>
                closeSecondaryModal(
                  "growth-area-detail",
                  () => setGrowthAreaDetailId(null),
                )
              }
            >
              ×
            </button>

            <div
              className="growth-area-detail-hero"
              style={{
                background: `linear-gradient(145deg, ${growthAreaDetail.color}1f, ${growthAreaDetail.color}08)`,
              }}
            >
              <span
                className="growth-area-detail-icon"
                style={{ background: `${growthAreaDetail.color}20` }}
                aria-hidden="true"
              >
                {growthAreaDetail.icon}
              </span>
              <div>
                <span className="overline">{tr("成长领域", "Growth area")}</span>
                <h2 id="growth-area-detail-title">{growthAreaDetail.name}</h2>
                <p>{areaIntroduction(growthAreaDetail, language)}</p>
              </div>
            </div>

            <div className="growth-area-detail-stats">
              <span>
                <strong>{growthAreaDetail.total}</strong>
                <small>{tr("累计成长", "Total growth")}</small>
              </span>
              <span>
                <strong>Lv.{growthAreaDetail.level}</strong>
                <small>{tr("当前等级", "Current level")}</small>
              </span>
              <span>
                <strong>{growthAreaDetailActions.length}</strong>
                <small>{tr("关联小事", "Linked actions")}</small>
              </span>
            </div>

            <div className="growth-area-detail-actions">
              <div className="growth-area-detail-heading">
                <h3>{tr("这个领域的小事", "Actions in this area")}</h3>
                <small>{growthAreaDetailActions.length}</small>
              </div>
              {growthAreaDetailActions.length ? (
                <div className="growth-area-detail-list">
                  {growthAreaDetailActions.map((action) => {
                    const timeOption = actionTimeOptionFor(action);
                    return (
                      <article key={`area-detail-${action.id}`}>
                        <span aria-hidden="true">{action.icon}</span>
                        <div>
                          <strong>{action.name}</strong>
                          <small>
                            {actionTimeWindowFor(action) === "anytime"
                              ? tr("全天", "Anytime")
                              : timeOption.label}
                            {` · ${tr("成长", "Growth")} +${action.value}`}
                            {` · ${tr("栗壳", "Shells")} +${shellValueFor(action)}`}
                          </small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="growth-area-detail-empty">
                  <span aria-hidden="true">＋</span>
                  <p>{tr("这个领域还没有关联的小事。", "No actions are linked to this area yet.")}</p>
                </div>
              )}
            </div>
          </section>
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
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "area-manager",
                () => setShowAreaManager(false),
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
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
            <span className="overline">成长领域</span>
            <h2 id="area-manager-title">领域管理</h2>
            <button
              className="action-manager-create"
              type="button"
              onClick={() => openAreaEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建领域</strong>
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
            tabIndex={-1}
            autoFocus
            onSubmit={saveArea}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) =>
              startEditorSheetSwipe("area-editor", closeAreaEditor, event)
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
          >
            {modalDragHandle("area-editor", () => closeAreaEditor())}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("area-editor", closeAreaEditor)}
            >
              ×
            </button>
            <span className="overline">{editingArea ? "编辑成长领域" : "新的成长领域"}</span>
            <h2>{editingArea ? "调整这个成长方向" : "你还想积累什么？"}</h2>
            <p className="sheet-description">
              {editingArea
                ? "修改后，所有关联微行动和历史记录会同步显示新名称。"
                : "创建一个成长领域，再关联到一个或多个微行动。"}
            </p>
            <label>
              领域名称
              <input
                value={draftAreaName}
                onChange={(event) => setDraftAreaName(event.target.value)}
                placeholder="例如：关系"
              />
            </label>
            <IconPicker
              label="选择图标"
              value={draftAreaIcon}
              options={AREA_ICON_OPTIONS}
              onChange={setDraftAreaIcon}
            />
            <fieldset className="area-color-fieldset">
              <legend>领域颜色</legend>
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
              {editingArea ? "保存领域修改" : "添加成长领域"}
            </button>
            {editingArea && (
              <button
                className="delete-area-button"
                type="button"
                onClick={() => deleteArea(editingArea)}
              >
                删除这个领域
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
            tabIndex={-1}
            autoFocus
            onSubmit={saveReward}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "reward-editor",
                () => setShowRewardEditor(false),
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
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
            <fieldset className="reward-cost-fieldset">
              <legend>所需栗壳</legend>
              <div className="reward-cost-options">
                {REWARD_COST_OPTIONS.map((cost) => (
                  <button
                    className={draftRewardCost === cost ? "selected" : ""}
                    type="button"
                    key={cost}
                    aria-pressed={draftRewardCost === cost}
                    onClick={() => setDraftRewardCost(cost)}
                  >
                    <strong>{cost}</strong>
                    <small>栗壳</small>
                  </button>
                ))}
              </div>
              <label className="reward-cost-custom">
                <span>自定义</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="9999"
                  value={draftRewardCost}
                  onChange={(event) => setDraftRewardCost(Number(event.target.value))}
                />
                <small>枚</small>
              </label>
            </fieldset>
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
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "reward-manager",
                () => setShowRewardManager(false),
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
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
              `bottom-sheet timer-sheet timer-phase-${timerPhase} ${
                timerPhase === "success" ? "timer-succeeded" : ""
              }`,
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
              className={`timer-clock ${timerPhase}${
                timerRingResetting ? " timer-ring-reset" : ""
              }`}
              style={
                {
                  "--timer-progress": `${
                    timerPhase === "success"
                      ? 360
                      : timerPhase === "preparing"
                        ? 0
                        : (
                            timerSecondsLeft
                            / Math.max(
                              1,
                              (timerAction.timerSeconds || 1) * timerMultiplier,
                            )
                          ) * 360
                  }deg`,
                  "--timer-duration": `${Math.max(
                    1,
                    (timerAction.timerSeconds || 1) * timerMultiplier,
                  )}s`,
                  "--timer-ring-color":
                    timerPhase === "success"
                      ? "#6f9466"
                      : timerPhase === "preparing"
                        ? "#8993aa"
                        : "var(--chestnut)",
                  "--timer-ring-track":
                    timerPhase === "success"
                      ? "rgba(111, 148, 102, .12)"
                      : timerPhase === "preparing"
                        ? "rgba(137, 147, 170, .14)"
                        : "rgba(111, 59, 39, .1)",
                } as CSSProperties
              }
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
                    <span className="timer-phase-icon" aria-hidden="true">
                      {timerPhase === "preparing" ? tr("预备", "READY") : timerAction.icon}
                    </span>
                    <span className="timer-countdown-value">
                      <strong>{timerSecondsLeft}</strong>
                      <small>{tr("秒", "sec")}</small>
                    </span>
                  </>
                )}
              </div>
            </div>
            <h2 id="timer-title">
              {timerPhase === "success"
                ? tr("打卡成功", "Check-in complete")
                : timerPhase === "preparing"
                  ? tr("准备开始", "Get ready")
                  : timerAction.name}
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
                    <span className="timer-duration-value">
                      <b>{(timerAction.timerSeconds || 1) * timerMultiplier}</b>
                      <small>{tr("秒", "sec")}</small>
                    </span>
                    <em>× {timerMultiplier} {tr("次", "check-ins")}</em>
                  </strong>
                  <button
                    type="button"
                    aria-label={tr("增加一档时长", "Increase duration")}
                    disabled={
                      timerMultiplier === 60 || timerAction.repeatable === false
                    }
                    onClick={() => changeTimerMultiplier(1)}
                  >
                    +
                  </button>
                </div>
                <small>
                  {tr(
                    timerAction.repeatable === false
                      ? "此小事每天仅可完成一次"
                      : `每档增加 ${timerAction.timerSeconds || 1} 秒，完成后按倍数记录`,
                    timerAction.repeatable === false
                      ? "This action can be completed once per day"
                      : `Each step adds ${timerAction.timerSeconds || 1} seconds and one check-in`,
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
              onClick={() => {
                const action = recordActionMenu;
                setRecordActionMenu(null);
                openActionEditor(action);
              }}
            >
              <span aria-hidden="true">✎</span>
              <strong>{tr("编辑", "Edit")}</strong>
            </button>
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

      {manageActionMenu && (
        <div
          className="record-action-layer"
          role="presentation"
          onClick={() => setManageActionMenu(null)}
        >
          <section
            className="record-action-popover manage-action-popover"
            role="menu"
            aria-label={`${manageActionMenu.name}的管理选项`}
            style={{
              left: manageActionMenuPosition.left,
              top: manageActionMenuPosition.top,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => openActionEditor(manageActionMenu)}
            >
              <span aria-hidden="true">✎</span>
              <strong>编辑</strong>
            </button>
            <button
              className="danger"
              type="button"
              role="menuitem"
              onClick={() => requestActionDelete(manageActionMenu)}
            >
              <span aria-hidden="true">×</span>
              <strong>删除</strong>
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
                    ? "整理成长领域"
                    : "整理微行动"}
            </span>
            <h2 id="confirm-title">
              {confirmDialog.kind === "reset-data"
                ? "要重新开始吗？"
                : confirmDialog.kind === "delete-reward"
                  ? "删除这个奖励？"
                  : confirmDialog.kind === "delete-area"
                    ? "删除这个成长领域？"
                    : "删除这个微行动？"}
            </h2>
            <p id="confirm-description">
              {confirmDialog.kind === "reset-data"
                ? "所有成长记录会被清空，微行动、成长领域和奖励清单将恢复默认状态。此操作无法撤销。"
                : confirmDialog.kind === "delete-reward"
                  ? `“${confirmDialog.reward.name}”将从奖励清单中移除，过去的兑换记录仍会保留。`
                  : confirmDialog.kind === "delete-area"
                    ? `“${confirmDialog.area.name}”将从成长领域清单中移除，微行动和历史记录中的关联也会同步移除。`
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
