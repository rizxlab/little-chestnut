"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { NAV_ITEMS } from "../../app/constants";
import type { ConfirmDialog, GrowthPeriod, Tab, ToastState } from "../../app/types";
import { BottomNavigation } from "../../components/layout/BottomNavigation";
import { AppIcon } from "../../components/ui/AppIcon";
import { ToastStack } from "../../components/ui/ToastStack";
import { CalendarPage } from "../CalendarPage";
import { SettingsPage } from "../SettingsPage";
import { TodayPage } from "../TodayPage";
import { GrowthPage } from "../GrowthPage";
import { ProfilePage } from "../ProfilePage";
import type { GrowthSource as Source } from "../../features/growth/types";
import { DEFAULT_REWARDS } from "../../features/rewards/constants";
import type { Reward } from "../../features/rewards/types";
import { createRewardClaim } from "../../features/rewards/domain/redeem-reward";
import { reorderRewards } from "../../features/rewards/domain/reward-order";
import { useRewardEditorState } from "../../features/rewards/hooks/useRewardEditorState";
import { RewardEditors } from "../../features/rewards/components/RewardEditors";
import { RewardRedeemDialog } from "../../features/rewards/components/RewardRedeemDialog";
import { addShells, canAfford, removeShells, spendShells } from "../../features/shells/domain/wallet";
import { DEFAULT_ACTIONS, randomActionIcon } from "../../features/tasks/constants";
import { actionTimeWindowFor, actionsInTimeOrder, shellValueFor, temporaryActionDays, temporaryExpirationDay } from "../../features/tasks/domain/task-rules";
import { completeTask } from "../../features/tasks/domain/complete-task";
import { useTimer } from "../../features/tasks/hooks/useTimer";
import { TimerDialog } from "../../features/tasks/components/TimerDialog";
import { TaskEditors } from "../../features/tasks/components/TaskEditors";
import { TaskQuickMenus } from "../../features/tasks/components/TaskQuickMenus";
import { useTaskEditorState } from "../../features/tasks/hooks/useTaskEditorState";
import type { MicroAction } from "../../features/tasks/types";
import { useProfileEditorState } from "../../features/profile/hooks/useProfileEditorState";
import { ProfileEditor } from "../../features/profile/components/ProfileEditor";
import { useAccountSync } from "../../features/account/hooks/useAccountSync";
import { LoginDialog } from "../../features/account/components/LoginDialog";
import { activityDay, isToday, localDay, recordsForMonth, recordsForToday, recordsForWeek } from "../../features/statistics/domain/date-ranges";
import { createRuntimeId, runtimeNow } from "../../shared/utils/runtime";
import { useGesture } from "../../shared/hooks/useGesture";
import { useAppDataState } from "../../stores/useAppDataState";
import { ConfirmActionDialog } from "./ConfirmActionDialog";


export function CheckInWorkspace() {
  const taskEditor = useTaskEditorState();
  const rewardEditor = useRewardEditorState();
  const profileEditor = useProfileEditorState();
  const {
    editingAction, setEditingAction,
    showActionManager, setShowActionManager,
    showActionEditor, setShowActionEditor,
    draftName, setDraftName,
    draftIcon, setDraftIcon,
    setDraftPresetId,
    setShowActionIconPicker,
    draftShellValue, setDraftShellValue,
    draftRepeatable, setDraftRepeatable,
    draftTemporary, setDraftTemporary,
    draftTemporaryDays, setDraftTemporaryDays,
    draftTimeWindow, setDraftTimeWindow,
    draftUsesTimer, setDraftUsesTimer,
    draftTimerSeconds, setDraftTimerSeconds,
  } = taskEditor;
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
  const appDataState = useAppDataState();
  const {
    nickname,
    setNickname,
    actions,
    setActions,
    records,
    setRecords,
    language,
    setLanguage,
    theme,
    setTheme,
    shellBalance,
    setShellBalance,
    shellsEarned,
    setShellsEarned,
    setRewardClaims,
    rewards,
    setRewards,
  } = appDataState;
  const {
    account,
    authReady,
    authMode,
    changeAuthMode,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    confirmPassword,
    setConfirmPassword,
    loginError,
    loginPending,
    registerError,
    registerPending,
    showLogin,
    setShowLogin,
    login,
    register,
    logout,
  } = useAccountSync(appDataState);
  const {
    clockNow,
    timerAction,
    timerPhase,
    timerSecondsLeft,
    timerMultiplier,
    timerRingResetting,
    openTimer,
    startTimer: startActionTimer,
    closeTimer: closeActionTimer,
    changeMultiplier: changeTimerMultiplier,
    skipTimer: skipActionTimer,
  } = useTimer({
    setActions,
    onComplete: recordActionMultiple,
    closeWithMotion: (close) => closeSecondaryModal("timer", close),
  });
  const [tab, setTab] = useState<Tab>("today");
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>("today");
  const [orbitRippleKey, setOrbitRippleKey] = useState(1);
  const [lastCheckedAction, setLastCheckedAction] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastTimers = useRef<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bankDropKey, setBankDropKey] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => activityDay(new Date()));
  const {
    appScrollRef,
    dragOffset,
    isDraggingTabs,
    recordActionMenu,
    setRecordActionMenu,
    recordActionMenuPosition,
    manageActionMenu,
    setManageActionMenu,
    manageActionMenuPosition,
    profileActionSwipe,
    setProfileActionSwipe,
    closeSecondaryModal,
    startEditorSheetSwipe,
    moveEditorSheetSwipe,
    finishEditorSheetSwipe,
    cancelEditorSheetSwipe,
    modalMotionClass,
    modalMotionStyle,
    modalDragHandle,
    openRecordActionMenu,
    openManageActionMenu,
    startActionLongPress,
    moveActionLongPress,
    finishActionLongPress,
    startProfileActionSwipe,
    moveProfileActionSwipe,
    finishProfileActionSwipe,
    cancelProfileActionSwipe,
    startManageActionLongPress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    cancelTouchGesture,
    consumeSuppressedQuickClick,
    resetForNavigation,
    dismissTransientUi,
  } = useGesture({
    tab,
    language,
    showCalendar,
    showSettings,
    onChangeTab: changeTab,
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => null);
    }

    return () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  }, [language, theme]);

  useEffect(() => {
    if (tab !== "profile") return;
    const frame = window.requestAnimationFrame(() => {
      setBankDropKey((current) => current + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  const todayRecords = useMemo(
    () => recordsForToday(records, clockNow),
    [clockNow, records],
  );
  const weekRecords = useMemo(() => recordsForWeek(records, clockNow), [clockNow, records]);
  const monthRecords = useMemo(() => recordsForMonth(records, clockNow), [clockNow, records]);
  const calendarRecordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      const key = activityDay(new Date(record.createdAt));
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [records]);
  const selectedDayRecords = useMemo(
    () =>
      records.filter(
        (record) => activityDay(new Date(record.createdAt)) === selectedCalendarDay,
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

  async function handleLogin(event: FormEvent) {
    if (await login(event)) {
      closeSecondaryModal("login", () => setShowLogin(false));
    }
  }

  async function handleRegister(event: FormEvent) {
    if (await register(event)) {
      closeSecondaryModal("login", () => setShowLogin(false));
    }
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
    const completion = completeTask(action, {
      count,
      source,
      timestamp: runtimeNow(),
    });
    setRecords((current) => [...completion.records, ...current]);
    setLastCheckedAction({ id: action.id, token: runtimeNow() });
    setShellBalance((current) => addShells(current, completion.shellGain));
    setShellsEarned((current) => addShells(current, completion.shellGain));
    showToast(
      `栗壳 +${completion.shellGain}`,
      "小事已记录",
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

  function handleQuickActionClick(action: MicroAction) {
    if (consumeSuppressedQuickClick(action.id)) return;
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
      openTimer(action);
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

  function requestReward(reward: Reward) {
    if (!canAfford(shellBalance, reward.cost)) {
      showToast(`再积累 ${reward.cost - shellBalance} 枚栗壳就可以兑换`, "栗壳还不够");
      return;
    }
    if (showRewardEditor) {
      closeSecondaryModal("reward-editor", () => {
        setShowRewardEditor(false);
        setPendingReward(reward);
      });
      return;
    }
    setPendingReward(reward);
  }

  function redeemReward() {
    if (!pendingReward || !canAfford(shellBalance, pendingReward.cost)) return;
    const claim = createRewardClaim(pendingReward);
    setShellBalance((current) => spendShells(current, pendingReward.cost));
    setRewardClaims((current) => [claim, ...current]);
    showToast(`${pendingReward.name}，现在就去享受吧`, "奖励已兑换");
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
    setDraftIcon(action?.icon || randomActionIcon());
    setDraftPresetId(action ? null : "custom");
    setShowActionIconPicker(false);
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
    setDraftIcon(randomActionIcon());
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

  function saveAction(event: FormEvent) {
    event.preventDefault();
    if (!draftName.trim()) return;
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

  function scrollScreenToTop(selector: string) {
    window.requestAnimationFrame(() => {
      const screen = appScrollRef.current?.querySelector<HTMLElement>(selector);
      if (screen) screen.scrollTop = 0;
    });
  }

  function changeTab(nextTab: Tab) {
    resetForNavigation();
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
    const activeDate = new Date(`${activityDay(now)}T12:00:00`);
    setCalendarMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
    setSelectedCalendarDay(activityDay(now));
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
      changeAuthMode("login");
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
      setShowRewardManager(true);
    } else {
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
  const growthPeriodOptions: {
    id: GrowthPeriod;
    label: string;
    count: number;
  }[] = [
    {
      id: "today",
      label: tr("今日", "Today"),
      count: todayRecords.length,
    },
    {
      id: "week",
      label: tr("本周", "This week"),
      count: weekRecords.length,
    },
    {
      id: "month",
      label: tr("本月", "This month"),
      count: monthRecords.length,
    },
    {
      id: "total",
      label: tr("总计", "Total"),
      count: records.length,
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
  const visibleTodayActions = actionsInTimeOrder(actions);
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
        || showRewardEditor
        || showRewardManager
        || showProfileEditor
          ? " editor-modal-open"
          : ""
      }`}
    >
      {(tab !== "today"
        || showCalendar
        || showSettings
        || showActionManager
        || showActionEditor
        || showRewardManager
        || showRewardEditor
        || showProfileEditor) && (
        <button
          className="global-home-button"
          type="button"
          aria-label={tr("回到主页今日", "Return to Today")}
          onClick={returnToToday}
        >
          <AppIcon name="home" />
        </button>
      )}

      <section className="app-frame">
        <div
          className={`app-scroll${isDraggingTabs ? " tab-swipe-active" : ""}`}
          ref={appScrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={cancelTouchGesture}
          onScrollCapture={dismissTransientUi}
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
            />
          )}

          {showSettings && (
            <SettingsPage
              language={language}
              theme={theme}
              isSignedIn={Boolean(account)}
              recordCount={records.length}
              onClose={closeSettings}
              onResetData={resetData}
              setLanguage={setLanguage}
              setTheme={setTheme}
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
              todayRecords={todayRecords}
              orbitRippleKey={orbitRippleKey}
              setOrbitRippleKey={setOrbitRippleKey}
              visibleActions={visibleTodayActions}
              clockNow={clockNow}
              lastCheckedAction={lastCheckedAction}
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
              period={growthPeriod}
              periodOptions={growthPeriodOptions}
              activePeriod={activeGrowthPeriod}
              activeRecords={activeGrowthRecords}
              setPeriod={setGrowthPeriod}
              onOpenCalendar={openCalendar}
            />

            <ProfilePage
              active={tab === "profile"}
              account={account}
              actions={actions}
              rewards={rewards}
              shellBalance={shellBalance}
              shellsEarned={shellsEarned}
              bankDropKey={bankDropKey}
              profileActionSwipe={profileActionSwipe}
              tr={tr}
              onOpenProfile={openProfileEditor}
              onOpenSettings={openSettings}
              onOpenRewardManager={() => setShowRewardManager(true)}
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
        <ProfileEditor
          account={account}
          nickname={draftProfileNickname}
          tr={tr}
          onNicknameChange={setDraftProfileNickname}
          onClose={closeProfileEditor}
          onImmediateClose={() => setShowProfileEditor(false)}
          onLogout={() => {
            setShowProfileEditor(false);
            void logout();
          }}
          onSubmit={saveProfile}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
          onSwipeStart={startEditorSheetSwipe}
          onSwipeMove={moveEditorSheetSwipe}
          onSwipeEnd={finishEditorSheetSwipe}
          onSwipeCancel={cancelEditorSheetSwipe}
        />
      )}

      <TaskEditors
        state={taskEditor}
        actions={actions}
        safeTimerSeconds={safeDraftTimerSeconds}
        timerSliderMax={timerSliderMax}
        timerSliderProgress={timerSliderProgress}
        tr={tr}
        closeSecondaryModal={closeSecondaryModal}
        modalClassName={modalMotionClass}
        modalStyle={modalMotionStyle}
        dragHandle={modalDragHandle}
        onOpenEditor={openActionEditor}
        onCloseEditor={closeActionEditor}
        onApplyPreset={applyActionPreset}
        onStartCustom={startCustomAction}
        onSave={saveAction}
        onDelete={deleteAction}
      />

      <RewardEditors
        showEditor={showRewardEditor}
        showManager={showRewardManager}
        rewards={rewards}
        editingReward={editingReward}
        draftName={draftRewardName}
        draftDescription={draftRewardDescription}
        draftIcon={draftRewardIcon}
        draftCost={draftRewardCost}
        onCloseEditor={() => closeSecondaryModal("reward-editor", () => setShowRewardEditor(false))}
        onImmediateCloseEditor={() => setShowRewardEditor(false)}
        onCloseManager={() => closeSecondaryModal("reward-manager", () => setShowRewardManager(false))}
        onImmediateCloseManager={() => setShowRewardManager(false)}
        onOpenEditor={openRewardEditor}
        onDraftNameChange={setDraftRewardName}
        onDraftDescriptionChange={setDraftRewardDescription}
        onDraftIconChange={setDraftRewardIcon}
        onDraftCostChange={setDraftRewardCost}
        onSave={saveReward}
        onRedeem={requestReward}
        onDelete={deleteReward}
        onReorder={(sourceId, targetId) => setRewards((current) => reorderRewards(current, sourceId, targetId))}
        modalClassName={modalMotionClass}
        modalStyle={modalMotionStyle}
        dragHandle={modalDragHandle}
        onSwipeStart={startEditorSheetSwipe}
        onSwipeMove={moveEditorSheetSwipe}
        onSwipeEnd={finishEditorSheetSwipe}
        onSwipeCancel={cancelEditorSheetSwipe}
      />

      {showLogin && (
        <LoginDialog
          mode={authMode}
          username={loginUsername}
          password={loginPassword}
          confirmPassword={confirmPassword}
          error={authMode === "register" ? registerError : loginError}
          pending={authMode === "register" ? registerPending : loginPending}
          tr={tr}
          onUsernameChange={setLoginUsername}
          onPasswordChange={setLoginPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onModeChange={changeAuthMode}
          onClose={() => closeSecondaryModal("login", () => setShowLogin(false))}
          onImmediateClose={() => setShowLogin(false)}
          onSubmit={authMode === "register" ? handleRegister : handleLogin}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
        />
      )}

      {timerAction && (
        <TimerDialog
          action={timerAction}
          phase={timerPhase}
          secondsLeft={timerSecondsLeft}
          multiplier={timerMultiplier}
          ringResetting={timerRingResetting}
          tr={tr}
          onClose={() => closeSecondaryModal("timer", closeActionTimer)}
          onImmediateClose={closeActionTimer}
          onStart={startActionTimer}
          onSkip={skipActionTimer}
          onMultiplierChange={changeTimerMultiplier}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
        />
      )}

      <TaskQuickMenus
        recordAction={recordActionMenu}
        recordPosition={recordActionMenuPosition}
        todayCount={actionMenuTodayCount}
        manageAction={manageActionMenu}
        managePosition={manageActionMenuPosition}
        tr={tr}
        onCloseRecord={() => setRecordActionMenu(null)}
        onCloseManage={() => setManageActionMenu(null)}
        onEdit={openActionEditor}
        onUndo={undoLatestActionRecord}
        onDelete={requestActionDelete}
      />

      {pendingReward && (
        <RewardRedeemDialog
          reward={pendingReward}
          shellBalance={shellBalance}
          onClose={() => closeSecondaryModal("reward-confirm", () => setPendingReward(null))}
          onImmediateClose={() => setPendingReward(null)}
          onConfirm={redeemReward}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
        />
      )}

      {confirmDialog && (
        <ConfirmActionDialog
          dialog={confirmDialog}
          onClose={() => closeSecondaryModal("confirm", () => setConfirmDialog(null))}
          onImmediateClose={() => setConfirmDialog(null)}
          onConfirm={confirmAction}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
        />
      )}

    </main>
  );
}
