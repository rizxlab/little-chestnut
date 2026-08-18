"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_CARD_MILESTONE_FIRST, DEFAULT_CARD_MILESTONE_SECOND, NAV_ITEMS } from "../../app/constants";
import type { ConfirmDialog, GrowthPeriod, Tab, ToastState } from "../../app/types";
import { BottomNavigation } from "../../components/layout/BottomNavigation";
import { AppIcon } from "../../components/ui/AppIcon";
import { ToastStack } from "../../components/ui/ToastStack";
import { CalendarPage } from "../CalendarPage";
import { SettingsPage } from "../SettingsPage";
import { TodayPage } from "../TodayPage";
import { GrowthPage } from "../GrowthPage";
import { ProfilePage } from "../ProfilePage";
import { AREA_COLORS, DEFAULT_AREAS } from "../../features/growth/constants";
import { growthLevelFor, growthTotals, normalizedTagIds } from "../../features/growth/domain/growth-rules";
import type { GrowthArea as Area, GrowthRecord, GrowthSource as Source } from "../../features/growth/types";
import { DEFAULT_REWARDS } from "../../features/rewards/constants";
import type { Reward } from "../../features/rewards/types";
import { createRewardClaim } from "../../features/rewards/domain/redeem-reward";
import { useRewardEditorState } from "../../features/rewards/hooks/useRewardEditorState";
import { RewardEditors } from "../../features/rewards/components/RewardEditors";
import { RewardRedeemDialog } from "../../features/rewards/components/RewardRedeemDialog";
import { addShells, canAfford, removeShells, spendShells } from "../../features/shells/domain/wallet";
import { DEFAULT_ACTIONS } from "../../features/tasks/constants";
import { actionTimeOptionFor, actionTimeWindowFor, actionsInTimeOrder, isActionAvailableNow, shellValueFor, temporaryActionDays, temporaryExpirationDay } from "../../features/tasks/domain/task-rules";
import { completeTask } from "../../features/tasks/domain/complete-task";
import { useTimer } from "../../features/tasks/hooks/useTimer";
import { TimerDialog } from "../../features/tasks/components/TimerDialog";
import { TaskEditors } from "../../features/tasks/components/TaskEditors";
import { TaskQuickMenus } from "../../features/tasks/components/TaskQuickMenus";
import { useTaskEditorState } from "../../features/tasks/hooks/useTaskEditorState";
import type { MicroAction } from "../../features/tasks/types";
import { useProfileEditorState } from "../../features/profile/hooks/useProfileEditorState";
import { ProfileEditor } from "../../features/profile/components/ProfileEditor";
import { useGrowthEditorState } from "../../features/growth/hooks/useGrowthEditorState";
import { GrowthEditors } from "../../features/growth/components/GrowthEditors";
import { GrowthDetailDialog } from "../../features/growth/components/GrowthDetailDialog";
import { useAccountSync } from "../../features/account/hooks/useAccountSync";
import { LoginDialog } from "../../features/account/components/LoginDialog";
import { isToday, localDay, recordsForMonth, recordsForToday, recordsForWeek } from "../../features/statistics/domain/date-ranges";
import { createRuntimeId, runtimeNow } from "../../shared/utils/runtime";
import { useGesture } from "../../shared/hooks/useGesture";
import { useAppDataState } from "../../stores/useAppDataState";
import { ConfirmActionDialog } from "./ConfirmActionDialog";


export function CheckInWorkspace() {
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
    setDraftPresetId,
    setShowActionIconPicker,
    draftTags, setDraftTags,
    draftValue, setDraftValue,
    draftShellValue, setDraftShellValue,
    draftRepeatable, setDraftRepeatable,
    draftTemporary, setDraftTemporary,
    draftTemporaryDays, setDraftTemporaryDays,
    draftTimeWindow, setDraftTimeWindow,
    draftUsesTimer, setDraftUsesTimer,
    draftTimerSeconds, setDraftTimerSeconds,
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
  const appDataState = useAppDataState();
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
  } = appDataState;
  const {
    account,
    authReady,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    loginPending,
    showLogin,
    setShowLogin,
    login,
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
  const [actionAreaFilter, setActionAreaFilter] = useState("all");
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
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => localDay(new Date()));
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
    startAreaLongPress,
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
    onOpenAreaEditor: openAreaEditor,
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
    if (await login(event)) {
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

  function handleQuickActionClick(action: MicroAction) {
    if (consumeSuppressedQuickClick(action.id)) return;
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
        <AppIcon name="home" />
      </button>

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
        areas={areas}
        safeTimerSeconds={safeDraftTimerSeconds}
        timerSliderMax={timerSliderMax}
        timerSliderProgress={timerSliderProgress}
        tr={tr}
        tagsFor={tagsFor}
        closeSecondaryModal={closeSecondaryModal}
        modalClassName={modalMotionClass}
        modalStyle={modalMotionStyle}
        dragHandle={modalDragHandle}
        onOpenEditor={openActionEditor}
        onCloseEditor={closeActionEditor}
        onApplyPreset={applyActionPreset}
        onStartCustom={startCustomAction}
        onToggleTag={toggleDraftTag}
        onSave={saveAction}
        onDelete={deleteAction}
      />

      {growthAreaDetail && (
        <GrowthDetailDialog
          detail={growthAreaDetail}
          actions={growthAreaDetailActions}
          language={language}
          tr={tr}
          onClose={() => closeSecondaryModal("growth-area-detail", () => setGrowthAreaDetailId(null))}
          onImmediateClose={() => setGrowthAreaDetailId(null)}
          modalClassName={modalMotionClass}
          modalStyle={modalMotionStyle}
          dragHandle={modalDragHandle}
          onSwipeStart={startEditorSheetSwipe}
          onSwipeMove={moveEditorSheetSwipe}
          onSwipeEnd={finishEditorSheetSwipe}
          onSwipeCancel={cancelEditorSheetSwipe}
        />
      )}

      <GrowthEditors
        showManager={showAreaManager}
        showEditor={showAreaEditor}
        areas={areas}
        editingArea={editingArea}
        draftName={draftAreaName}
        draftIcon={draftAreaIcon}
        draftColor={draftAreaColor}
        actionCountFor={(areaId) => actions.filter((action) => normalizedTagIds(action).includes(areaId)).length}
        onCloseManager={() => closeSecondaryModal("area-manager", () => setShowAreaManager(false))}
        onImmediateCloseManager={() => setShowAreaManager(false)}
        onOpenEditor={openAreaEditor}
        onCloseEditor={() => closeSecondaryModal("area-editor", closeAreaEditor)}
        onImmediateCloseEditor={closeAreaEditor}
        onDraftNameChange={setDraftAreaName}
        onDraftIconChange={setDraftAreaIcon}
        onDraftColorChange={setDraftAreaColor}
        onSave={saveArea}
        onDelete={deleteArea}
        modalClassName={modalMotionClass}
        modalStyle={modalMotionStyle}
        dragHandle={modalDragHandle}
        onSwipeStart={startEditorSheetSwipe}
        onSwipeMove={moveEditorSheetSwipe}
        onSwipeEnd={finishEditorSheetSwipe}
        onSwipeCancel={cancelEditorSheetSwipe}
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
        onDelete={deleteReward}
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
          username={loginUsername}
          password={loginPassword}
          error={loginError}
          pending={loginPending}
          tr={tr}
          onUsernameChange={setLoginUsername}
          onPasswordChange={setLoginPassword}
          onClose={() => closeSecondaryModal("login", () => setShowLogin(false))}
          onImmediateClose={() => setShowLogin(false)}
          onSubmit={handleLogin}
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
