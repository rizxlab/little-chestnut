"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { NAV_ITEMS } from "../../app/constants";
import type { Tab } from "../../app/types";
import { PROFILE_ACTION_SWIPE_WIDTH } from "../../features/tasks/constants";
import type { MicroAction } from "../../features/tasks/types";
import type { GrowthArea } from "../../features/growth/types";
import type { Language } from "../../features/settings/types";
import { runtimeNow } from "../utils/runtime";

type UseGestureOptions = {
  tab: Tab;
  language: Language;
  showCalendar: boolean;
  showSettings: boolean;
  onChangeTab: (tab: Tab) => void;
  onOpenAreaEditor: (area: GrowthArea) => void;
};

export function useGesture(options: UseGestureOptions) {
  const [closingModal, setClosingModal] = useState<string | null>(null);
  const [modalDrag, setModalDrag] = useState<{ id: string; offset: number } | null>(null);
  const [recordActionMenu, setRecordActionMenu] = useState<MicroAction | null>(null);
  const [recordActionMenuPosition, setRecordActionMenuPosition] = useState({ left: 12, top: 12 });
  const [manageActionMenu, setManageActionMenu] = useState<MicroAction | null>(null);
  const [manageActionMenuPosition, setManageActionMenuPosition] = useState({ left: 12, top: 12 });
  const [profileActionSwipe, setProfileActionSwipe] = useState<{
    id: string;
    offset: number;
    dragging: boolean;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
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
  const changeTabRef = useRef(options.onChangeTab);
  const openAreaEditorRef = useRef(options.onOpenAreaEditor);

  useEffect(() => {
    changeTabRef.current = options.onChangeTab;
    openAreaEditorRef.current = options.onOpenAreaEditor;
  }, [options.onChangeTab, options.onOpenAreaEditor]);

  useEffect(() => () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    if (modalAnimationTimerRef.current) window.clearTimeout(modalAnimationTimerRef.current);
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function closeSecondaryModal(id: string, close: () => void) {
    if (closingModal) return;
    setClosingModal(id);
    if (modalAnimationTimerRef.current) window.clearTimeout(modalAnimationTimerRef.current);
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
    modalDragStartRef.current = { id, y: event.clientY, time: runtimeNow(), instantClose };
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
    setModalDrag({ id: start.id, offset });
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
        setModalDrag((current) => current?.id === start.id && current.offset === 0 ? null : current);
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
    if ((event.target as HTMLElement).closest(".modal-drag-handle, input, select, textarea")) return;
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
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
      setModalDrag((current) => current?.id === start.id && current.offset === 0 ? null : current);
    }, 180);
  }

  function cancelEditorSheetSwipe() {
    editorSheetSwipeRef.current = null;
    setModalDrag(null);
  }

  function modalMotionClass(id: string, className: string) {
    return `${className} secondary-modal-card${closingModal === id ? " modal-closing" : ""}${modalDrag?.id === id ? " modal-dragging" : ""}`;
  }

  function modalMotionStyle(id: string) {
    return { "--modal-drag-y": `${modalDrag?.id === id ? modalDrag.offset : 0}px` } as CSSProperties;
  }

  function modalDragHandle(id: string, close: () => void, instantClose = false) {
    const label = options.language === "zh" ? "向下拖动关闭" : "Drag down to close";
    return (
      <button
        className="modal-drag-handle"
        type="button"
        aria-label={label}
        onPointerDown={(event) => startModalDrag(id, close, event, instantClose)}
        onPointerMove={moveModalDrag}
        onPointerUp={finishModalDrag}
        onPointerCancel={cancelModalDrag}
      >
        <span aria-hidden="true" />
      </button>
    );
  }

  function openRecordActionMenu(action: MicroAction, rect: DOMRect) {
    const left = Math.min(window.innerWidth - 144, Math.max(12, rect.left + rect.width - 132));
    const top = Math.max(12, rect.top - 103);
    setRecordActionMenuPosition({ left, top });
    setManageActionMenu(null);
    setRecordActionMenu(action);
  }

  function openManageActionMenu(action: MicroAction, rect: DOMRect) {
    const left = Math.min(window.innerWidth - 156, Math.max(12, rect.left + rect.width - 144));
    const top = Math.max(12, rect.top - 103);
    setManageActionMenuPosition({ left, top });
    setRecordActionMenu(null);
    setProfileActionSwipe(null);
    setManageActionMenu(action);
  }

  function startActionLongPress(action: MicroAction, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressQuickClickRef.current = action.id;
      openRecordActionMenu(action, rect);
      if ("vibrate" in navigator) navigator.vibrate(12);
      window.setTimeout(() => {
        if (suppressQuickClickRef.current === action.id) suppressQuickClickRef.current = null;
      }, 700);
      longPressTimerRef.current = null;
    }, 520);
  }

  function moveActionLongPress(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = longPressStartRef.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      clearLongPressTimer();
      longPressStartRef.current = null;
    }
  }

  function finishActionLongPress() {
    clearLongPressTimer();
    longPressStartRef.current = null;
  }

  function startProfileActionSwipe(action: MicroAction, event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || (event.target as HTMLElement).closest(".profile-action-swipe-actions")) return;
    event.stopPropagation();
    const touch = event.touches[0];
    const baseOffset = profileActionSwipe?.id === action.id ? profileActionSwipe.offset : 0;
    profileActionSwipeStartRef.current = {
      id: action.id,
      x: touch.clientX,
      y: touch.clientY,
      time: runtimeNow(),
      baseOffset,
      axis: null,
    };
    setProfileActionSwipe({ id: action.id, offset: baseOffset, dragging: true });
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
    const offset = Math.max(-PROFILE_ACTION_SWIPE_WIDTH, Math.min(8, start.baseOffset + deltaX));
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
    const finalOffset = Math.max(-PROFILE_ACTION_SWIPE_WIDTH, Math.min(8, start.baseOffset + deltaX));
    const shouldOpen = velocity < -0.25 || (velocity <= 0.25 && finalOffset < -PROFILE_ACTION_SWIPE_WIDTH / 2);
    setProfileActionSwipe(shouldOpen ? { id: start.id, offset: -PROFILE_ACTION_SWIPE_WIDTH, dragging: false } : null);
  }

  function cancelProfileActionSwipe(event: ReactTouchEvent<HTMLDivElement>) {
    event.stopPropagation();
    profileActionSwipeStartRef.current = null;
    setProfileActionSwipe(null);
  }

  function startManageActionLongPress(action: MicroAction, event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    longPressTimerRef.current = window.setTimeout(() => {
      openManageActionMenu(action, rect);
      if ("vibrate" in navigator) navigator.vibrate(12);
      longPressTimerRef.current = null;
    }, 520);
  }

  function startAreaLongPress(area: GrowthArea, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      openAreaEditorRef.current(area);
      if ("vibrate" in navigator) navigator.vibrate(12);
      longPressTimerRef.current = null;
    }, 520);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (options.showCalendar || options.showSettings || event.touches.length !== 1) return;
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
      gestureAxisRef.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.08 ? "horizontal" : "vertical";
    }
    if (gestureAxisRef.current === "vertical") {
      if (recordActionMenu) setRecordActionMenu(null);
      return;
    }
    if (gestureAxisRef.current !== "horizontal") return;
    if (event.cancelable) event.preventDefault();
    if (start.screen && start.screen.scrollTop !== start.scrollTop) start.screen.scrollTop = start.scrollTop;
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === options.tab);
    const atFirstEdge = currentIndex === 0 && deltaX > 0;
    const atLastEdge = currentIndex === NAV_ITEMS.length - 1 && deltaX < 0;
    setIsDraggingTabs(true);
    setDragOffset(atFirstEdge || atLastEdge ? deltaX * 0.24 : deltaX);
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const axis = gestureAxisRef.current;
    gestureAxisRef.current = null;
    if (!start || event.changedTouches.length !== 1 || axis !== "horizontal") {
      setIsDraggingTabs(false);
      setDragOffset(0);
      return;
    }
    const deltaX = event.changedTouches[0].clientX - start.x;
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === options.tab);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const velocity = Math.abs(deltaX) / Math.max(1, runtimeNow() - start.time);
    if ((Math.abs(deltaX) >= 68 || velocity >= 0.42) && nextIndex >= 0 && nextIndex < NAV_ITEMS.length) {
      changeTabRef.current(NAV_ITEMS[nextIndex].id);
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

  function consumeSuppressedQuickClick(actionId: string) {
    if (suppressQuickClickRef.current !== actionId) return false;
    suppressQuickClickRef.current = null;
    return true;
  }

  function resetForNavigation() {
    setDragOffset(0);
    setIsDraggingTabs(false);
    setManageActionMenu(null);
    setProfileActionSwipe(null);
  }

  function dismissTransientUi() {
    clearLongPressTimer();
    setRecordActionMenu(null);
    setManageActionMenu(null);
    setProfileActionSwipe(null);
  }

  return {
    appScrollRef,
    closingModal,
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
  };
}
