import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from "react";

import type { Reward } from "../features/rewards/types";
import { prioritizedLockedReward } from "../features/rewards/domain/reward-order";
import { PROFILE_ACTION_SWIPE_WIDTH, PROFILE_ACTION_TIME_GROUPS } from "../features/tasks/constants";
import { actionTimeWindowFor, shellValueFor } from "../features/tasks/domain/task-rules";
import type { MicroAction } from "../features/tasks/types";
import type { Account } from "../features/profile/types";
import { AppIcon } from "../components/ui/AppIcon";
import { ContentIcon, contentIconColor } from "../components/ui/ContentIcon";

type ProfileActionSwipe = {
  id: string;
  offset: number;
  dragging: boolean;
} | null;

type ProfilePageProps = {
  active: boolean;
  account: Account | null;
  actions: MicroAction[];
  rewards: Reward[];
  shellBalance: number;
  bankDropKey: number;
  profileActionSwipe: ProfileActionSwipe;
  tr: (chinese: string, english: string) => string;
  onOpenProfile: () => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
  onOpenRewardManager: () => void;
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
};

export function ProfilePage({
  active,
  account,
  actions,
  rewards,
  shellBalance,
  bankDropKey,
  profileActionSwipe,
  tr,
  onOpenProfile,
  onOpenCalendar,
  onOpenSettings,
  onOpenRewardManager,
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
}: ProfilePageProps) {
  const nextReward = prioritizedLockedReward(rewards, shellBalance);
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
        <div className="profile-heading-row">
          <button
            className={`profile-account-button ${account ? "" : "guest"}`}
            type="button"
            aria-label={account ? tr("编辑个人信息", "Edit profile") : tr("登录账号", "Sign in")}
            onClick={onOpenProfile}
          >
            <span aria-hidden="true">栗</span>
          </button>
          <button
            className="profile-calendar-button"
            type="button"
            aria-label={tr("打开日历记录", "Open calendar records")}
            onClick={onOpenCalendar}
          >
            <AppIcon name="calendar" />
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
            <button type="button" onClick={onOpenRewardManager}>管理</button>
          </div>
        </div>
      </section>

      <section className="settings-block profile-actions">
        <div className="settings-heading">
          <div><h2>我的小事</h2></div>
          <button type="button" onClick={onOpenActionManager}>编辑</button>
        </div>
        <div className="profile-action-time-groups">
          {actionGroups.map((group) => (
            <section className="profile-action-time-group" key={group.id}>
              <div className="profile-action-time-heading">
                <ContentIcon value={group.icon} /><strong>{group.label}</strong><small>{group.actions.length}</small>
              </div>
              <div className="tag-action-grid">
                {group.actions.map((action) => {
                  const swipeState = profileActionSwipe?.id === action.id ? profileActionSwipe : null;
                  const swipeOpen = swipeState?.offset === -PROFILE_ACTION_SWIPE_WIDTH;
                  const swipeRevealed = (swipeState?.offset || 0) < -1;
                  return (
                    <div
                      className="profile-action-swipe-row"
                      key={action.id}
                      onTouchStart={(event) => onStartActionSwipe(action, event)}
                      onTouchMove={onMoveActionSwipe}
                      onTouchEnd={onFinishActionSwipe}
                      onTouchCancel={onCancelActionSwipe}
                    >
                      <div className={`profile-action-swipe-actions${swipeRevealed ? " is-visible" : ""}`} aria-hidden={!swipeOpen}>
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
                          <span className="tag-action-icon" style={{ color: contentIconColor(action.icon) }}><ContentIcon value={action.icon} /></span>
                          <strong>{action.name}</strong>
                          <span className="action-tag-list">
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

    </div>
  );
}
