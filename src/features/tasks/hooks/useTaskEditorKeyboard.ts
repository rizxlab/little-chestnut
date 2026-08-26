"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type FocusEvent,
  type PointerEvent,
} from "react";

const KEYBOARD_THRESHOLD = 80;
const KEYBOARD_TOP_GAP = 14;
const KEYBOARD_OPEN_LOCK_MS = 900;

function isTextEntry(element: Element | null): element is HTMLElement {
  return Boolean(
    element
    && element instanceof HTMLElement
    && element.matches("input, textarea, [contenteditable='true']"),
  );
}

export function useTaskEditorKeyboard(isOpen: boolean) {
  const editorRef = useRef<HTMLFormElement>(null);
  const layoutHeightRef = useRef(0);
  const scrollBeforeKeyboardRef = useRef(0);
  const lockScrollUntilRef = useRef(0);

  const rememberScrollPosition = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    scrollBeforeKeyboardRef.current = editor.scrollTop;
    lockScrollUntilRef.current = performance.now() + KEYBOARD_OPEN_LOCK_MS;
  }, []);

  const handleFocusCapture = useCallback((event: FocusEvent<HTMLFormElement>) => {
    if (isTextEntry(event.target)) rememberScrollPosition();
  }, [rememberScrollPosition]);

  const handlePointerDownCapture = useCallback(
    (event: PointerEvent<HTMLFormElement>) => {
      const target = event.target instanceof Element ? event.target : null;
      if (isTextEntry(target)) {
        rememberScrollPosition();
        return;
      }

      const activeElement = document.activeElement;
      if (
        isTextEntry(activeElement)
        && editorRef.current?.contains(activeElement)
      ) {
        activeElement.blur();
      }
    },
    [rememberScrollPosition],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!isOpen || !editor || !window.visualViewport) return;
    const viewport = window.visualViewport;

    layoutHeightRef.current = Math.max(
      window.innerHeight,
      document.documentElement.clientHeight,
    );

    function updateKeyboardInset() {
      if (!editorRef.current) return;

      const keyboardInset = Math.max(
        0,
        layoutHeightRef.current - viewport.height - viewport.offsetTop,
      );
      const keyboardIsOpen = keyboardInset >= KEYBOARD_THRESHOLD;

      editorRef.current.style.setProperty(
        "--editor-keyboard-inset",
        keyboardIsOpen ? `${Math.round(keyboardInset + KEYBOARD_TOP_GAP)}px` : "0px",
      );

      if (!keyboardIsOpen) {
        if (!isTextEntry(document.activeElement)) {
          layoutHeightRef.current = Math.max(
            window.innerHeight,
            document.documentElement.clientHeight,
          );
        }
        return;
      }

      if (performance.now() <= lockScrollUntilRef.current) {
        const preservedScrollTop = scrollBeforeKeyboardRef.current;
        window.requestAnimationFrame(() => {
          if (editorRef.current) editorRef.current.scrollTop = preservedScrollTop;
        });
      }
    }

    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);
    updateKeyboardInset();

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
      editor.style.setProperty("--editor-keyboard-inset", "0px");
    };
  }, [isOpen]);

  return {
    editorRef,
    handleFocusCapture,
    handlePointerDownCapture,
  };
}
