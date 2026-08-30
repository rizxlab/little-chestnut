import { useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent, ReactNode, TouchEvent } from "react";

import { IconPicker } from "../../../components/ui/IconPicker";
import { AppIcon } from "../../../components/ui/AppIcon";
import { ContentIcon } from "../../../components/ui/ContentIcon";
import { REWARD_ICON_OPTIONS } from "../constants";
import type { Reward } from "../types";

type RewardEditorsProps = {
  showEditor: boolean;
  showManager: boolean;
  rewards: Reward[];
  shellBalance: number;
  shellsEarned: number;
  claimedCount: number;
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
  onRedeem: (reward: Reward) => void;
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
    showEditor, showManager, rewards, shellBalance, shellsEarned, claimedCount, editingReward, draftName,
    draftDescription, draftIcon, draftCost, onCloseEditor,
    onImmediateCloseEditor, onCloseManager, onImmediateCloseManager,
    onOpenEditor, onDraftNameChange, onDraftDescriptionChange,
    onDraftIconChange, onDraftCostChange, onSave, onRedeem, onDelete, onReorder, modalClassName,
    modalStyle, dragHandle, onSwipeStart, onSwipeMove, onSwipeEnd, onSwipeCancel,
  } = props;
  const [draggingRewardId, setDraggingRewardId] = useState<string | null>(null);
  const [showRewardIconPicker, setShowRewardIconPicker] = useState(false);

  function closeRewardEditor() {
    setShowRewardIconPicker(false);
    onCloseEditor();
  }

  function immediatelyCloseRewardEditor() {
    setShowRewardIconPicker(false);
    onImmediateCloseEditor();
  }

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
        <div className="modal-backdrop" role="presentation" onClick={closeRewardEditor}>
          <form
            className={modalClassName("reward-editor", "bottom-sheet reward-editor")}
            style={modalStyle("reward-editor")}
            tabIndex={-1}
            autoFocus
            onSubmit={onSave}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => onSwipeStart("reward-editor", immediatelyCloseRewardEditor, event)}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeCancel}
          >
            {dragHandle("reward-editor", immediatelyCloseRewardEditor)}
            <button className="close-button" type="button" aria-label="关闭" onClick={closeRewardEditor}><AppIcon name="close" /></button>
            <span className="overline">{editingReward ? "编辑奖励" : "新的奖励"}</span>
            <h2>{editingReward ? "调整这份小期待" : "想把栗壳换成什么？"}</h2>
            <label className="reward-name-label">
              奖励名称
              <div className="action-name-control">
                <button
                  className="action-icon-trigger"
                  type="button"
                  aria-label="选择奖励图标"
                  aria-expanded={showRewardIconPicker}
                  aria-haspopup="dialog"
                  onClick={() => setShowRewardIconPicker(true)}
                >
                  <ContentIcon value={draftIcon} />
                  <small aria-hidden="true"><AppIcon name="chevronDown" /></small>
                </button>
                <input value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder="例如：看一场电影" />
              </div>
            </label>
            <label>简短说明<input value={draftDescription} onChange={(event) => onDraftDescriptionChange(event.target.value)} placeholder="例如：留一个晚上给喜欢的故事" maxLength={48} /></label>
            <div className="action-shell-stepper reward-cost-stepper">
              <div>
                <span aria-hidden="true">🌰</span>
                <strong>所需栗壳</strong>
              </div>
              <div role="group" aria-label="调整兑换奖励所需的栗壳">
                <button
                  type="button"
                  disabled={draftCost <= 1}
                  aria-label="所需栗壳减一"
                  onClick={() => onDraftCostChange(Math.max(1, draftCost - 1))}
                >
                  −1
                </button>
                <label className="action-shell-value-input">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="9999"
                    aria-label="兑换奖励所需的栗壳数量"
                    value={draftCost}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (Number.isFinite(value)) {
                        onDraftCostChange(Math.min(9999, Math.max(1, Math.floor(value))));
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={draftCost >= 9999}
                  aria-label="所需栗壳加一"
                  onClick={() => onDraftCostChange(Math.min(9999, draftCost + 1))}
                >
                  +1
                </button>
              </div>
            </div>
            <button className="save-button" type="submit" disabled={!draftName.trim() || draftCost < 1}>{editingReward ? "保存奖励" : "加入奖励清单"}</button>
            {editingReward && <button className="redeem-reward-button" type="button" onClick={() => onRedeem(editingReward)}>兑换这个奖励</button>}
            {editingReward && <button className="delete-reward-button" type="button" onClick={() => onDelete(editingReward)}>删除这个奖励</button>}
          </form>
          {showRewardIconPicker && (
            <div
              className="action-icon-dialog-backdrop"
              role="presentation"
              onClick={(event) => {
                event.stopPropagation();
                setShowRewardIconPicker(false);
              }}
            >
              <section
                className="action-icon-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reward-icon-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="action-icon-dialog-heading">
                  <div>
                    <span className="overline">奖励图标</span>
                    <h2 id="reward-icon-dialog-title">选择一个图标</h2>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭图标选择"
                    onClick={() => setShowRewardIconPicker(false)}
                  >
                    <AppIcon name="close" />
                  </button>
                </div>
                <IconPicker
                  label="所有可选图标"
                  value={draftIcon}
                  options={REWARD_ICON_OPTIONS}
                  onChange={(icon) => {
                    onDraftIconChange(icon);
                    setShowRewardIconPicker(false);
                  }}
                />
              </section>
            </div>
          )}
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
            <h2 className="reward-manager-title" id="reward-manager-title">栗壳与心愿</h2>

            <section className="reward-wallet-summary" aria-labelledby="reward-wallet-title">
              <h3 id="reward-wallet-title"><span aria-hidden="true">🌰</span>栗壳账户</h3>
              <div className="reward-wallet-stats">
                <div><strong>{shellBalance}</strong><small>可用栗壳</small></div>
                <div><strong>{shellsEarned}</strong><small>累计栗壳</small></div>
                <div><strong>{claimedCount}</strong><small>已兑换</small></div>
              </div>
            </section>

            <section className="reward-wishlist" aria-labelledby="reward-wishlist-title">
              <header>
                <h3 id="reward-wishlist-title"><AppIcon name="gift" />我的奖励单</h3>
                <button className="reward-manager-create" type="button" onClick={() => onOpenEditor()}>
                  <AppIcon name="add" />添加奖励
                </button>
              </header>
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
                      <ContentIcon value={reward.icon} />
                      <div>
                        <strong>{reward.name}</strong>
                        <small><span aria-hidden="true">🌰</span>{reward.cost} 枚</small>
                        {reward.description && <em>{reward.description}</em>}
                      </div>
                    </button>
                    <button className="reward-manager-delete" type="button" aria-label={`删除${reward.name}`} onClick={() => onDelete(reward)}><AppIcon name="delete" /></button>
                    <button className="reward-manager-redeem" type="button" aria-label={`兑换${reward.name}`} onClick={() => onRedeem(reward)}><AppIcon name="gift" />兑换</button>
                  </div>
                ))}
                {!rewards.length && <p className="reward-manager-empty">还没有奖励，先放进一个想实现的小期待吧。</p>}
              </div>
              {rewards.length > 1 && <p className="reward-manager-order-hint">点击奖励名称可编辑 · 拖动把手可调整优先顺序</p>}
            </section>
          </section>
        </div>
      )}
    </>
  );
}
