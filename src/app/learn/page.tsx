'use client'

import { useState } from "react";
import { OpenClawLogo, BookIcon, CodeIcon, ZapIcon, ShieldIcon } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AuthDrawer from "@/components/AuthDrawer";
import { useTranslation } from "@/hooks/useTranslation";

type AuthMode = "login" | "register";

export default function LearnPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"config" | "quickstart" | "advanced">("config");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setDrawerOpen(true);
  }

  const configExample = `{
  "models": {
    "providers": {
      "anthropic-custom": {
        "baseUrl": "https://relay.agentopc.xyz/v1",
        "apiKey": "sk-relay-your-api-key-here",
        "models": [
          {
            "id": "claude-opus-4-6",
            "name": "claude-opus-4-6",
            "api": "openai-completions",
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic-custom/claude-opus-4-6"
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "accounts": {
        "default": {
          "botToken": "your-telegram-bot-token",
          "dmPolicy": "open"
        }
      }
    }
  }
}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 sm:gap-3">
            <OpenClawLogo size={28} />
            <span className="text-base sm:text-lg font-semibold tracking-tight">OpenClaw Relay</span>
          </a>
          <div className="flex items-center gap-6 text-sm">
            <a href="/#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline">{t('nav.pricing')}</a>
            <a href="/learn" className="text-[var(--text-primary)] font-medium">{t('nav.learn')}</a>
            <a href="/docs" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.docs')}</a>
            <LanguageSwitcher />
            <button onClick={() => openAuth("register")} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm transition-colors">
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-8 px-6 border-b border-[var(--border-light)]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            {t("learn.title")}
          </h1>
          <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl text-lg">
            {t("learn.subtitle")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pt-12 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "config"
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100"
              }`}
            >
              配置示例
            </button>
            <button
              onClick={() => setActiveTab("quickstart")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "quickstart"
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100"
              }`}
            >
              快速开始
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "advanced"
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100"
              }`}
            >
              高级配置
            </button>
          </div>

          {/* Config Tab */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                <h2 className="text-2xl font-bold mb-4">{t("learn.config.title")}</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {t("learn.config.desc")} <code className="px-2 py-0.5 rounded bg-gray-100 text-xs font-mono">{t("learn.config.file")}</code> {t("learn.config.desc2")}
                </p>
                <pre className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                  <code>{configExample}</code>
                </pre>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
                    <CodeIcon size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("learn.config.card1.title")}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("learn.config.card1.desc")}
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                    <ZapIcon size={20} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("learn.config.card2.title")}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("learn.config.card2.desc")}
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                    <ShieldIcon size={20} className="text-cyan-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("learn.config.card3.title")}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("learn.config.card3.desc")}
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <BookIcon size={20} className="text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t("learn.config.card4.title")}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("learn.config.card4.desc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quickstart Tab */}
          {activeTab === "quickstart" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <h2 className="text-xl font-bold mb-4">{t("learn.quickstart.title")}</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h3 className="font-semibold mb-1">{t("learn.quickstart.step1.title")}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{t("learn.quickstart.step1.desc")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h3 className="font-semibold mb-1">{t("learn.quickstart.step2.title")}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{t("learn.quickstart.step2.desc")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h3 className="font-semibold mb-1">{t("learn.quickstart.step3.title")}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{t("learn.quickstart.step3.desc")}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h3 className="font-semibold mb-1">{t("learn.quickstart.step4.title")}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{t("learn.quickstart.step4.desc")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50">
                <div className="flex gap-3">
                  <svg className="flex-shrink-0 w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1">{t("learn.quickstart.tip.title")}</h4>
                    <p className="text-sm text-indigo-700">
                      {t("learn.quickstart.tip.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <h2 className="text-xl font-bold mb-4">{t("learn.advanced.title")}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{t("learn.advanced.multi.title")}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{t("learn.advanced.multi.desc")}</p>
                    <pre className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] p-3 rounded-lg overflow-x-auto text-xs">
{`"models": [
  {
    "id": "claude-opus-4-6",
    "name": "claude-opus-4-6",
    "api": "openai-completions"
  },
  {
    "id": "gpt-5.4",
    "name": "gpt-5.4",
    "api": "openai-completions"
  }
]`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">{t("learn.advanced.context.title")}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{t("learn.advanced.context.desc")}</p>
                    <pre className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] p-3 rounded-lg overflow-x-auto text-xs">
{`"contextWindow": 200000,  // 上下文窗口大小
"maxTokens": 8192          // 单次输出最大 token 数`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">{t("learn.advanced.stream.title")}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t("learn.advanced.stream.desc")}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">{t("learn.advanced.ratelimit.title")}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t("learn.advanced.ratelimit.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-light)] py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <OpenClawLogo size={20} />
            <span>OpenClaw Relay</span>
          </div>
          <span>© 2026 AgentOPC Team</span>
        </div>
      </footer>

      <AuthDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
}
