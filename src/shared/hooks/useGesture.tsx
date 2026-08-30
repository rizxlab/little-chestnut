"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { PROFILE_ACTION_SWIPE_WIDTH } from "../../features/tasks/constants";
import type { MicroAction } from "../../features/tasks/types";
import type { Language } from "../../features/settings/types";
import { runtimeNow } from "../utils/runtime";

type UseGestureOptions = {
  language: Language;
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
    engaged: boolean;
  } | null>(null);
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
      engaged: false,
    };
    if (baseOffset !== 0) {
      setProfileActionSwipe({ id: action.id, offset: baseOffset, dragging: false });
    }
  }

  function moveProfileActionSwipe(event: ReactTouchEvent<HTMLDivElement>) {
    const start = profileActionSwipeStartRef.current;
    if (!start || event.touches.length !== 1) return;
    event.stopPropagation();
    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 12) {
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.25 ? "horizontal" : "vertical";
    }
    if (start.axis === "vertical") {
      clearLongPressTimer();
      profileActionSwipeStartRef.current = null;
      setProfileActionSwipe(null);
      return;
    }
    if (start.axis !== "horizontal") return;
    start.engaged = true;
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
    if (start.axis !== "horizontal" || !start.engaged || event.changedTouches.length !== 1) {
      if (start.baseOffset === 0) setProfileActionSwipe(null);
      return;
    }
    const deltaX = event.changedTouches[0].clientX - start.x;
    const velocity = deltaX / Math.max(1, runtimeNow() - start.time);
    const finalOffset = Math.max(-PROFILE_ACTION_SWIPE_WIDTH, Math.min(8, start.baseOffset + deltaX));
    const isDeliberateLeftFlick = deltaX <= -24 && velocity < -0.25;
    const shouldOpen = isDeliberateLeftFlick || finalOffset < -PROFILE_ACTION_SWIPE_WIDTH / 2;
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

  function consumeSuppressedQuickClick(actionId: string) {
    if (suppressQuickClickRef.current !== actionId) return false;
    suppressQuickClickRef.current = null;
    return true;
  }

  function resetForNavigation() {
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
    consumeSuppressedQuickClick,
    resetForNavigation,
    dismissTransientUi,
  };
}
