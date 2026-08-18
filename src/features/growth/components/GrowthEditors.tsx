import type { CSSProperties, FormEvent, ReactNode, TouchEvent } from "react";

import { IconPicker } from "../../../components/ui/IconPicker";
import { AppIcon } from "../../../components/ui/AppIcon";
import { ContentIcon } from "../../../components/ui/ContentIcon";
import { AREA_COLORS, AREA_ICON_OPTIONS } from "../constants";
import type { GrowthArea } from "../types";

type MotionProps = {
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
  onSwipeStart: (key: string, close: () => void, event: TouchEvent<HTMLElement>) => void;
  onSwipeMove: (event: TouchEvent<HTMLElement>) => void;
  onSwipeEnd: (event: TouchEvent<HTMLElement>) => void;
  onSwipeCancel: () => void;
};

type GrowthEditorsProps = MotionProps & {
  showManager: boolean;
  showEditor: boolean;
  areas: GrowthArea[];
  editingArea: GrowthArea | null;
  draftName: string;
  draftIcon: string;
  draftColor: string;
  actionCountFor: (areaId: string) => number;
  onCloseManager: () => void;
  onImmediateCloseManager: () => void;
  onOpenEditor: (area?: GrowthArea) => void;
  onCloseEditor: () => void;
  onImmediateCloseEditor: () => void;
  onDraftNameChange: (value: string) => void;
  onDraftIconChange: (value: string) => void;
  onDraftColorChange: (value: string) => void;
  onSave: (event: FormEvent) => void;
  onDelete: (area: GrowthArea) => void;
};

export function GrowthEditors(props: GrowthEditorsProps) {
  const {
    showManager, showEditor, areas, editingArea, draftName, draftIcon,
    draftColor, actionCountFor, onCloseManager, onImmediateCloseManager,
    onOpenEditor, onCloseEditor, onImmediateCloseEditor,
    onDraftNameChange, onDraftIconChange, onDraftColorChange, onSave, onDelete,
    modalClassName, modalStyle, dragHandle, onSwipeStart, onSwipeMove,
    onSwipeEnd, onSwipeCancel,
  } = props;

  return (
    <>
      {showManager && (
        <div className="modal-backdrop" role="presentation" onClick={onCloseManager}>
          <section
            className={modalClassName("area-manager", "bottom-sheet action-manager area-manager")}
            style={modalStyle("area-manager")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-manager-title"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => onSwipeStart("area-manager", onImmediateCloseManager, event)}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeCancel}
          >
            {dragHandle("area-manager", onImmediateCloseManager)}
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseManager}><AppIcon name="close" /></button>
            <span className="overline">成长领域</span>
            <h2 id="area-manager-title">领域管理</h2>
            <button className="action-manager-create" type="button" onClick={() => onOpenEditor()}>
              <AppIcon name="add" />
              <div><strong>新建领域</strong><small>添加一个新的成长方向</small></div>
            </button>
            <div className="action-manager-list">
              {areas.map((area) => (
                <button type="button" key={area.id} aria-label={`修改${area.name}`} onClick={() => onOpenEditor(area)}>
                  <span aria-hidden="true" style={{ color: area.color, background: `${area.color}18` }}><ContentIcon value={area.icon} /></span>
                  <div><strong>{area.name}</strong><small>{actionCountFor(area.id)} 个微行动使用</small></div>
                  <AppIcon name="chevronRight" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showEditor && (
        <div className="modal-backdrop" role="presentation" onClick={onCloseEditor}>
          <form
            className={modalClassName("area-editor", "bottom-sheet area-editor")}
            style={modalStyle("area-editor")}
            tabIndex={-1}
            autoFocus
            onSubmit={onSave}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => onSwipeStart("area-editor", onImmediateCloseEditor, event)}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeCancel}
          >
            {dragHandle("area-editor", onImmediateCloseEditor)}
            <button className="close-button" type="button" aria-label="关闭" onClick={onCloseEditor}><AppIcon name="close" /></button>
            <span className="overline">{editingArea ? "编辑成长领域" : "新的成长领域"}</span>
            <h2>{editingArea ? "调整这个成长方向" : "你还想积累什么？"}</h2>
            <p className="sheet-description">{editingArea ? "修改后，所有关联微行动和历史记录会同步显示新名称。" : "创建一个成长领域，再关联到一个或多个微行动。"}</p>
            <label>领域名称<input value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder="例如：关系" /></label>
            <IconPicker label="选择图标" value={draftIcon} options={AREA_ICON_OPTIONS} onChange={onDraftIconChange} />
            <fieldset className="area-color-fieldset">
              <legend>领域颜色</legend>
              <div>
                {AREA_COLORS.map((color) => (
                  <button className={draftColor === color ? "selected" : ""} type="button" key={color} aria-label={`选择颜色 ${color}`} aria-pressed={draftColor === color} style={{ background: color }} onClick={() => onDraftColorChange(color)}>
                    {draftColor === color && <AppIcon name="check" />}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="save-button" type="submit">{editingArea ? "保存领域修改" : "添加成长领域"}</button>
            {editingArea && <button className="delete-area-button" type="button" onClick={() => onDelete(editingArea)}>删除这个领域</button>}
          </form>
        </div>
      )}
    </>
  );
}
