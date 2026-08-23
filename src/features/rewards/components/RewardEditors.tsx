import { useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent, ReactNode, TouchEvent } from "react";

import { IconPicker } from "../../../components/ui/IconPicker";
import { AppIcon } from "../../../components/ui/AppIcon";
import { ContentIcon } from "../../../components/ui/ContentIcon";
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
  onReorder: (sourceId: string, targetId: string) => void;
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
    onDraftIconChange, onDraftCostChange, onSave, onDelete, onReorder, modalClassName,
    modalStyle, dragHandle, onSwipeStart, onSwipeMove, onSwipeEnd, onSwipeCancel,
  } = props;
  const [draggingRewardId, setDraggingRewardId] = useState<string | null>(null);

  function startRewardDrag(rewardId: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingRewardId(rewardId);
  }

  function moveRewardDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!draggingRewardId) return;
    event.preventDefault();
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-reward-id]");
    const targetId = target?.dataset.rewardId;
    if (targetId && targetId !== draggingRewardId) onReorder(draggingRewardId, targetId);
  }

  function finishRewardDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingRewardId(null);
  }

  function moveRewardWithKeyboard(rewardId: string, direction: -1 | 1) {
    const index = rewards.findIndex((reward) => reward.id === rewardId);
    const target = rewards[index + direction];
    if (target) onReorder(rewardId, target.id);
  }

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
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseEditor}><AppIcon name="close" /></button>
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
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseManager}><AppIcon name="close" /></button>
            <span className="overline">给自己的奖励</span>
            <h2 id="reward-manager-title">奖励管理</h2>
            <button className="reward-manager-create" type="button" onClick={() => onOpenEditor()}>
              <AppIcon name="add" /><div><strong>新建奖励</strong><small>添加一个新的栗壳目标</small></div>
            </button>
            {rewards.length > 1 && <p className="reward-manager-order-hint">拖动左侧把手调整顺序，排在前面的奖励会优先显示为目标</p>}
            <div className="reward-manager-list">
              {rewards.map((reward) => (
                <div className={`reward-manager-item${draggingRewardId === reward.id ? " is-dragging" : ""}`} key={reward.id} data-reward-id={reward.id}>
                  <button
                    className="reward-manager-drag"
                    type="button"
                    aria-label={`拖动调整${reward.name}的顺序`}
                    title="拖动调整顺序"
                    onPointerDown={(event) => startRewardDrag(reward.id, event)}
                    onPointerMove={moveRewardDrag}
                    onPointerUp={finishRewardDrag}
                    onPointerCancel={finishRewardDrag}
                    onLostPointerCapture={() => setDraggingRewardId(null)}
                    onTouchStart={(event) => event.stopPropagation()}
                    onTouchMove={(event) => event.stopPropagation()}
                    onTouchEnd={(event) => event.stopPropagation()}
                    onTouchCancel={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                      event.preventDefault();
                      moveRewardWithKeyboard(reward.id, event.key === "ArrowUp" ? -1 : 1);
                    }}
                  >
                    <span /><span /><span />
                  </button>
                  <button className="reward-manager-edit" type="button" aria-label={`修改${reward.name}`} onClick={() => onOpenEditor(reward)}>
                    <ContentIcon value={reward.icon} /><div><strong>{reward.name}</strong><small>{reward.cost} 栗壳{reward.description ? ` · ${reward.description}` : ""}</small></div><AppIcon name="chevronRight" />
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
