'use client'

import { useState } from "react";
import { OpenClawLogo, CodeIcon, KeyIcon, BookIcon, ZapIcon } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import AuthDrawer from "@/components/AuthDrawer";

type AuthMode = "login" | "register";

type ModelItem = { id: string; provider: string; input: string; output: string };

const providerMeta: Record<string, { color: string; activeColor: string }> = {
  "OpenAI": { color: "text-green-700 bg-green-50 border-green-200 hover:bg-green-100", activeColor: "text-white bg-green-600 border-green-600" },
  "Anthropic": { color: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100", activeColor: "text-white bg-orange-600 border-orange-600" },
  "Google": { color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100", activeColor: "text-white bg-blue-600 border-blue-600" },
  "DeepSeek": { color: "text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100", activeColor: "text-white bg-cyan-600 border-cyan-600" },
  "Qwen": { color: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100", activeColor: "text-white bg-purple-600 border-purple-600" },
  "ByteDance": { color: "text-pink-700 bg-pink-50 border-pink-200 hover:bg-pink-100", activeColor: "text-white bg-pink-600 border-pink-600" },
  "Meta": { color: "text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100", activeColor: "text-white bg-sky-600 border-sky-600" },
  "Mistral": { color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100", activeColor: "text-white bg-amber-600 border-amber-600" },
};
const defaultMeta = { color: "text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100", activeColor: "text-white bg-gray-600 border-gray-600" };

function ModelSection({ models, t }: { models: ModelItem[]; t: (k: any) => string }) {
  const providers = Array.from(new Set(models.map(m => m.provider)));
  const [activeProvider, setActiveProvider] = useState(providers[0]);
  const filtered = models.filter(m => m.provider === activeProvider);

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <KeyIcon size={18} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold">{t('docs.models')}</h2>
        <span className="ml-2 text-sm text-[var(--text-muted)]">{models.length} {t('docs.models.total')}</span>
      </div>

      {/* Provider Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {providers.map(p => {
          const meta = providerMeta[p] || defaultMeta;
          const isActive = p === activeProvider;
          const count = models.filter(m => m.provider === p).length;
          return (
            <button
              key={p}
              onClick={() => setActiveProvider(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isActive ? meta.activeColor : meta.color}`}
            >
              {p} ({count})
            </button>
          );
        })}
      </div>

      {/* Model Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              <th className="text-left px-6 py-3 font-medium">{t('home.pricing.model')}</th>
              <th className="text-right px-6 py-3 font-medium">{t('home.pricing.input')} ($/1M)</th>
              <th className="text-right px-6 py-3 font-medium">{t('home.pricing.output')} ($/1M)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={i} className="border-t border-[var(--border-light)] hover:bg-[var(--bg-secondary)] transition-colors">
                <td className="px-6 py-3 font-medium">{m.id}</td>
                <td className="px-6 py-3 text-right text-indigo-600 font-mono">${m.input}</td>
                <td className="px-6 py-3 text-right text-indigo-600 font-mono">${m.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const endpoints = [
  {
    method: "POST",
    path: "/v1/chat/completions",
    descKey: "docs.endpoints.chat",
    body: `{
  "model": "DeepSeek V3.2",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false
}`,
    response: `{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "deepseek/deepseek-v3.2",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  }
}`,
  },
  {
    method: "GET",
    path: "/v1/models",
    descKey: "docs.endpoints.models",
    body: null,
    response: `{
  "data": [
    { "id": "GPT-5.4", "object": "model" },
    { "id": "Claude Opus 4.6", "object": "model" },
    { "id": "Gemini 3.1 Pro", "object": "model" },
    { "id": "DeepSeek V3.2", "object": "model" },
    { "id": "Qwen3.5 397B", "object": "model" },
    ...
  ]
}`,
  },
  {
    method: "GET",
    path: "/v1/usage",
    descKey: "docs.endpoints.usage",
    body: null,
    response: `{
  "total_tokens": 125400,
  "total_cost": 3.25,
  "period": "2026-02"
}`,
  },
];

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <pre className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] overflow-x-auto text-sm">
      <code className="text-[var(--text-primary)] font-mono whitespace-pre">{code}</code>
    </pre>
  );
}

export default function DocsPage() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setDrawerOpen(true);
  }

  const models = [
    // OpenAI
    { id: "GPT-5.4 Pro", provider: "OpenAI", input: "33.00", output: "198.00" },
    { id: "GPT-5.4", provider: "OpenAI", input: "2.75", output: "16.50" },
    { id: "GPT-5.3 Codex", provider: "OpenAI", input: "1.93", output: "15.40" },
    { id: "GPT-5.2 Pro", provider: "OpenAI", input: "23.10", output: "184.80" },
    { id: "GPT-5.2", provider: "OpenAI", input: "1.93", output: "15.40" },
    { id: "GPT-5 Pro", provider: "OpenAI", input: "16.50", output: "132.00" },
    { id: "GPT-5", provider: "OpenAI", input: "1.38", output: "11.00" },
    { id: "GPT-5 Mini", provider: "OpenAI", input: "0.28", output: "2.20" },
    { id: "GPT-5 Nano", provider: "OpenAI", input: "0.06", output: "0.44" },
    { id: "GPT-4.1", provider: "OpenAI", input: "2.20", output: "8.80" },
    { id: "GPT-4.1 Mini", provider: "OpenAI", input: "0.44", output: "1.76" },
    { id: "o3 Pro", provider: "OpenAI", input: "22.00", output: "88.00" },
    { id: "o3", provider: "OpenAI", input: "2.20", output: "8.80" },
    { id: "o4-mini", provider: "OpenAI", input: "1.21", output: "4.84" },
    // Anthropic
    { id: "Claude Opus 4.6", provider: "Anthropic", input: "5.50", output: "27.50" },
    { id: "Claude Sonnet 4.6", provider: "Anthropic", input: "3.30", output: "16.50" },
    { id: "Claude Sonnet 4.5", provider: "Anthropic", input: "3.30", output: "16.50" },
    { id: "Claude Haiku 4.5", provider: "Anthropic", input: "1.10", output: "5.50" },
    // Google
    { id: "Gemini 3.1 Pro", provider: "Google", input: "2.20", output: "13.20" },
    { id: "Gemini 3 Flash", provider: "Google", input: "0.55", output: "3.30" },
    { id: "Gemini 2.5 Pro", provider: "Google", input: "1.38", output: "11.00" },
    { id: "Gemini 2.5 Flash", provider: "Google", input: "0.33", output: "2.75" },
    { id: "Gemini 2.0 Flash", provider: "Google", input: "0.00", output: "0.00" },
    // DeepSeek
    { id: "DeepSeek V3.2", provider: "DeepSeek", input: "0.28", output: "0.44" },
    { id: "DeepSeek R1", provider: "DeepSeek", input: "0.50", output: "2.37" },
    // Qwen
    { id: "Qwen3.5 397B", provider: "Qwen", input: "0.43", output: "2.57" },
    { id: "Qwen3 Max Thinking", provider: "Qwen", input: "0.86", output: "4.29" },
    { id: "Qwen3.5 Flash", provider: "Qwen", input: "0.11", output: "0.44" },
    { id: "Qwen3 Coder", provider: "Qwen", input: "0.24", output: "1.10" },
    // ByteDance
    { id: "即梦 Seed 2.0 Lite", provider: "ByteDance", input: "0.28", output: "2.20" },
    { id: "即梦 Seed 2.0 Mini", provider: "ByteDance", input: "0.11", output: "0.44" },
    // Meta
    { id: "Llama 4 Maverick", provider: "Meta", input: "0.17", output: "0.66" },
    { id: "Llama 4 Scout", provider: "Meta", input: "0.09", output: "0.33" },
    // Mistral
    { id: "Mistral Large", provider: "Mistral", input: "0.55", output: "1.65" },
    { id: "Codestral", provider: "Mistral", input: "0.33", output: "0.99" },
    // Others
    { id: "MiniMax M2.5", provider: "MiniMax", input: "0.30", output: "1.05" },
    { id: "GLM-5", provider: "智谱AI", input: "0.79", output: "2.53" },
    { id: "Mercury 2", provider: "Inception", input: "0.28", output: "0.83" },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav - 与首页完全一致 */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <OpenClawLogo size={28} />
              <span className="text-lg font-semibold tracking-tight">OpenClaw Relay</span>
            </a>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.pricing')}</a>
            <a href="/learn" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.learn')}</a>
            <a href="/docs" className="text-[var(--text-primary)] font-medium">{t('nav.docs')}</a>
            <LanguageSwitcher />
            <button onClick={() => openAuth("register")} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Intro */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {t('docs.title')}
            </h1>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl text-lg">
              {t('docs.subtitle')}
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ZapIcon size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">{t('docs.quickstart')}</h2>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-semibold">{t('docs.quickstart.step1')}</span>
                </div>
                <CodeBlock code="https://relay.agentopc.xyz/v1" />
              </div>
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-semibold">{t('docs.quickstart.step2')}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{t('docs.quickstart.step2.desc')}</p>
                <CodeBlock code={`Authorization: Bearer sk-relay-your-api-key`} />
              </div>
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-bold">3</span>
                  <span className="font-semibold">{t('docs.quickstart.step3')}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{t('docs.quickstart.step3.desc')}</p>
                <CodeBlock lang="yaml" code={`models:
  - id: DeepSeek V3.2
    provider: openai-compatible
    baseUrl: https://relay.agentopc.xyz/v1
    apiKey: sk-relay-your-api-key`} />
              </div>
            </div>
          </section>

          {/* cURL Example */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <CodeIcon size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">{t('docs.curl')}</h2>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
              <CodeBlock lang="bash" code={`curl https://relay.agentopc.xyz/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-relay-your-api-key" \\
  -d '{
    "model": "DeepSeek V3.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`} />
            </div>
          </section>

          {/* Endpoints */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <BookIcon size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold">{t('docs.endpoints')}</h2>
            </div>
            <div className="space-y-6">
              {endpoints.map((ep, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors overflow-hidden">
                  <div className="px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ep.method === "POST" 
                          ? "bg-green-500/10 text-green-600" 
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-semibold">{ep.path}</code>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{t(ep.descKey as any)}</p>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    {ep.body && (
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('docs.request')}</div>
                        <CodeBlock code={ep.body} />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('docs.response')}</div>
                      <CodeBlock code={ep.response} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Supported Models */}
          <ModelSection models={models} t={t} />

          {/* Rate Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{t('docs.ratelimit')}</h2>
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6 text-sm space-y-3">
              <p className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{t('docs.ratelimit.desc1')}</span>
              </p>
              <p className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{t('docs.ratelimit.desc2')}</span>
              </p>
              <p className="flex items-start gap-2 text-[var(--text-secondary)]">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{t('docs.ratelimit.desc3')} <code className="text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded text-xs font-mono">X-RateLimit-Remaining</code></span>
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-[var(--border-light)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <OpenClawLogo size={20} />
            <span>OpenClaw Relay</span>
          </div>
          <span>{t('footer.copyright')}</span>
        </div>
      </footer>

      <AuthDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
}
