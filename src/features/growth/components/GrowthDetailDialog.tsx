import type { CSSProperties, ReactNode, TouchEvent } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";

import type { Language } from "../../settings/types";
import { actionTimeOptionFor, actionTimeWindowFor, shellValueFor } from "../../tasks/domain/task-rules";
import type { MicroAction } from "../../tasks/types";
import { areaIntroduction } from "../domain/growth-rules";
import type { GrowthArea } from "../types";

type GrowthDetail = GrowthArea & { total: number; level: number };
type GrowthDetailDialogProps = {
  detail: GrowthDetail;
  actions: MicroAction[];
  language: Language;
  tr: (chinese: string, english: string) => string;
  onClose: () => void;
  onImmediateClose: () => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
  onSwipeStart: (key: string, close: () => void, event: TouchEvent<HTMLElement>) => void;
  onSwipeMove: (event: TouchEvent<HTMLElement>) => void;
  onSwipeEnd: (event: TouchEvent<HTMLElement>) => void;
  onSwipeCancel: () => void;
};

export function GrowthDetailDialog(props: GrowthDetailDialogProps) {
  const { detail: growthAreaDetail, actions: growthAreaDetailActions, language, tr, onClose, onImmediateClose, modalClassName: modalMotionClass, modalStyle: modalMotionStyle, dragHandle: modalDragHandle, onSwipeStart: startEditorSheetSwipe, onSwipeMove: moveEditorSheetSwipe, onSwipeEnd: finishEditorSheetSwipe, onSwipeCancel: cancelEditorSheetSwipe } = props;
  return (
    <>
      {growthAreaDetail && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={onClose}
        >
          <section
            className={modalMotionClass(
              "growth-area-detail",
              "bottom-sheet growth-area-detail",
            )}
            style={modalMotionStyle("growth-area-detail")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="growth-area-detail-title"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) =>
              startEditorSheetSwipe(
                "growth-area-detail",
                onImmediateClose,
                event,
              )
            }
            onTouchMove={moveEditorSheetSwipe}
            onTouchEnd={finishEditorSheetSwipe}
            onTouchCancel={cancelEditorSheetSwipe}
          >
            {modalDragHandle(
              "growth-area-detail",
              onImmediateClose,
            )}
            <button
              className="close-button"
              type="button"
              aria-label={tr("关闭", "Close")}
              onClick={onClose}
            >
              <AppIcon name="close" />
            </button>

            <div
              className="growth-area-detail-hero"
              style={{
                background: `linear-gradient(145deg, ${growthAreaDetail.color}1f, ${growthAreaDetail.color}08)`,
              }}
            >
              <span
                className="growth-area-detail-icon"
                style={{ background: `${growthAreaDetail.color}20` }}
                aria-hidden="true"
              >
                {growthAreaDetail.icon}
              </span>
              <div>
                <span className="overline">{tr("成长领域", "Growth area")}</span>
                <h2 id="growth-area-detail-title">{growthAreaDetail.name}</h2>
                <p>{areaIntroduction(growthAreaDetail, language)}</p>
              </div>
            </div>

            <div className="growth-area-detail-stats">
              <span>
                <strong>{growthAreaDetail.total}</strong>
                <small>{tr("累计成长", "Total growth")}</small>
              </span>
              <span>
                <strong>Lv.{growthAreaDetail.level}</strong>
                <small>{tr("当前等级", "Current level")}</small>
              </span>
              <span>
                <strong>{growthAreaDetailActions.length}</strong>
                <small>{tr("关联小事", "Linked actions")}</small>
              </span>
            </div>

            <div className="growth-area-detail-actions">
              <div className="growth-area-detail-heading">
                <h3>{tr("这个领域的小事", "Actions in this area")}</h3>
                <small>{growthAreaDetailActions.length}</small>
              </div>
              {growthAreaDetailActions.length ? (
                <div className="growth-area-detail-list">
                  {growthAreaDetailActions.map((action) => {
                    const timeOption = actionTimeOptionFor(action);
                    return (
                      <article key={`area-detail-${action.id}`}>
                        <span aria-hidden="true">{action.icon}</span>
                        <div>
                          <strong>{action.name}</strong>
                          <small>
                            {actionTimeWindowFor(action) === "anytime"
                              ? tr("全天", "Anytime")
                              : timeOption.label}
                            {` · ${tr("成长", "Growth")} +${action.value}`}
                            {` · ${tr("栗壳", "Shells")} +${shellValueFor(action)}`}
                          </small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="growth-area-detail-empty">
                  <AppIcon name="add" />
                  <p>{tr("这个领域还没有关联的小事。", "No actions are linked to this area yet.")}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
