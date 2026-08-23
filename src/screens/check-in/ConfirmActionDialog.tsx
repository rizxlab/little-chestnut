import type { CSSProperties, ReactNode } from "react";

import type { ConfirmDialog } from "../../app/types";
import { AppIcon } from "../../components/ui/AppIcon";

type ConfirmActionDialogProps = {
  dialog: ConfirmDialog;
  onClose: () => void;
  onImmediateClose: () => void;
  onConfirm: () => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
};

export function ConfirmActionDialog(props: ConfirmActionDialogProps) {
  const { dialog, onClose, onImmediateClose, onConfirm, modalClassName, modalStyle,
    dragHandle } = props;
  const danger = dialog.kind === "reset-data" || dialog.kind === "delete-reward";
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className={modalClassName("confirm", `bottom-sheet confirm-sheet ${danger ? "danger-sheet" : ""}`)} style={modalStyle("confirm")} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" onClick={(event) => event.stopPropagation()}>
        {dragHandle("confirm", onImmediateClose)}
        <span className="dialog-symbol" aria-hidden="true"><AppIcon name={dialog.kind === "reset-data" ? "undo" : "delete"} /></span>
        <span className="overline">{dialog.kind === "reset-data" ? "谨慎操作" : dialog.kind === "delete-reward" ? "整理奖励" : "整理微行动"}</span>
        <h2 id="confirm-title">{dialog.kind === "reset-data" ? "要重新开始吗？" : dialog.kind === "delete-reward" ? "删除这个奖励？" : "删除这个微行动？"}</h2>
        <p id="confirm-description">{dialog.kind === "reset-data" ? "所有小事记录会被清空，微行动和奖励清单将恢复默认状态。此操作无法撤销。" : dialog.kind === "delete-reward" ? `“${dialog.reward.name}”将从奖励清单中移除，过去的兑换记录仍会保留。` : `“${dialog.action.name}”将从你的微行动中移除，已经留下的记录仍会保留。`}</p>
        <div className="dialog-actions"><button className="dialog-button secondary" type="button" onClick={onClose}>先保留</button><button className="dialog-button danger" type="button" onClick={onConfirm}>{dialog.kind === "reset-data" ? "清空并重置" : "确认删除"}</button></div>
      </section>
    </div>
  );
}
