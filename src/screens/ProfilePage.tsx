import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from "react";

import type { GrowthArea, GrowthRecord } from "../features/growth/types";
import type { Reward, RewardClaim } from "../features/rewards/types";
import { PROFILE_ACTION_SWIPE_WIDTH, PROFILE_ACTION_TIME_GROUPS } from "../features/tasks/constants";
import { actionTimeWindowFor, shellValueFor } from "../features/tasks/domain/task-rules";
import type { MicroAction } from "../features/tasks/types";
import type { Account } from "../features/profile/types";
import { formatRecordDate } from "../features/statistics/domain/date-ranges";
import { AppIcon } from "../components/ui/AppIcon";

type ProfileActionSwipe = {
  id: string;
  offset: number;
  dragging: boolean;
} | null;

type ProfilePageProps = {
  active: boolean;
  account: Account | null;
  areas: GrowthArea[];
  actions: MicroAction[];
  records: GrowthRecord[];
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  shellBalance: number;
  shellsEarned: number;
  bankDropKey: number;
  profileActionSwipe: ProfileActionSwipe;
  tr: (chinese: string, english: string) => string;
  tagsFor: (action: MicroAction) => GrowthArea[];
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenRewardManager: () => void;
  onRequestReward: (reward: Reward) => void;
  onOpenActionManager: () => void;
  onEditAction: (action: MicroAction) => void;
  onDeleteAction: (action: MicroAction) => void;
  onStartActionSwipe: (action: MicroAction, event: ReactTouchEvent<HTMLDivElement>) => void;
  onMoveActionSwipe: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onFinishActionSwipe: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onCancelActionSwipe: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onStartActionLongPress: (action: MicroAction, event: ReactPointerEvent<HTMLElement>) => void;
  onMoveLongPress: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onFinishLongPress: () => void;
  onOpenActionMenu: (action: MicroAction, rect: DOMRect) => void;
  onOpenAreaManager: () => void;
  onStartAreaLongPress: (area: GrowthArea, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onOpenAreaEditor: (area: GrowthArea) => void;
  onResetData: () => void;
};

export function ProfilePage({
  active,
  account,
  areas,
  actions,
  records,
  rewards,
  rewardClaims,
  shellBalance,
  shellsEarned,
  bankDropKey,
  profileActionSwipe,
  tr,
  tagsFor,
  onOpenProfile,
  onOpenSettings,
  onOpenRewardManager,
  onRequestReward,
  onOpenActionManager,
  onEditAction,
  onDeleteAction,
  onStartActionSwipe,
  onMoveActionSwipe,
  onFinishActionSwipe,
  onCancelActionSwipe,
  onStartActionLongPress,
  onMoveLongPress,
  onFinishLongPress,
  onOpenActionMenu,
  onOpenAreaManager,
  onStartAreaLongPress,
  onOpenAreaEditor,
  onResetData,
}: ProfilePageProps) {
  const nextReward = [...rewards]
    .filter((reward) => reward.cost > shellBalance)
    .sort((first, second) => first.cost - second.cost)[0];
  const shellProgress = nextReward
    ? Math.min(100, (shellBalance / nextReward.cost) * 100)
    : rewards.length
      ? 100
      : 0;
  const visibleShellCount = Math.min(12, shellBalance);
  const actionGroups = PROFILE_ACTION_TIME_GROUPS.map((group) => ({
    ...group,
    actions: actions.filter((action) => actionTimeWindowFor(action) === group.id),
  })).filter((group) => group.actions.length > 0);

  return (
    <div className="screen tab-screen" data-tab="profile" aria-hidden={!active}>
      <section className="page-heading profile-page-heading">
        <span className="overline">MY SPACE</span>
        <div className="profile-heading-row">
          <h1>{tr("我的栗子", "My Chestnuts")}</h1>
          <button
            className={`profile-account-button ${account ? "" : "guest"}`}
            type="button"
            aria-label={account ? tr("编辑个人信息", "Edit profile") : tr("登录账号", "Sign in")}
            onClick={onOpenProfile}
          >
            <span aria-hidden="true">栗</span>
          </button>
          <button
            className="settings-entry-button"
            type="button"
            aria-label={tr("打开设置", "Open settings")}
            onClick={onOpenSettings}
          >
            <AppIcon name="settings" />
          </button>
        </div>
      </section>

      <section className="shell-bank" aria-labelledby="shell-bank-title">
        <div className="shell-bank-top">
          <div className="shell-jar" aria-hidden="true">
            <span className="jar-lid" />
            <span className="jar-glass">
              {visibleShellCount === 0 && <small>等待第一枚</small>}
              {Array.from({ length: visibleShellCount }, (_, index) => {
                const isNewest = index === visibleShellCount - 1;
                return (
                  <i
                    className={isNewest ? "falling-shell" : ""}
                    key={isNewest ? `newest-shell-${bankDropKey}` : `settled-shell-${index}`}
                  >
                    栗
                  </i>
                );
              })}
            </span>
          </div>
          <div className="shell-balance">
            <span className="overline">栗壳储蓄罐</span>
            <h2 id="shell-bank-title"><strong>{shellBalance}</strong><small>枚栗壳</small></h2>
          </div>
        </div>

        <div className="shell-progress-copy">
          <span>
            {nextReward
              ? `距离“${nextReward.name}”还差 ${nextReward.cost - shellBalance} 枚`
              : rewards.length ? "所有奖励档位都已解锁" : "添加一个想送给自己的奖励"}
          </span>
          <small>累计获得 {shellsEarned} 枚</small>
        </div>
        <span
          className="shell-progress-track"
          role="progressbar"
          aria-label={nextReward ? `下一档奖励进度：${Math.round(shellProgress)}%` : rewards.length ? "全部奖励已解锁" : "尚未设置奖励"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shellProgress)}
        >
          <i style={{ width: `${shellProgress}%` }} />
        </span>

        <div className="shell-rewards-inline">
          <div className="shell-rewards-heading">
            <span>给自己的奖励</span>
            <button type="button" onClick={onOpenRewardManager}>管理</button>
          </div>
          {rewards.length ? (
            <div className="shell-reward-list">
              {rewards.map((reward) => {
                const available = shellBalance >= reward.cost;
                return (
                  <button className={available ? "available" : ""} type="button" key={reward.id} onClick={() => onRequestReward(reward)}>
                    <span aria-hidden="true">{reward.icon}</span>
                    <strong>{reward.name}</strong>
                    <small>{available ? `${reward.cost} 枚 · 兑换` : `还差 ${reward.cost - shellBalance}`}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <button className="shell-reward-empty" type="button" onClick={onOpenRewardManager}><AppIcon name="add" /> 添加一个奖励</button>
          )}

          {rewardClaims.length > 0 && (
            <details className="reward-history shell-reward-history">
              <summary><span>最近兑换</span><AppIcon name="chevronDown" /></summary>
              <div>
                {rewardClaims.slice(0, 5).map((claim) => (
                  <article key={claim.id}>
                    <span>{claim.icon}</span>
                    <strong>{claim.rewardName}</strong>
                    <small>{formatRecordDate(claim.createdAt)} · −{claim.cost} 栗壳</small>
                  </article>
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      <section className="settings-block profile-actions">
        <div className="settings-heading">
          <div><span className="overline">行动管理</span><h2>我的小事</h2></div>
          <button type="button" onClick={onOpenActionManager}>编辑</button>
        </div>
        <div className="profile-action-time-groups">
          {actionGroups.map((group) => (
            <section className="profile-action-time-group" key={group.id}>
              <div className="profile-action-time-heading">
                <span aria-hidden="true">{group.icon}</span><strong>{group.label}</strong><small>{group.actions.length}</small>
              </div>
              <div className="tag-action-grid">
                {group.actions.map((action) => {
                  const actionTags = tagsFor(action);
                  const swipeState = profileActionSwipe?.id === action.id ? profileActionSwipe : null;
                  const swipeOpen = swipeState?.offset === -PROFILE_ACTION_SWIPE_WIDTH;
                  return (
                    <div
                      className="profile-action-swipe-row"
                      key={action.id}
                      onTouchStart={(event) => onStartActionSwipe(action, event)}
                      onTouchMove={onMoveActionSwipe}
                      onTouchEnd={onFinishActionSwipe}
                      onTouchCancel={onCancelActionSwipe}
                    >
                      <div className="profile-action-swipe-actions" aria-hidden={!swipeOpen}>
                        <button className="edit" type="button" tabIndex={swipeOpen ? 0 : -1} onClick={() => onEditAction(action)}>
                          <AppIcon name="edit" />编辑
                        </button>
                        <button className="delete" type="button" tabIndex={swipeOpen ? 0 : -1} onClick={() => onDeleteAction(action)}>
                          <AppIcon name="delete" />删除
                        </button>
                      </div>
                      <article
                        className={`tag-action-card profile-action-card${swipeState?.dragging ? " is-swiping" : ""}`}
                        style={{ transform: `translate3d(${swipeState?.offset || 0}px, 0, 0)` }}
                        role="button"
                        tabIndex={0}
                        aria-haspopup="menu"
                        aria-expanded={swipeOpen}
                        aria-label={`向左滑动、长按或按回车管理${action.name}`}
                        onPointerDown={(event) => onStartActionLongPress(action, event)}
                        onPointerMove={onMoveLongPress}
                        onPointerUp={onFinishLongPress}
                        onPointerCancel={onFinishLongPress}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onOpenActionMenu(action, event.currentTarget.getBoundingClientRect());
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          onOpenActionMenu(action, event.currentTarget.getBoundingClientRect());
                        }}
                      >
                        <div className="tag-action-summary">
                          <span className="tag-action-icon">{action.icon}</span>
                          <strong>{action.name}</strong>
                          <span className="action-tag-list">
                            {actionTags.map((tag) => (
                              <small key={tag.id} style={{ color: tag.color, borderColor: `${tag.color}35` }}>{tag.name} +{action.value}</small>
                            ))}
                            {action.temporary && <small className="action-temporary-tag"><AppIcon name="temporary" /> 临时</small>}
                            <small className="action-shell-gain"><span aria-hidden="true">🌰</span>栗壳 +{shellValueFor(action)}</small>
                            {action.repeatable === false && <small>每日一次</small>}
                          </span>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-heading">
          <div><span className="overline">成长领域</span><h2>成长领域</h2></div>
          <button type="button" onClick={onOpenAreaManager}>编辑</button>
        </div>
        <div className="area-chip-list">
          {areas.map((area) => (
            <button
              type="button"
              key={area.id}
              style={{ borderColor: `${area.color}55` }}
              aria-label={`长按编辑成长领域${area.name}`}
              onPointerDown={(event) => onStartAreaLongPress(area, event)}
              onPointerMove={onMoveLongPress}
              onPointerUp={onFinishLongPress}
              onPointerCancel={onFinishLongPress}
              onContextMenu={(event) => { event.preventDefault(); onOpenAreaEditor(area); }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onOpenAreaEditor(area);
              }}
            >
              {area.icon} {area.name}
            </button>
          ))}
        </div>
      </section>

      <details className="settings-block philosophy">
        <summary>
          <span className="philosophy-title"><AppIcon name="sparkle" /><span><strong>关于栗子小事</strong></span></span>
          <AppIcon className="summary-chevron" name="chevronDown" />
        </summary>
        <div className="philosophy-content">
          <blockquote>“成长不是由几个重大事件组成，而是由无数微小行动累积而成。”</blockquote>
          <ul><li><AppIcon name="check" />记录成长，而不是记录失败</li><li><AppIcon name="check" />默认展示已经做到的事情</li><li><AppIcon name="check" />数据服务于回顾，而不是竞争</li></ul>
        </div>
      </details>

      <section className="settings-block data-settings">
        <div><strong>设备本地数据</strong><small>当前共有 {records.length} 条成长记录</small></div>
        <button type="button" onClick={onResetData}>清空并重置</button>
      </section>
    </div>
  );
}
