import type { CSSProperties, ReactNode } from "react";

import type { Reward } from "../types";
import { AppIcon } from "../../../components/ui/AppIcon";
import { ContentIcon } from "../../../components/ui/ContentIcon";

type RewardRedeemDialogProps = {
  reward: Reward;
  shellBalance: number;
  onClose: () => void;
  onImmediateClose: () => void;
  onConfirm: () => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
};

export function RewardRedeemDialog(props: RewardRedeemDialogProps) {
  const { reward, shellBalance, onClose, onImmediateClose, onConfirm, modalClassName,
    modalStyle, dragHandle } = props;
  return (
    <div className="modal-backdrop reward-backdrop" role="presentation" onClick={onClose}>
      <section className={modalClassName("reward-confirm", "bottom-sheet reward-sheet")} style={modalStyle("reward-confirm")} role="dialog" aria-modal="true" aria-labelledby="reward-title" aria-describedby="reward-description" onClick={(event) => event.stopPropagation()}>
        {dragHandle("reward-confirm", onImmediateClose)}
        <button className="close-button" type="button" aria-label="关闭" onClick={onClose}><AppIcon name="close" /></button>
        <span className="reward-sheet-icon" aria-hidden="true"><ContentIcon value={reward.icon} /></span>
        <span className="overline">奖励确认</span>
        <h2 id="reward-title">兑换“{reward.name}”</h2>
        <p id="reward-description">将使用 {reward.cost} 枚栗壳。兑换后，别忘了真的把这份奖励送给自己。</p>
        <div className="reward-cost-preview"><span>当前 {shellBalance}</span><i aria-hidden="true"><AppIcon name="chevronRight" /></i><strong>剩余 {shellBalance - reward.cost}</strong></div>
        <div className="dialog-actions"><button className="dialog-button secondary" type="button" onClick={onClose}>再想想</button><button className="dialog-button reward-confirm" type="button" onClick={onConfirm}>确认兑换</button></div>
      </section>
    </div>
  );
}
