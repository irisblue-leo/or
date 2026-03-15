"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OpenClawLogo, SettingsIcon, HomeIcon, LogOutIcon, CheckIcon } from "@/components/icons";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredAggregator, setPreferredAggregator] = useState<"default" | "openrouter" | "302ai">("default");
  const [enableSmartModel, setEnableSmartModel] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/settings", { headers: authHeaders() });
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setPreferredAggregator(data.preferredAggregator || "default");
      setEnableSmartModel(data.enableSmartModel || false);
    } catch {
      router.push("/login");
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          preferredAggregator,
          enableSmartModel,
        }),
      });

      if (res.ok) {
        setMessage("设置已保存");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("保存失败");
      }
    } catch {
      setMessage("保存失败");
    }

    setSaving(false);
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">设置</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">
              <HomeIcon size={18} />
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </a>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* 聚合器选择 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={20} />
              <h2 className="text-lg font-semibold">聚合器选择</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              选择您要使用的模型聚合器。默认聚合器提供 GPT-4o 和 Claude 3.5 Sonnet 两个精选模型，
              OpenRouter 聚合器提供 50+ 个模型，302.ai 聚合器提供国内优化的 AI 模型服务。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 默认聚合器 */}
              <button
                onClick={() => setPreferredAggregator("default")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "default"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">默认聚合器</h3>
                  {preferredAggregator === "default" && (
                    <CheckIcon size={20} className="text-indigo-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 text-left">
                  精选 2 个模型：GPT-4o、Claude 3.5 Sonnet
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  适合大多数场景，简单易用
                </div>
              </button>

              {/* OpenRouter 聚合器 */}
              <button
                onClick={() => setPreferredAggregator("openrouter")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "openrouter"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">OpenRouter 聚合器</h3>
                  {preferredAggregator === "openrouter" && (
                    <CheckIcon size={20} className="text-indigo-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 text-left">
                  50+ 个模型：OpenAI、Anthropic、Google、国产模型等
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  适合需要更多模型选择的用户
                </div>
              </button>

              {/* 302.ai 聚合器 */}
              <button
                onClick={() => setPreferredAggregator("302ai")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "302ai"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">302.ai 聚合器</h3>
                  {preferredAggregator === "302ai" && (
                    <CheckIcon size={20} className="text-indigo-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 text-left">
                  5 个模型：GPT-4o、Claude、DeepSeek、Qwen、GLM-4
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  国内优化，响应快速
                </div>
              </button>
            </div>
          </div>

          {/* 智能模型选择 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">智能模型选择</h2>
                <p className="text-sm text-gray-400">
                  启用后，可以使用 <code className="px-2 py-0.5 rounded bg-gray-800 text-indigo-300">model: "auto"</code> 参数，
                  系统会根据您的输入自动选择最合适的模型。
                </p>
              </div>
              <button
                onClick={() => setEnableSmartModel(!enableSmartModel)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableSmartModel ? "bg-indigo-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableSmartModel ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {enableSmartModel && (
              <div className="mt-4 p-4 rounded-lg bg-gray-950 border border-gray-800">
                <h3 className="text-sm font-semibold mb-2">智能选择规则</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 代码相关 → Claude 3.5 Sonnet</li>
                  <li>• 数学推理 → GPT-4o</li>
                  <li>• 创意写作 → Claude 3.5 Sonnet</li>
                  <li>• 长文本理解 → Gemini 1.5 Pro（仅 OpenRouter）</li>
                  <li>• 简单对话 → GPT-4o-mini（仅 OpenRouter）</li>
                </ul>
              </div>
            )}
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center justify-between">
            <div>
              {message && (
                <span
                  className={`text-sm ${
                    message.includes("成功") ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {message}
                </span>
              )}
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
