import type { ToastState } from "../../app/types";

type ToastStackProps = {
  toasts: ToastState[];
  onUndo: (toastId: string, recordId: string) => void;
};

export function ToastStack({ toasts, onUndo }: ToastStackProps) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div className={`toast ${toast.leaving ? "leaving" : ""}`} role="status" key={toast.id}>
          <span className={`toast-check ${toast.undone ? "undone" : ""}`} aria-hidden="true">
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
              onClick={() => onUndo(toast.id, toast.undoRecordId!)}
            >
              撤销
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
