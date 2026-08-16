import type { MicroAction } from "../types";
import { AppIcon } from "../../../components/ui/AppIcon";

type MenuPosition = { left: number; top: number };

type TaskQuickMenusProps = {
  recordAction: MicroAction | null;
  recordPosition: MenuPosition;
  todayCount: number;
  manageAction: MicroAction | null;
  managePosition: MenuPosition;
  tr: (chinese: string, english: string) => string;
  onCloseRecord: () => void;
  onCloseManage: () => void;
  onEdit: (action: MicroAction) => void;
  onUndo: () => void;
  onDelete: (action: MicroAction) => void;
};

export function TaskQuickMenus(props: TaskQuickMenusProps) {
  const { recordAction, recordPosition, todayCount, manageAction,
    managePosition, tr, onCloseRecord, onCloseManage, onEdit, onUndo,
    onDelete } = props;
  return (
    <>
      {recordAction && (
        <div className="record-action-layer" role="presentation" onClick={onCloseRecord}>
          <section className="record-action-popover" role="menu" aria-label={tr("调整打卡记录", "Adjust check-in")} style={recordPosition} onClick={(event) => event.stopPropagation()}>
            <button type="button" role="menuitem" onClick={() => { onCloseRecord(); onEdit(recordAction); }}><AppIcon name="edit" /><strong>{tr("编辑", "Edit")}</strong></button>
            <button type="button" role="menuitem" disabled={todayCount === 0} onClick={onUndo}><AppIcon name="undo" /><strong>{tr("撤销一次", "Undo once")}</strong></button>
          </section>
        </div>
      )}
      {manageAction && (
        <div className="record-action-layer" role="presentation" onClick={onCloseManage}>
          <section className="record-action-popover manage-action-popover" role="menu" aria-label={`${manageAction.name}的管理选项`} style={managePosition} onClick={(event) => event.stopPropagation()}>
            <button type="button" role="menuitem" onClick={() => onEdit(manageAction)}><AppIcon name="edit" /><strong>编辑</strong></button>
            <button className="danger" type="button" role="menuitem" onClick={() => onDelete(manageAction)}><AppIcon name="delete" /><strong>删除</strong></button>
          </section>
        </div>
      )}
    </>
  );
}
