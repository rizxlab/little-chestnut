import type { CSSProperties, FormEvent, ReactNode, TouchEvent } from "react";

import { IconPicker } from "../../../components/ui/IconPicker";
import { REWARD_COST_OPTIONS, REWARD_ICON_OPTIONS } from "../constants";
import type { Reward } from "../types";

type RewardEditorsProps = {
  showEditor: boolean;
  showManager: boolean;
  rewards: Reward[];
  editingReward: Reward | null;
  draftName: string;
  draftDescription: string;
  draftIcon: string;
  draftCost: number;
  onCloseEditor: () => void;
  onImmediateCloseEditor: () => void;
  onCloseManager: () => void;
  onImmediateCloseManager: () => void;
  onOpenEditor: (reward?: Reward) => void;
  onDraftNameChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onDraftIconChange: (value: string) => void;
  onDraftCostChange: (value: number) => void;
  onSave: (event: FormEvent) => void;
  onDelete: (reward: Reward) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
  onSwipeStart: (key: string, close: () => void, event: TouchEvent<HTMLElement>) => void;
  onSwipeMove: (event: TouchEvent<HTMLElement>) => void;
  onSwipeEnd: (event: TouchEvent<HTMLElement>) => void;
  onSwipeCancel: () => void;
};

export function RewardEditors(props: RewardEditorsProps) {
  const {
    showEditor, showManager, rewards, editingReward, draftName,
    draftDescription, draftIcon, draftCost, onCloseEditor,
    onImmediateCloseEditor, onCloseManager, onImmediateCloseManager,
    onOpenEditor, onDraftNameChange, onDraftDescriptionChange,
    onDraftIconChange, onDraftCostChange, onSave, onDelete, modalClassName,
    modalStyle, dragHandle, onSwipeStart, onSwipeMove, onSwipeEnd, onSwipeCancel,
  } = props;

  return (
    <>
      {showEditor && (
        <div className="modal-backdrop" role="presentation" onClick={onCloseEditor}>
          <form
            className={modalClassName("reward-editor", "bottom-sheet reward-editor")}
            style={modalStyle("reward-editor")}
            tabIndex={-1}
            autoFocus
            onSubmit={onSave}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => onSwipeStart("reward-editor", onImmediateCloseEditor, event)}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeCancel}
          >
            {dragHandle("reward-editor", onImmediateCloseEditor)}
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseEditor}>×</button>
            <span className="overline">{editingReward ? "编辑奖励" : "新的奖励"}</span>
            <h2>{editingReward ? "调整这份小期待" : "想把栗壳换成什么？"}</h2>
            <label>奖励名称<input value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder="例如：看一场电影" /></label>
            <IconPicker label="选择图标" value={draftIcon} options={REWARD_ICON_OPTIONS} onChange={onDraftIconChange} />
            <label>简短说明<input value={draftDescription} onChange={(event) => onDraftDescriptionChange(event.target.value)} placeholder="例如：留一个晚上给喜欢的故事" maxLength={48} /></label>
            <fieldset className="reward-cost-fieldset">
              <legend>所需栗壳</legend>
              <div className="reward-cost-options">
                {REWARD_COST_OPTIONS.map((cost) => (
                  <button className={draftCost === cost ? "selected" : ""} type="button" key={cost} aria-pressed={draftCost === cost} onClick={() => onDraftCostChange(cost)}>
                    <strong>{cost}</strong><small>栗壳</small>
                  </button>
                ))}
              </div>
              <label className="reward-cost-custom"><span>自定义</span><input type="number" inputMode="numeric" min="1" max="9999" value={draftCost} onChange={(event) => onDraftCostChange(Number(event.target.value))} /><small>枚</small></label>
            </fieldset>
            <button className="save-button" type="submit" disabled={!draftName.trim() || draftCost < 1}>{editingReward ? "保存奖励" : "加入奖励清单"}</button>
            {editingReward && <button className="delete-reward-button" type="button" onClick={() => onDelete(editingReward)}>删除这个奖励</button>}
          </form>
        </div>
      )}

      {showManager && (
        <div className="modal-backdrop" role="presentation" onClick={onCloseManager}>
          <section
            className={modalClassName("reward-manager", "bottom-sheet reward-manager")}
            style={modalStyle("reward-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-manager-title"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => onSwipeStart("reward-manager", onImmediateCloseManager, event)}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeCancel}
          >
            {dragHandle("reward-manager", onImmediateCloseManager)}
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseManager}>×</button>
            <span className="overline">给自己的奖励</span>
            <h2 id="reward-manager-title">奖励管理</h2>
            <button className="reward-manager-create" type="button" onClick={() => onOpenEditor()}>
              <span aria-hidden="true">＋</span><div><strong>新建奖励</strong><small>添加一个新的栗壳目标</small></div>
            </button>
            <div className="reward-manager-list">
              {rewards.map((reward) => (
                <div className="reward-manager-item" key={reward.id}>
                  <button className="reward-manager-edit" type="button" aria-label={`修改${reward.name}`} onClick={() => onOpenEditor(reward)}>
                    <span aria-hidden="true">{reward.icon}</span><div><strong>{reward.name}</strong><small>{reward.cost} 栗壳{reward.description ? ` · ${reward.description}` : ""}</small></div><i aria-hidden="true">›</i>
                  </button>
                  <button className="reward-manager-delete" type="button" aria-label={`删除${reward.name}`} onClick={() => onDelete(reward)}>删除</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
