"use client";

import { useState } from "react";
import { OpenClawLogo, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
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

  async function handleSendCode() {
    if (!email) {
      setError("请输入邮箱");
      return;
    }

    setSendingCode(true);
    setError("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code) {
      setError("请输入验证码");
      return;
    }
    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "注册失败");

      localStorage.setItem("token", data.token);
      setSuccess("注册成功！正在跳转...");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex items-center gap-3 mb-6">
            <OpenClawLogo size={40} />
            <span className="text-xl font-semibold tracking-tight">OpenClaw Relay</span>
          </a>
          <h1 className="text-2xl font-bold">{t('register.title')}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">{error}</div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">{success}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">邮箱</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><MailIcon size={16} /></span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                />
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
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">验证码</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="请输入 6 位验证码"
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">密码</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><LockIcon size={16} /></span>
              <input id="password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                {showPwd ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">确认密码</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><LockIcon size={16} /></span>
              <input id="confirmPassword" type={showPwd ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading || !codeSent} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm">
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          已有账号？{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-500 transition-colors">立即登录</a>
        </p>
      </div>
    </div>
  );
}
