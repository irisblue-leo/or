"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OpenClawLogo } from "@/components/icons";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("验证令牌缺失");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setMessage(data.error);
        } else {
          setStatus("success");
          setMessage(data.message || "邮箱验证成功！");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("验证失败，请稍后重试");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="flex items-center gap-3 mb-6">
            <OpenClawLogo size={40} />
            <span className="text-xl font-semibold tracking-tight">OpenClaw Relay</span>
          </a>
          <h1 className="text-2xl font-bold">邮箱验证</h1>
        </div>

        {status === "loading" && (
          <div className="px-6 py-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">正在验证...</p>
          </div>
        )}

        {status === "success" && (
          <div className="px-6 py-8 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-green-600 font-medium mb-4">{message}</p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-sm"
            >
              前往控制台
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="px-6 py-8 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <a
              href="/login"
              className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-sm"
            >
              返回登录
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-8">
            <a href="/" className="flex items-center gap-3 mb-6">
              <OpenClawLogo size={40} />
              <span className="text-xl font-semibold tracking-tight">OpenClaw Relay</span>
            </a>
            <h1 className="text-2xl font-bold">邮箱验证</h1>
          </div>
          <div className="px-6 py-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">正在加载...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
