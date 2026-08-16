import type { CSSProperties, FormEvent, ReactNode, TouchEvent } from "react";

import { AppIcon } from "../../../components/ui/AppIcon";
import type { Account } from "../types";

type ProfileEditorProps = {
  account: Account;
  nickname: string;
  tr: (chinese: string, english: string) => string;
  onNicknameChange: (value: string) => void;
  onClose: () => void;
  onImmediateClose: () => void;
  onLogout: () => void;
  onSubmit: (event: FormEvent) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
  onSwipeStart: (
    key: string,
    close: () => void,
    event: TouchEvent<HTMLElement>,
  ) => void;
  onSwipeMove: (event: TouchEvent<HTMLElement>) => void;
  onSwipeEnd: (event: TouchEvent<HTMLElement>) => void;
  onSwipeCancel: () => void;
};

export function ProfileEditor({
  account,
  nickname,
  tr,
  onNicknameChange,
  onClose,
  onImmediateClose,
  onLogout,
  onSubmit,
  modalClassName,
  modalStyle,
  dragHandle,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  onSwipeCancel,
}: ProfileEditorProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className={modalClassName("profile-editor", "bottom-sheet profile-editor")}
        style={modalStyle("profile-editor")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => onSwipeStart("profile-editor", onImmediateClose, event)}
        onTouchMove={onSwipeMove}
        onTouchEnd={onSwipeEnd}
        onTouchCancel={onSwipeCancel}
      >
        {dragHandle("profile-editor", onImmediateClose)}
        <button className="close-button" type="button" aria-label={tr("关闭个人信息", "Close profile")} onClick={onClose}>
          <AppIcon name="close" />
        </button>
        <span className="overline">{tr("个人资料", "PROFILE")}</span>
        <h2 id="profile-editor-title">{tr("编辑个人信息", "Edit profile")}</h2>
        <div className="profile-editor-account">
          <span aria-hidden="true">栗</span>
          <div>
            <small>{tr("账号", "Account")}</small>
            <strong>{account.username}</strong>
          </div>
        </div>
        <label>
          {tr("昵称", "Nickname")}
          <input
            value={nickname}
            maxLength={16}
            autoComplete="nickname"
            placeholder={tr("例如：小栗", "For example: Lizi")}
            onChange={(event) => onNicknameChange(event.target.value)}
          />
        </label>
        <button className="save-button" type="submit">{tr("保存", "Save")}</button>
        <button className="profile-editor-logout" type="button" onClick={onLogout}>
          {tr("退出登录", "Sign out")}
        </button>
      </form>
    </div>
  );
}
