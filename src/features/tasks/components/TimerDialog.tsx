import type { CSSProperties, ReactNode } from "react";

import type { MicroAction, TimerPhase } from "../types";
import { AppIcon } from "../../../components/ui/AppIcon";

type TimerDialogProps = {
  action: MicroAction;
  phase: TimerPhase;
  secondsLeft: number;
  multiplier: number;
  ringResetting: boolean;
  tr: (chinese: string, english: string) => string;
  onClose: () => void;
  onImmediateClose: () => void;
  onStart: () => void;
  onSkip: () => void;
  onMultiplierChange: (delta: number) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
};

export function TimerDialog(props: TimerDialogProps) {
  const { action, phase, secondsLeft, multiplier, ringResetting, tr, onClose, onImmediateClose,
    onStart, onSkip, onMultiplierChange, modalClassName, modalStyle,
    dragHandle } = props;
  const duration = Math.max(1, (action.timerSeconds || 1) * multiplier);
  const ringStyle = {
    "--timer-progress": `${phase === "success" ? 360 : phase === "preparing" ? 0 : (secondsLeft / duration) * 360}deg`,
    "--timer-duration": `${duration}s`,
    "--timer-ring-color": phase === "success" ? "#6f9466" : phase === "preparing" ? "#8993aa" : "var(--chestnut)",
    "--timer-ring-track": phase === "success" ? "rgba(111, 148, 102, .12)" : phase === "preparing" ? "rgba(137, 147, 170, .14)" : "rgba(111, 59, 39, .1)",
  } as CSSProperties;

  return (
    <div className="modal-backdrop timer-backdrop" role="presentation" onClick={phase === "success" ? undefined : onClose}>
      <section
        className={modalClassName("timer", `bottom-sheet timer-sheet timer-phase-${phase} ${phase === "success" ? "timer-succeeded" : ""}`)}
        style={modalStyle("timer")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timer-title"
        aria-describedby="timer-description"
        onClick={(event) => event.stopPropagation()}
      >
        {phase !== "success" && dragHandle("timer", onImmediateClose)}
        {phase !== "success" && <button className="close-button" type="button" aria-label={tr("关闭计时", "Close timer")} onClick={onClose}><AppIcon name="close" /></button>}
        <span className="overline">{phase === "success" ? tr("完成", "COMPLETE") : phase === "preparing" ? tr("准备一下", "GET READY") : phase === "running" ? tr("正在计时", "IN PROGRESS") : tr("计时小事", "TIMED ACTION")}</span>
        <div className={`timer-clock ${phase}${ringResetting ? " timer-ring-reset" : ""}`} style={ringStyle}>
          {phase === "success" && <span className="timer-success-burst" aria-hidden="true"><b /><b /><b /><b /><b /><b /></span>}
          <div>
            {phase === "success" ? <span className="timer-success-check" aria-hidden="true"><AppIcon name="check" /></span> : <><span className="timer-phase-icon" aria-hidden="true">{phase === "preparing" ? tr("预备", "READY") : action.icon}</span><span className="timer-countdown-value"><strong>{secondsLeft}</strong><small>{tr("秒", "sec")}</small></span></>}
          </div>
        </div>
        <h2 id="timer-title">{phase === "success" ? tr("打卡成功", "Check-in complete") : phase === "preparing" ? tr("准备开始", "Get ready") : action.name}</h2>
        <p id="timer-description" aria-live="polite">
          {phase === "success" ? tr(`${action.name}已完成 ${multiplier} 次，成长正在记录`, `${action.name} is complete ×${multiplier} and being recorded`) : phase === "preparing" ? tr("保持准备，计时马上开始", "Get ready — the timer is about to start") : phase === "running" ? tr(`保持住，结束后会自动打卡 ${multiplier} 次`, `Keep going — completion will check in ×${multiplier}`) : tr("点击开始，3 秒准备后进入倒计时", "Start for a 3-second preparation, then the countdown begins")}
        </p>
        {phase === "idle" && (
          <div className="timer-duration-picker">
            <span>{tr("选择时长", "Duration")}</span>
            <div><button type="button" aria-label={tr("减少一档时长", "Decrease duration")} disabled={multiplier === 1} onClick={() => onMultiplierChange(-1)}><AppIcon name="minus" /></button><strong><span className="timer-duration-value"><b>{duration}</b><small>{tr("秒", "sec")}</small></span><em>× {multiplier} {tr("次", "check-ins")}</em></strong><button type="button" aria-label={tr("增加一档时长", "Increase duration")} disabled={multiplier === 60 || action.repeatable === false} onClick={() => onMultiplierChange(1)}><AppIcon name="add" /></button></div>
            <small>{tr(action.repeatable === false ? "此小事每天仅可完成一次" : `每档增加 ${action.timerSeconds || 1} 秒，完成后按倍数记录`, action.repeatable === false ? "This action can be completed once per day" : `Each step adds ${action.timerSeconds || 1} seconds and one check-in`)}</small>
          </div>
        )}
        {phase === "idle" ? <div className="dialog-actions"><button className="dialog-button secondary" type="button" onClick={onClose}>{tr("取消", "Cancel")}</button><button className="dialog-button timer-start-button" type="button" onClick={onStart}>{tr("开始", "Start")}</button></div> : phase !== "success" ? <div className="dialog-actions timer-live-actions"><button className="dialog-button secondary" type="button" onClick={onClose}>{tr("取消计时", "Cancel timer")}</button><button className="dialog-button timer-skip-button" type="button" onClick={onSkip}>{tr("跳过并完成", "Skip and complete")}</button></div> : <small className="timer-success-note">{tr("正在保存…", "Saving…")}</small>}
        {phase === "idle" && <button className="timer-skip-link" type="button" onClick={onSkip}>{tr("已经完成？跳过计时直接打卡", "Already done? Skip the timer")}</button>}
      </section>
    </div>
  );
}
