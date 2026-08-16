"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

import { isTemporaryActionExpired } from "../domain/task-rules";
import type { MicroAction, TimerPhase } from "../types";

type UseTimerOptions = {
  setActions: Dispatch<SetStateAction<MicroAction[]>>;
  onComplete: (action: MicroAction, count: number) => void;
  closeWithMotion: (close: () => void) => void;
};

export function useTimer({ setActions, onComplete, closeWithMotion }: UseTimerOptions) {
  const [clockNow, setClockNow] = useState(() => new Date());
  const [timerAction, setTimerAction] = useState<MicroAction | null>(null);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerMultiplier, setTimerMultiplier] = useState(1);
  const [timerRingResetting, setTimerRingResetting] = useState(false);
  const completeRef = useRef(onComplete);
  const closeWithMotionRef = useRef(closeWithMotion);

  useEffect(() => {
    completeRef.current = onComplete;
    closeWithMotionRef.current = closeWithMotion;
  }, [closeWithMotion, onComplete]);

  // This effect is an explicit countdown phase state machine.
  /* eslint-disable react-hooks/set-state-in-effect */
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
    const interval = window.setInterval(refreshTimeAndTemporaryActions, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshTimeAndTemporaryActions();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setActions]);

  useEffect(() => {
    if (!timerAction || timerPhase === "idle") return;

    if (timerPhase === "success") {
      const completedAction = timerAction;
      const completedCount = timerMultiplier;
      const timeout = window.setTimeout(() => {
        closeWithMotionRef.current(() => {
          setTimerAction(null);
          setTimerPhase("idle");
          setTimerSecondsLeft(0);
          setTimerMultiplier(1);
          completeRef.current(completedAction, completedCount);
        });
      }, 1900);
      return () => window.clearTimeout(timeout);
    }

    if (timerSecondsLeft > 0) {
      const timeout = window.setTimeout(() => {
        setTimerSecondsLeft((current) => Math.max(0, current - 1));
      }, 1000);
      return () => window.clearTimeout(timeout);
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

    const timeout = window.setTimeout(() => {
      setTimerPhase("success");
      setTimerSecondsLeft(0);
      if ("vibrate" in navigator) navigator.vibrate([28, 45, 28]);
    }, 100);
    return () => window.clearTimeout(timeout);
  }, [timerAction, timerMultiplier, timerPhase, timerSecondsLeft]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!timerRingResetting) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setTimerRingResetting(false));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [timerRingResetting]);

  function openTimer(action: MicroAction) {
    setTimerAction(action);
    setTimerPhase("idle");
    setTimerRingResetting(false);
    setTimerMultiplier(1);
    setTimerSecondsLeft(action.timerSeconds || 0);
  }

  function startTimer() {
    if (!timerAction || timerPhase !== "idle") return;
    setTimerPhase("preparing");
    setTimerSecondsLeft(3);
  }

  function closeTimer() {
    if (timerPhase === "success") return;
    setTimerAction(null);
    setTimerPhase("idle");
    setTimerRingResetting(false);
    setTimerSecondsLeft(0);
    setTimerMultiplier(1);
  }

  function changeMultiplier(delta: number) {
    if (!timerAction || timerPhase !== "idle" || timerAction.repeatable === false) return;
    const nextMultiplier = Math.min(60, Math.max(1, timerMultiplier + delta));
    setTimerMultiplier(nextMultiplier);
    setTimerSecondsLeft(
      Math.max(1, (timerAction.timerSeconds || 1) * nextMultiplier),
    );
  }

  function skipTimer() {
    if (!timerAction || timerPhase === "success") return;
    setTimerPhase("success");
    setTimerSecondsLeft(0);
    if ("vibrate" in navigator) navigator.vibrate([28, 45, 28]);
  }

  return {
    clockNow,
    timerAction,
    timerPhase,
    timerSecondsLeft,
    timerMultiplier,
    timerRingResetting,
    openTimer,
    startTimer,
    closeTimer,
    changeMultiplier,
    skipTimer,
  };
}
