"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OpenClawLogo, SettingsIcon, HomeIcon, LogOutIcon, CheckIcon, GlobeIcon } from "@/components/icons";
import { useLanguageStore } from "@/store/languageStore";
import { translations } from "@/lib/translations";

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
  const { language, setLanguage } = useLanguageStore();
  const t = (key: string) => (translations[language] as any)[key] || key;
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
        setMessage(t("settings.saved"));
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(t("settings.saveFailed"));
      }
    } catch {
      setMessage(t("settings.saveFailed"));
    }

    setSaving(false);
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              {t("settings.title")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {/* 语言切换 */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <GlobeIcon size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                <button
                  onClick={() => setLanguage("zh-CN")}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 flex items-center justify-between group/item"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-base text-gray-500 font-medium">简</span>
                    <span className="text-base text-gray-700">简体中文</span>
                  </div>
                  {language === "zh-CN" && (
                    <CheckIcon size={20} className="text-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setLanguage("zh-TW")}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 flex items-center justify-between group/item"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-base text-gray-500 font-medium">繁</span>
                    <span className="text-base text-gray-700">繁體中文</span>
                  </div>
                  {language === "zh-TW" && (
                    <CheckIcon size={20} className="text-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 flex items-center justify-between group/item"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-base text-gray-500 font-medium">EN</span>
                    <span className="text-base text-gray-700">English</span>
                  </div>
                  {language === "en" && (
                    <CheckIcon size={20} className="text-blue-600" />
                  )}
                </button>
              </div>
            </div>

            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              <HomeIcon size={18} />
            </a>
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t("nav.dashboard")}
            </a>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900 transition-colors">
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* 聚合器选择 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={20} className="text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">{t("settings.aggregator.title")}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t("settings.aggregator.description")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 默认聚合器 */}
              <button
                onClick={() => setPreferredAggregator("default")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "default"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{t("settings.aggregator.default.title")}</h3>
                  {preferredAggregator === "default" && (
                    <CheckIcon size={20} className="text-indigo-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 text-left">
                  {t("settings.aggregator.default.description")}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  {t("settings.aggregator.default.note")}
                </div>
              </button>

              {/* OpenRouter 聚合器 */}
              <button
                onClick={() => setPreferredAggregator("openrouter")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "openrouter"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{t("settings.aggregator.openrouter.title")}</h3>
                  {preferredAggregator === "openrouter" && (
                    <CheckIcon size={20} className="text-indigo-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 text-left">
                  {t("settings.aggregator.openrouter.description")}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  {t("settings.aggregator.openrouter.note")}
                </div>
              </button>

              {/* 302.ai 聚合器 */}
              <button
                onClick={() => setPreferredAggregator("302ai")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferredAggregator === "302ai"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{t("settings.aggregator.302ai.title")}</h3>
                  {preferredAggregator === "302ai" && (
                    <CheckIcon size={20} className="text-indigo-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 text-left">
                  {t("settings.aggregator.302ai.description")}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  {t("settings.aggregator.302ai.note")}
                </div>
              </button>
            </div>
          </div>

          {/* 智能模型选择 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {t("settings.smartModel.title")}
                </h2>
                <p className="text-sm text-gray-600">
                  {t("settings.smartModel.description")}
                </p>
              </div>
              <button
                onClick={() => setEnableSmartModel(!enableSmartModel)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableSmartModel ? "bg-indigo-600" : "bg-gray-300"
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
              <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-900 mb-2">
                  {t("settings.smartModel.howItWorks")}
                </h3>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• {t("settings.smartModel.rule1")}</li>
                  <li>• {t("settings.smartModel.rule2")}</li>
                  <li>• {t("settings.smartModel.rule3")}</li>
                  <li>• {t("settings.smartModel.rule4")}</li>
                </ul>
              </div>
            )}
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {message && (
                <span className={message.includes("成功") || message.includes("成功") || message.includes("success") ? "text-green-600" : "text-red-600"}>
                  {message}
                </span>
              )}
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
