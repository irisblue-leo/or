"use client";

import { useState, useEffect } from "react";
import { OpenClawLogo, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";

type AuthMode = "login" | "register";

interface AuthDrawerProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthDrawer({ open, mode, onClose, onModeChange }: AuthDrawerProps) {
  const { t } = useTranslation();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setShowPwd(false);
    setCodeSent(false);
    setCountdown(0);
  }, [mode, open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("token", data.token);
      window.location.href = data.user?.role === "admin" ? "/admin" : "/dashboard";
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setLoading(false); }
  }

  async function handleSendCode() {
    if (!email) {
      setError("请输入邮箱");
      return;
    }

    setSendingCode(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "发送验证码失败");

      setCodeSent(true);
      setSuccess("验证码已发送，请查收邮件");
      setCountdown(60);

      // 倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发送验证码失败");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");

    if (!code) {
      setError("请输入验证码");
      return;
    }
    if (password.length < 8) { setError("密码至少需要 8 个字符"); return; }
    if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "注册失败");
      localStorage.setItem("token", data.token);
      setSuccess("注册成功！正在跳转...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "注册失败"); }
    finally { setLoading(false); }
  }

  const isLogin = mode === "login";
  const handleSubmit = isLogin ? handleLogin : handleRegister;

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-[var(--bg-primary)] shadow-2xl transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-2">
              <OpenClawLogo size={28} />
              <span className="font-semibold">OpenClaw Relay</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-1">{t(isLogin ? 'login.title' : 'register.title')}</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">{t(isLogin ? 'login.subtitle' : 'register.subtitle')}</p>
            {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t(isLogin ? 'login.email' : 'register.email')}</label>
                {!isLogin ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><MailIcon size={16} /></span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode || countdown > 0 || !email}
                      className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm whitespace-nowrap"
                    >
                      {sendingCode ? "发送中..." : countdown > 0 ? `${countdown}秒` : "发送验证码"}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><MailIcon size={16} /></span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" />
                  </div>
                )}
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">验证码</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    placeholder="请输入 6 位验证码"
                    maxLength={6}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t(isLogin ? 'login.password' : 'register.password')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><LockIcon size={16} /></span>
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                    {showPwd ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('register.confirmPassword')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><LockIcon size={16} /></span>
                    <input type={showPwd ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
              )}
              <button type="submit" disabled={loading || (!isLogin && !codeSent)} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors text-sm">
                {loading ? "..." : (isLogin ? t('login.button') : t('register.button'))}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
              {isLogin ? t('login.noAccount') : t('register.hasAccount')}{" "}
              <button onClick={() => onModeChange(isLogin ? "register" : "login")} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                {isLogin ? t('login.register') : t('register.login')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}