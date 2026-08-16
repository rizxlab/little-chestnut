import type { CSSProperties, FormEvent, ReactNode } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";

type LoginDialogProps = {
  username: string;
  password: string;
  error: string;
  pending: boolean;
  tr: (chinese: string, english: string) => string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onImmediateClose: () => void;
  onSubmit: (event: FormEvent) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
};

export function LoginDialog(props: LoginDialogProps) {
  const { username, password, error, pending, tr, onUsernameChange,
    onPasswordChange, onClose, onImmediateClose, onSubmit, modalClassName, modalStyle,
    dragHandle } = props;
  return (
    <div className="account-gate login-modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className={modalClassName("login", "login-card")}
        style={modalStyle("login")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        {dragHandle("login", onImmediateClose)}
        <button className="close-button" type="button" aria-label={tr("关闭登录", "Close sign in")} onClick={onClose}><AppIcon name="close" /></button>
        <div className="login-brand"><span aria-hidden="true">栗</span><div><strong>{tr("栗子小事", "Little Chestnut")}</strong><small>{tr("登录后，继续积累自己的小事", "Sign in to continue your progress")}</small></div></div>
        <div className="login-heading"><span className="overline">WELCOME BACK</span><h1 id="login-title">{tr("欢迎回来", "Welcome back")}</h1></div>
        <label>{tr("账号", "Account")}<input value={username} onChange={(event) => onUsernameChange(event.target.value)} autoComplete="username" inputMode="numeric" placeholder={tr("请输入账号", "Enter account")} autoFocus /></label>
        <label>{tr("密码", "Password")}<input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete="current-password" placeholder={tr("请输入密码", "Enter password")} /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={pending || !username.trim() || !password}>{pending ? tr("正在登录…", "Signing in…") : tr("登录", "Sign in")}</button>
        <small className="login-note">{tr("账号数据将独立保存并同步。", "Account data is saved and synced separately.")}</small>
      </form>
    </div>
  );
}
