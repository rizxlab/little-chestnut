import type { CSSProperties, FormEvent, ReactNode } from "react";

import { IconPicker } from "../../../components/ui/IconPicker";
import type { GrowthArea } from "../../growth/types";
import { ACTION_ICON_OPTIONS, ACTION_TIME_OPTIONS, DEFAULT_ACTIONS } from "../constants";
import { actionTimeOptionFor, actionTimeWindowFor, shellValueFor, temporaryActionDays, temporaryExpirationDay } from "../domain/task-rules";
import { useTaskEditorState } from "../hooks/useTaskEditorState";
import type { MicroAction } from "../types";

type TaskEditorsProps = {
  state: ReturnType<typeof useTaskEditorState>;
  actions: MicroAction[];
  areas: GrowthArea[];
  safeTimerSeconds: number;
  timerSliderMax: number;
  timerSliderProgress: number;
  tr: (chinese: string, english: string) => string;
  tagsFor: (action: MicroAction) => GrowthArea[];
  closeSecondaryModal: (key: string, close: () => void) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
  onOpenEditor: (action?: MicroAction) => void;
  onCloseEditor: () => void;
  onApplyPreset: (action: MicroAction) => void;
  onStartCustom: () => void;
  onToggleTag: (tagId: string) => void;
  onSave: (event: FormEvent) => void;
  onDelete: (action: MicroAction) => void;
};

export function TaskEditors(props: TaskEditorsProps) {
  const { state, actions, areas, safeTimerSeconds: safeDraftTimerSeconds, timerSliderMax, timerSliderProgress, tr, tagsFor, closeSecondaryModal, modalClassName: modalMotionClass, modalStyle: modalMotionStyle, dragHandle: modalDragHandle, onOpenEditor: openActionEditor, onCloseEditor: closeActionEditor, onApplyPreset: applyActionPreset, onStartCustom: startCustomAction, onToggleTag: toggleDraftTag, onSave: saveAction, onDelete: deleteAction } = props;
  const { editingAction, showActionManager, setShowActionManager, showActionEditor, draftName, setDraftName, draftIcon, setDraftIcon, draftPresetId, showActionIconPicker, setShowActionIconPicker, draftTags, draftValue, setDraftValue, draftShellValue, setDraftShellValue, draftRepeatable, setDraftRepeatable, draftTemporary, draftTemporaryDays, setDraftTemporaryDays, draftTimeWindow, setDraftTimeWindow, draftUsesTimer, setDraftUsesTimer, draftTimerSeconds, setDraftTimerSeconds } = state;
  return (
    <>
      {showActionManager && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeSecondaryModal("action-manager", () => setShowActionManager(false))}
        >
          <section
            className={modalMotionClass("action-manager", "bottom-sheet action-manager")}
            style={modalMotionStyle("action-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            {modalDragHandle("action-manager", () => setShowActionManager(false))}
            <button
              className="close-button"
              type="button"
              aria-label="关闭"
              onClick={() => closeSecondaryModal("action-manager", () => setShowActionManager(false))}
            >
              ×
            </button>
            <span className="overline">行动管理</span>
            <h2 id="action-manager-title">我的小事</h2>
            <button
              className="action-manager-create"
              type="button"
              onClick={() => openActionEditor()}
            >
              <span aria-hidden="true">＋</span>
              <div>
                <strong>新建小事</strong>
                <small>添加一件想记录的小事</small>
              </div>
            </button>
            <div className="action-manager-list">
              {actions.map((action) => {
                const actionTags = tagsFor(action);
                return (
                  <button
                    type="button"
                    key={action.id}
                    aria-label={`修改${action.name}`}
                    onClick={() => openActionEditor(action)}
                  >
                    <span aria-hidden="true">{action.icon}</span>
                    <div>
                      <strong>{action.name}</strong>
                      <small>
                        {actionTags.map((tag) => tag.name).join(" · ")}
                        {action.temporary
                          ? `${actionTags.length ? " · " : ""}临时至 ${
                              action.expiresOn?.slice(5).replace("-", "/") || "今天"
                            }`
                          : ""}
                        {action.timerSeconds ? ` · 计时 ${action.timerSeconds} 秒` : ""}
                        {action.repeatable === false ? " · 每日一次" : ""}
                        {actionTimeWindowFor(action) !== "anytime"
                          ? ` · ${actionTimeOptionFor(action).label}`
                          : ""}
                        {` · 栗壳 +${shellValueFor(action)}`}
                      </small>
                    </div>
                    <i aria-hidden="true">›</i>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {showActionEditor && (
        <div className="action-editor-page-layer">
          <form
            className="screen action-editor action-editor-page"
            onSubmit={saveAction}
          >
            <section className="action-editor-page-heading">
              <button
                className="settings-back"
                type="button"
                aria-label={tr("返回原页面", "Back")}
                onClick={closeActionEditor}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <span className="overline">
                {draftTemporary
                  ? editingAction
                    ? "编辑临时小事"
                    : "新的临时小事"
                  : editingAction
                    ? "编辑小事"
                    : "新的小事"}
              </span>
              <h1>我的小事</h1>
            </section>
            {draftTemporary && (
              <section className="temporary-action-settings">
                <div className="temporary-action-settings-copy">
                  <span aria-hidden="true">⏳</span>
                  <div>
                    <strong>临时小事</strong>
                    <small>到期后只删除小事，打卡记录和栗壳会保留</small>
                  </div>
                </div>
                <div className="temporary-duration-control">
                  <div>
                    <strong>有效天数</strong>
                    <small>
                      {draftTemporaryDays === 1
                        ? "明天自动删除"
                        : `保留至 ${temporaryExpirationDay(draftTemporaryDays).slice(5).replace("-", "月")}日`}
                    </small>
                  </div>
                  <div role="group" aria-label="调整临时小事有效天数">
                    <button
                      type="button"
                      disabled={draftTemporaryDays <= 1}
                      onClick={() =>
                        setDraftTemporaryDays((current) => Math.max(1, current - 1))
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="30"
                      value={draftTemporaryDays}
                      aria-label="临时小事有效天数"
                      onChange={(event) =>
                        setDraftTemporaryDays(
                          temporaryActionDays(event.target.value),
                        )
                      }
                    />
                    <button
                      type="button"
                      disabled={draftTemporaryDays >= 30}
                      onClick={() =>
                        setDraftTemporaryDays((current) => Math.min(30, current + 1))
                      }
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </section>
            )}
            {!editingAction && !draftTemporary && (
              <fieldset className="action-preset-picker">
                <legend>系统小事</legend>
                <div>
                  <button
                    className={draftPresetId === "custom" ? "selected" : ""}
                    type="button"
                    onClick={startCustomAction}
                  >
                    <span aria-hidden="true">✦</span>
                    <strong>自定义</strong>
                  </button>
                  {DEFAULT_ACTIONS.map((action) => (
                    <button
                      className={draftPresetId === action.id ? "selected" : ""}
                      type="button"
                      key={action.id}
                      onClick={() => applyActionPreset(action)}
                    >
                      <span aria-hidden="true">{action.icon}</span>
                      <strong>{action.name}</strong>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="action-name-label">
              行动名称
              <div className="action-name-control">
                <button
                  className="action-icon-trigger"
                  type="button"
                  aria-label="选择小事图标"
                  aria-expanded={showActionIconPicker}
                  aria-haspopup="dialog"
                  onClick={() => setShowActionIconPicker(true)}
                >
                  <span aria-hidden="true">{draftIcon}</span>
                  <small aria-hidden="true">⌄</small>
                </button>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="例如：阅读一页"
                />
              </div>
            </label>
            <div className="action-shell-stepper action-growth-stepper">
              <div>
                <span aria-hidden="true">🌱</span>
                <strong>成长值</strong>
              </div>
              <div role="group" aria-label="调整每次完成获得的成长值">
                <button
                  type="button"
                  disabled={draftValue <= 1}
                  aria-label="成长值减一"
                  onClick={() =>
                    setDraftValue((current) => Math.max(1, current - 1))
                  }
                >
                  −1
                </button>
                <output aria-live="polite">+{draftValue}</output>
                <button
                  type="button"
                  disabled={draftValue >= 10}
                  aria-label="成长值加一"
                  onClick={() =>
                    setDraftValue((current) => Math.min(10, current + 1))
                  }
                >
                  +1
                </button>
              </div>
            </div>
            {draftTemporary && !draftTags.length && (
              <p className="temporary-growth-note">
                当前不关联成长领域，因此不会增加成长值或领域经验。
              </p>
            )}
            <div className="action-shell-stepper">
              <div>
                <span aria-hidden="true">🌰</span>
                <strong>栗壳获取</strong>
              </div>
              <div role="group" aria-label="调整每次完成获得的栗壳">
                <button
                  type="button"
                  disabled={draftShellValue <= 1}
                  aria-label="栗壳获取值减一"
                  onClick={() =>
                    setDraftShellValue((current) => Math.max(1, current - 1))
                  }
                >
                  −1
                </button>
                <output aria-live="polite">+{draftShellValue}</output>
                <button
                  type="button"
                  disabled={draftShellValue >= 99}
                  aria-label="栗壳获取值加一"
                  onClick={() =>
                    setDraftShellValue((current) => Math.min(99, current + 1))
                  }
                >
                  +1
                </button>
              </div>
            </div>
            <div className="timer-editor-setting action-repeat-setting">
              <button
                className={draftRepeatable ? "enabled" : ""}
                type="button"
                role="switch"
                aria-checked={draftRepeatable}
                onClick={() => setDraftRepeatable((current) => !current)}
              >
                <span aria-hidden="true">↻</span>
                <div>
                  <strong>当日可重复</strong>
                  <small>{draftRepeatable ? "可多次打卡" : "每天仅一次"}</small>
                </div>
                <i aria-hidden="true"><b /></i>
              </button>
            </div>
            <fieldset className="action-time-setting">
              <legend>可打卡时段</legend>
              <div>
                {ACTION_TIME_OPTIONS.map((option) => (
                  <button
                    className={draftTimeWindow === option.id ? "selected" : ""}
                    type="button"
                    key={option.id}
                    aria-pressed={draftTimeWindow === option.id}
                    onClick={() => setDraftTimeWindow(option.id)}
                  >
                    <span aria-hidden="true">{option.icon}</span>
                    <strong>{option.label}</strong>
                    <small>{option.range}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="timer-editor-setting">
              <button
                className={draftUsesTimer ? "enabled" : ""}
                type="button"
                role="switch"
                aria-checked={draftUsesTimer}
                onClick={() => setDraftUsesTimer((current) => !current)}
              >
                <span aria-hidden="true">◷</span>
                <div>
                  <strong>计时</strong>
                  <small>开始前会有 3 秒准备时间</small>
                </div>
                <i aria-hidden="true"><b /></i>
              </button>
              {draftUsesTimer && (
                <div className="timer-duration-editor">
                  <div className="timer-duration-editor-heading">
                    <strong>计时时长</strong>
                    <output aria-live="polite">
                      {safeDraftTimerSeconds}<small>秒</small>
                    </output>
                  </div>
                  <label className="timer-duration-slider">
                    <span>滑动选择时长</span>
                    <input
                      type="range"
                      min="1"
                      max={timerSliderMax}
                      step="1"
                      value={safeDraftTimerSeconds}
                      aria-label="滑动选择计时时长"
                      style={
                        {
                          "--timer-slider-progress": `${timerSliderProgress}%`,
                        } as CSSProperties
                      }
                      onChange={(event) =>
                        setDraftTimerSeconds(Number(event.target.value))
                      }
                    />
                    <small aria-hidden="true">
                      <span>1 秒</span>
                      <span>{Math.round(timerSliderMax / 2)} 秒</span>
                      <span>{timerSliderMax} 秒</span>
                    </small>
                  </label>
                  <label className="timer-duration-number">
                    <span>精确输入</span>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        inputMode="numeric"
                        value={draftTimerSeconds}
                        onChange={(event) =>
                          setDraftTimerSeconds(Number(event.target.value))
                        }
                      />
                      <small>秒</small>
                    </div>
                  </label>
                </div>
              )}
            </div>
            <fieldset className="tag-fieldset">
              <legend>
                成长领域 <small>{draftTemporary ? "可不选" : "可多选"}</small>
              </legend>
              <div className="tag-picker">
                {areas.map((area) => {
                  const selected = draftTags.includes(area.id);
                  return (
                    <button
                      className={selected ? "selected" : ""}
                      type="button"
                      key={area.id}
                      aria-pressed={selected}
                      style={selected ? { borderColor: area.color, color: area.color } : undefined}
                      onClick={() => toggleDraftTag(area.id)}
                    >
                      {area.icon} {area.name}
                      <span>{selected ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
              {!draftTags.length && !draftTemporary && (
                <small className="field-hint">至少选择一个成长领域</small>
              )}
            </fieldset>
            <button
              className="save-button"
              type="submit"
              disabled={
                !draftName.trim()
                || (!draftTemporary && !draftTags.length)
              }
            >
              {editingAction ? "保存修改" : "加入我的小事"}
            </button>
            {editingAction && (
              <button
                className="delete-action-button"
                type="button"
                onClick={() => deleteAction(editingAction)}
              >
                删除这件小事
              </button>
            )}
          </form>
          {showActionIconPicker && (
            <div
              className="action-icon-dialog-backdrop"
              role="presentation"
              onClick={() => setShowActionIconPicker(false)}
            >
              <section
                className="action-icon-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="action-icon-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="action-icon-dialog-heading">
                  <div>
                    <span className="overline">小事图标</span>
                    <h2 id="action-icon-dialog-title">选择一个图标</h2>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭图标选择"
                    onClick={() => setShowActionIconPicker(false)}
                  >
                    ×
                  </button>
                </div>
                <IconPicker
                  label="所有可选图标"
                  value={draftIcon}
                  options={ACTION_ICON_OPTIONS}
                  onChange={(icon) => {
                    setDraftIcon(icon);
                    setShowActionIconPicker(false);
                  }}
                />
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
}
