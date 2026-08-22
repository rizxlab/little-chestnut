import type { CSSProperties, FormEvent, ReactNode } from "react";
import { AppIcon } from "../../../components/ui/AppIcon";

type LoginDialogProps = {
  mode: "login" | "register";
  username: string;
  password: string;
  confirmPassword: string;
  error: string;
  pending: boolean;
  tr: (chinese: string, english: string) => string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onModeChange: (mode: "login" | "register") => void;
  onClose: () => void;
  onImmediateClose: () => void;
  onSubmit: (event: FormEvent) => void;
  modalClassName: (key: string, baseClassName: string) => string;
  modalStyle: (key: string) => CSSProperties;
  dragHandle: (key: string, close: () => void) => ReactNode;
};

export function LoginDialog(props: LoginDialogProps) {
  const { mode, username, password, confirmPassword, error, pending, tr, onUsernameChange,
    onPasswordChange, onConfirmPasswordChange, onModeChange, onClose, onImmediateClose,
    onSubmit, modalClassName, modalStyle, dragHandle } = props;
  const registering = mode === "register";
  return (
    <div className="account-gate login-modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className={modalClassName("login", "login-card")}
        style={modalStyle("login")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        {dragHandle("login", onImmediateClose)}
        <button className="close-button" type="button" aria-label={tr("关闭账号弹窗", "Close account dialog")} onClick={onClose}><AppIcon name="close" /></button>
        <div className="login-brand"><span aria-hidden="true">栗</span><div><strong>{tr("栗子小事", "Little Chestnut")}</strong><small>{registering ? tr("创建账号，开始积累自己的小事", "Create an account for your progress") : tr("登录后，继续积累自己的小事", "Sign in to continue your progress")}</small></div></div>
        <div className="login-heading"><span className="overline">{registering ? "GET STARTED" : "WELCOME BACK"}</span><h1 id="auth-title">{registering ? tr("创建账号", "Create account") : tr("欢迎回来", "Welcome back")}</h1></div>
        <label>{tr("账号", "Account")}<input value={username} onChange={(event) => onUsernameChange(event.target.value)} autoComplete="username" placeholder={tr("请输入账号", "Enter account")} autoFocus /></label>
        <label>{tr("密码", "Password")}<input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete={registering ? "new-password" : "current-password"} placeholder={tr("请输入密码", "Enter password")} /></label>
        {registering && <label>{tr("确认密码", "Confirm password")}<input type="password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} autoComplete="new-password" placeholder={tr("请再输入一次密码", "Enter password again")} /></label>}
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={pending || !username.trim() || !password || (registering && !confirmPassword)}>{pending ? (registering ? tr("正在创建…", "Creating…") : tr("正在登录…", "Signing in…")) : (registering ? tr("创建账号", "Create account") : tr("登录", "Sign in"))}</button>
        <small className="login-note">{registering ? tr("已有账号？", "Already have an account?") : tr("还没有账号？", "New here?")} <button className="login-mode-button" type="button" disabled={pending} onClick={() => onModeChange(registering ? "login" : "register")}>{registering ? tr("返回登录", "Back to sign in") : tr("创建账号", "Create account")}</button></small>
      </form>
    </div>
  );
}
