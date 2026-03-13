"use client";

import { useState, useEffect, useCallback } from "react";
import {
  OpenClawLogo, KeyIcon, ChartIcon, DollarIcon, PlusIcon,
  TrashIcon, CopyIcon, LogOutIcon, HomeIcon, TicketIcon, CryptoIcon,
} from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

interface UserInfo { id: string; email: string; name: string | null; balance: number; role: string }
interface ApiKeyInfo { id: string; key: string; name: string; active: boolean; createdAt: string }
interface UsageLog { model: { name: string }; inputTokens: number; outputTokens: number; cost: number; createdAt: string }
interface DayStat { requests: number; cost: number }
interface SummaryData {
  totalRequests: number; totalInputTokens: number; totalOutputTokens: number; totalCost: number;
  balance: number; byDay: Record<string, DayStat>;
}

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }; }

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">{icon}</div>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { window.location.href = "/?auth=login"; return; }
    try {
      const [userRes, keysRes, summaryRes, usageRes] = await Promise.all([
        fetch("/api/auth/me", { headers: authHeaders() }),
        fetch("/api/keys", { headers: authHeaders() }),
        fetch("/api/usage/summary?days=7", { headers: authHeaders() }),
        fetch("/api/usage?limit=5", { headers: authHeaders() }),
      ]);
      if (!userRes.ok) { window.location.href = "/?auth=login"; return; }
      setUser(await userRes.json());
      setKeys(await keysRes.json());
      setSummary(await summaryRes.json());
      const usageData = await usageRes.json();
      setRecentLogs(usageData.logs || []);
    } catch { window.location.href = "/?auth=login"; }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function copyKey(id: string, key: string) {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function createKey() {
    const res = await fetch("/api/keys", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ name: newKeyName || "Default" }),
    });
    if (res.ok) { setNewKeyName(""); setShowNewKey(false); fetchData(); }
  }

  async function deleteKey(id: string) {
    const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) fetchData();
  }

  function logout() { localStorage.removeItem("token"); window.location.href = "/?auth=login"; }

  // Build 7-day chart data
  const chartData: { date: string; tokens: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const day = summary?.byDay?.[key];
    chartData.push({ date: label, tokens: day ? day.requests : 0 });
  }
  const maxTokens = Math.max(...chartData.map(d => d.tokens), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">Dashboard</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><HomeIcon size={18} /></a>
            <a href="/dashboard/crypto" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title={t('crypto.title')}><CryptoIcon size={18} /></a>
            <a href="/dashboard/redeem" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title={t('dashboard.redeemCode')}><TicketIcon size={18} /></a>
            <span className="text-[var(--text-secondary)]">{user?.email}</span>
            <LanguageSwitcher />
            <button onClick={logout} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><LogOutIcon size={18} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<DollarIcon size={18} />} label={t('dashboard.balance')} value={`$${(user?.balance ?? 0).toFixed(2)}`} sub={t('dashboard.balance')} />
          <StatCard icon={<ChartIcon size={18} />} label={t('dashboard.usage')} value={String(summary?.totalRequests ?? 0)} sub={`${((summary?.totalInputTokens ?? 0) + (summary?.totalOutputTokens ?? 0)).toLocaleString()} tokens`} />
          <StatCard icon={<KeyIcon size={18} />} label={t('dashboard.apiKeys')} value={String(keys.length)} sub="active keys" />
        </div>

        {/* Usage Chart */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.usage')} (7 {t('home.cta.step1').includes('天') ? '天' : 'days'})</h2>
          <div className="flex items-end gap-3 h-40">
            {chartData.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative" style={{ height: "120px" }}>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    {d.date} · {d.tokens} {t('dashboard.usage').includes('统计') || t('dashboard.usage').includes('統計') ? '次调用' : 'calls'}
                  </div>
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all cursor-pointer hover:from-indigo-500 hover:to-indigo-300"
                    style={{ height: `${(d.tokens / maxTokens) * 100}%`, minHeight: d.tokens > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)]">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Keys */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('dashboard.apiKeys')}</h2>
              <button onClick={() => setShowNewKey(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors">
                <PlusIcon size={14} /> {t('dashboard.createKey')}
              </button>
            </div>
            {showNewKey && (
              <div className="flex gap-2 mb-4">
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder={t('dashboard.keyName')} className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500" />
                <button onClick={createKey} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{t('dashboard.createKey')}</button>
                <button onClick={() => setShowNewKey(false)} className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]">{t('admin.cancel')}</button>
              </div>
            )}
            <div className="space-y-3">
              {keys.length === 0 && <p className="text-sm text-[var(--text-muted)]">No API keys yet. Create one to get started.</p>}
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div>
                    <div className="text-sm font-medium">{k.name}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{k.key.slice(0, 12)}...{k.key.slice(-4)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyKey(k.id, k.key)} className="p-1.5 rounded-md hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Copy">
                      {copied === k.id ? <span className="text-xs text-green-500">{t('dashboard.keyCopied')}</span> : <CopyIcon size={14} />}
                    </button>
                    <button onClick={() => deleteKey(k.id)} className="p-1.5 rounded-md hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-red-500 transition-colors" title={t('dashboard.deleteKey')}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Calls */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="text-lg font-semibold mb-4">{t('dashboard.usage')}</h2>
            <div className="space-y-3">
              {recentLogs.length === 0 && <p className="text-sm text-[var(--text-muted)]">No API calls yet.</p>}
              {recentLogs.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div>
                    <div className="text-sm font-medium">{r.model.name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{(r.inputTokens + r.outputTokens).toLocaleString()} tokens</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-indigo-600">${r.cost.toFixed(4)}</div>
                    <div className="text-xs text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-light)] py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-[var(--text-muted)]">
          © 2026 AgentOPC Team
        </div>
      </footer>
    </div>
  );
}
