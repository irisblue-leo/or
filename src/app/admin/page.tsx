"use client";

import { useState, useEffect, useCallback } from "react";
import {
  OpenClawLogo, UsersIcon, ServerIcon, DollarIcon, ChartIcon,
  SettingsIcon, HomeIcon, LogOutIcon, PlusIcon, TrashIcon, TicketIcon, ZapIcon, CryptoIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import Pagination from "@/components/Pagination";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }; }

interface StatsData { totalUsers: number; totalKeys: number; totalRequests: number; totalRevenue: number; totalUpstreamCost: number; profit: number }
interface UserData { id: string; email: string; name: string | null; role: string; balance: number; _count: { usageLogs: number; apiKeys: number } }
interface ModelData { id: string; name: string; provider: string; upstreamProvider?: string; upstreamModelId?: string | null; providerId?: string | null; inputPrice: number; outputPrice: number; upstreamInput: number; upstreamOutput: number; priceMultiplier: number; active: boolean }
interface ProviderData { id: string; name: string; slug: string; apiUrl: string; apiKey: string; priceMultiplier: number; active: boolean; priority: number; notes: string | null; _count?: { models: number } }

type Tab = "overview" | "users" | "models" | "providers" | "pricing" | "crypto" | "router";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>{icon}</div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: t('admin.overview'), icon: <ChartIcon size={16} /> },
    { key: "users", label: t('admin.users'), icon: <UsersIcon size={16} /> },
    { key: "models", label: t('admin.models'), icon: <ServerIcon size={16} /> },
    { key: "providers", label: t('admin.providers'), icon: <ZapIcon size={16} /> },
    { key: "pricing", label: t('admin.pricing'), icon: <DollarIcon size={16} /> },
    { key: "crypto", label: t('admin.crypto'), icon: <CryptoIcon size={16} /> },
    { key: "router", label: t('admin.router'), icon: <SettingsIcon size={16} /> },
  ];
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [models, setModels] = useState<ModelData[]>([]);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [cryptoDeposits, setCryptoDeposits] = useState<any[]>([]);
  const [cryptoStats, setCryptoStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newModel, setNewModel] = useState({ name: "", provider: "openai", upstreamProvider: "openai", upstreamModelId: "", providerId: "", inputPrice: 0, outputPrice: 0, upstreamInput: 0, upstreamOutput: 0 });
  const [topupUserId, setTopupUserId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userUsage, setUserUsage] = useState<any>(null);
  const [showGenerateCodes, setShowGenerateCodes] = useState(false);
  const [codeAmount, setCodeAmount] = useState("10");
  const [codeCount, setCodeCount] = useState("1");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  // 分页状态
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotalCount, setUsersTotalCount] = useState(0);
  const [modelsPage, setModelsPage] = useState(1);
  const [modelsTotalPages, setModelsTotalPages] = useState(1);
  const [modelsTotalCount, setModelsTotalCount] = useState(0);
  const [providersPage, setProvidersPage] = useState(1);
  const [providersTotalPages, setProvidersTotalPages] = useState(1);
  const [providersTotalCount, setProvidersTotalCount] = useState(0);
  const [cryptoPage, setCryptoPage] = useState(1);
  const [cryptoTotalPages, setCryptoTotalPages] = useState(1);
  const [cryptoTotalCount, setCryptoTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { window.location.href = "/?auth=login"; return; }
    try {
      const [statsRes, usersRes, modelsRes, providersRes, cryptoRes] = await Promise.all([
        fetch("/api/admin/stats?days=30", { headers: authHeaders() }),
        fetch(`/api/admin/users?limit=${itemsPerPage}&offset=${(usersPage - 1) * itemsPerPage}`, { headers: authHeaders() }),
        fetch(`/api/admin/models?limit=${itemsPerPage}&offset=${(modelsPage - 1) * itemsPerPage}`, { headers: authHeaders() }),
        fetch(`/api/admin/providers?limit=${itemsPerPage}&offset=${(providersPage - 1) * itemsPerPage}`, { headers: authHeaders() }),
        fetch(`/api/admin/crypto/deposits?limit=${itemsPerPage}&offset=${(cryptoPage - 1) * itemsPerPage}`, { headers: authHeaders() }),
      ]);
      if (!statsRes.ok) { window.location.href = "/?auth=login"; return; }
      setStats(await statsRes.json());
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      setUsersTotalCount(usersData.total || 0);
      setUsersTotalPages(Math.ceil((usersData.total || 0) / itemsPerPage));
      const modelsData = await modelsRes.json();
      setModels(modelsData.models || modelsData || []);
      setModelsTotalCount(modelsData.total || (Array.isArray(modelsData) ? modelsData.length : 0));
      setModelsTotalPages(Math.ceil((modelsData.total || (Array.isArray(modelsData) ? modelsData.length : 0)) / itemsPerPage));
      const providersData = await providersRes.json();
      setProviders(providersData.providers || (Array.isArray(providersData) ? providersData : []));
      setProvidersTotalCount(providersData.total || (Array.isArray(providersData) ? providersData.length : 0));
      setProvidersTotalPages(Math.ceil((providersData.total || (Array.isArray(providersData) ? providersData.length : 0)) / itemsPerPage));
      const cryptoData = await cryptoRes.json();
      setCryptoDeposits(cryptoData.deposits || []);
      setCryptoStats(cryptoData.stats || null);
      setCryptoTotalCount(cryptoData.total || 0);
      setCryptoTotalPages(Math.ceil((cryptoData.total || 0) / itemsPerPage));
    } catch { window.location.href = "/?auth=login"; }
    setLoading(false);
  }, [usersPage, modelsPage, providersPage, cryptoPage, itemsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function addModel() {
    const res = await fetch("/api/admin/models", { method: "POST", headers: authHeaders(), body: JSON.stringify(newModel) });
    if (res.ok) { setShowAddModel(false); setNewModel({ name: "", provider: "openai", upstreamProvider: "openai", upstreamModelId: "", providerId: "", inputPrice: 0, outputPrice: 0, upstreamInput: 0, upstreamOutput: 0 }); fetchData(); }
  }

  async function deleteModel(id: string) {
    const res = await fetch(`/api/admin/models?id=${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) fetchData();
  }

  async function toggleModel(id: string, active: boolean) {
    await fetch("/api/admin/models", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, active: !active }) });
    fetchData();
  }

  async function topupUser() {
    if (!topupUserId || !topupAmount) return;
    const currentUser = users.find(u => u.id === topupUserId);
    const newBalance = (currentUser?.balance || 0) + parseFloat(topupAmount);
    await fetch("/api/admin/users", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ userId: topupUserId, balance: newBalance }) });
    setTopupUserId(null); setTopupAmount(""); fetchData();
  }

  async function resetBalance(userId: string) {
    if (!confirm("Reset user balance to 0?")) return;
    await fetch("/api/admin/users", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ userId, balance: 0 }) });
    fetchData();
  }

  async function viewUserDetails(user: UserData) {
    setSelectedUser(user);
    // Fetch user usage summary
    const res = await fetch(`/api/admin/users/${user.id}/usage`, { headers: authHeaders() });
    if (res.ok) {
      setUserUsage(await res.json());
    }
  }

  async function generateRedeemCodes() {
    const amount = parseFloat(codeAmount);
    const count = parseInt(codeCount);
    if (!amount || amount <= 0 || !count || count <= 0) {
      alert("Invalid amount or count");
      return;
    }
    const res = await fetch("/api/admin/redeem-codes/generate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ amount, count }),
    });
    if (res.ok) {
      const data = await res.json();
      setGeneratedCodes(data.codes || []);
      setShowGenerateCodes(false);
      alert(`Generated ${data.codes.length} redeem codes with $${amount} each`);
    } else {
      alert("Failed to generate codes");
    }
  }

  function logout() { localStorage.removeItem("token"); window.location.href = "/?auth=login"; }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">Admin</span>
            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors"><HomeIcon size={18} /></a>
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors"><SettingsIcon size={18} /></a>
            <a href="/admin/redeem-codes" className="text-gray-600 hover:text-gray-900 transition-colors" title="Redeem Codes"><TicketIcon size={18} /></a>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900 transition-colors"><LogOutIcon size={18} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-1 mb-6 sm:mb-8 p-1 rounded-lg bg-gray-50 border border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${tab === t.key ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<UsersIcon size={18} />} label={t('admin.users')} value={String(stats.totalUsers)} color="#6366f1" />
              <StatCard icon={<DollarIcon size={18} />} label={t('admin.revenue')} value={`$${stats.totalRevenue.toFixed(2)}`} color="#22c55e" />
              <StatCard icon={<DollarIcon size={18} />} label={t('admin.upstreamCost')} value={`$${stats.totalUpstreamCost.toFixed(2)}`} color="#f59e0b" />
              <StatCard icon={<ChartIcon size={18} />} label={t('admin.totalCalls')} value={stats.totalRequests.toLocaleString()} color="#06b6d4" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold mb-2">{t('admin.profit')}</h2>
              <div className="text-3xl font-bold text-green-400">${stats.profit.toFixed(2)}</div>
              {stats.totalRevenue > 0 && <div className="text-sm text-gray-700 mt-1">{t('admin.margin')}: {((stats.profit / stats.totalRevenue) * 100).toFixed(1)}%</div>}
            </div>
          </>
        )}

        {tab === "users" && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowGenerateCodes(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                <PlusIcon size={14} /> {t('admin.generateCodes')}
              </button>
            </div>
            
            {showGenerateCodes && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-4 space-y-3">
                <h3 className="text-sm font-semibold">{t('admin.generateCodes')}</h3>
                <p className="text-xs text-gray-600">{t('admin.redeemCodes.noCodes')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={codeAmount} onChange={e => setCodeAmount(e.target.value)} placeholder={t('admin.redeemCodes.amountLabel')} type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <input value={codeCount} onChange={e => setCodeCount(e.target.value)} placeholder={t('admin.redeemCodes.countLabel')} type="number" min="1" max="100" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={generateRedeemCodes} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{t('admin.generate')}</button>
                  <button onClick={() => setShowGenerateCodes(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">{t('admin.cancel')}</button>
                </div>
              </div>
            )}
            
            {generatedCodes.length > 0 && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 mb-4">
                <h3 className="text-sm font-semibold text-green-700 mb-3">{t('admin.generatedCodes')} ({generatedCodes.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {generatedCodes.map((code, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-white border border-gray-200">
                      <code className="flex-1 text-xs font-mono text-gray-300">{code}</code>
                      <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs text-indigo-400 hover:text-indigo-600">{t('admin.copy')}</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setGeneratedCodes([])} className="mt-3 text-xs text-gray-600 hover:text-gray-900">{t('admin.clear')}</button>
              </div>
            )}
            
            {topupUserId && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 flex items-center gap-3">
                <span className="text-sm text-gray-600">{t('admin.topupFor')} {users.find(u => u.id === topupUserId)?.email}:</span>
                <input value={topupAmount} onChange={e => setTopupAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm w-32" />
                <button onClick={topupUser} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Add</button>
                <button onClick={() => setTopupUserId(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm">{t('admin.cancel')}</button>
              </div>
            )}
            
            <div className="rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-6 py-4 font-medium">{t('admin.email')}</th>
                  <th className="text-left px-6 py-4 font-medium">{t('admin.role')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('admin.balance')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('admin.keys')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('admin.calls')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-gray-700">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-indigo-600">${u.balance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{u._count.apiKeys}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{u._count.usageLogs.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewUserDetails(u)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">{t('admin.view')}</button>
                        <button onClick={() => setTopupUserId(u.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">{t('admin.topup')}</button>
                        <button onClick={() => resetBalance(u.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">{t('admin.reset')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={usersPage}
              totalPages={usersTotalPages}
              onPageChange={setUsersPage}
              totalItems={usersTotalCount}
              itemsPerPage={itemsPerPage}
            />
          </div>
          </>
        )}

        {tab === "models" && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddModel(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"><PlusIcon size={14} /> {t('admin.addModel')}</button>
            </div>
            {showAddModel && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newModel.name} onChange={e => setNewModel({...newModel, name: e.target.value})} placeholder="Model name (e.g. gpt-4o)" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <select value={newModel.provider} onChange={e => setNewModel({...newModel, provider: e.target.value})} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                  <select value={newModel.upstreamProvider} onChange={e => setNewModel({...newModel, upstreamProvider: e.target.value})} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm">
                    <option value="openai">Upstream: OpenAI</option>
                    <option value="anthropic">Upstream: Anthropic</option>
                    <option value="google">Upstream: Google</option>
                    <option value="openrouter">Upstream: OpenRouter</option>
                  </select>
                  <input value={newModel.upstreamModelId} onChange={e => setNewModel({...newModel, upstreamModelId: e.target.value})} placeholder="Upstream model ID (optional)" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <input value={newModel.inputPrice || ""} onChange={e => setNewModel({...newModel, inputPrice: parseFloat(e.target.value) || 0})} placeholder="Our input $/1M" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <input value={newModel.outputPrice || ""} onChange={e => setNewModel({...newModel, outputPrice: parseFloat(e.target.value) || 0})} placeholder="Our output $/1M" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <input value={newModel.upstreamInput || ""} onChange={e => setNewModel({...newModel, upstreamInput: parseFloat(e.target.value) || 0})} placeholder="Upstream input $/1M" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                  <input value={newModel.upstreamOutput || ""} onChange={e => setNewModel({...newModel, upstreamOutput: parseFloat(e.target.value) || 0})} placeholder="Upstream output $/1M" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addModel} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{t('admin.create')}</button>
                  <button onClick={() => setShowAddModel(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">{t('admin.cancel')}</button>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left px-6 py-4 font-medium">{t('admin.modelName')}</th>
                    <th className="text-left px-6 py-4 font-medium">{t('admin.provider')}</th>
                    <th className="text-left px-6 py-4 font-medium">{t('admin.upstream')}</th>
                    <th className="text-right px-6 py-4 font-medium">{t('admin.inputPrice')}</th>
                    <th className="text-right px-6 py-4 font-medium">{t('admin.outputPrice')}</th>
                    <th className="text-right px-6 py-4 font-medium">{t('admin.upstreamInput')}</th>
                    <th className="text-right px-6 py-4 font-medium">{t('admin.upstreamOutput')}</th>
                    <th className="text-center px-6 py-4 font-medium">{t('admin.redeemCodes.status')}</th>
                    <th className="text-center px-6 py-4 font-medium">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{m.name}</td>
                      <td className="px-6 py-4 text-gray-600">{m.provider}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className={`px-2 py-0.5 rounded text-xs ${m.upstreamProvider === 'openrouter' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {m.upstreamProvider || m.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-indigo-600">${m.inputPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-indigo-600">${m.outputPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-gray-700">${m.upstreamInput.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-gray-700">${m.upstreamOutput.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleModel(m.id, m.active)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.active ? "bg-green-400" : "bg-red-400"}`} />
                          {m.active ? t('admin.active') : t('admin.inactive')}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => deleteModel(m.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-400 transition-colors"><TrashIcon size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-700">{t('admin.noModels')}</td></tr>}
                </tbody>
              </table>
              <Pagination
                currentPage={modelsPage}
                totalPages={modelsTotalPages}
                onPageChange={setModelsPage}
                totalItems={modelsTotalCount}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </>
        )}

        {tab === "providers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">上游接口管理</h2>
              <button onClick={() => setShowAddProvider(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                <PlusIcon size={16} /> 添加接口
              </button>
            </div>

            {showAddProvider && (
              <AddProviderForm onSave={() => { setShowAddProvider(false); fetchData(); }} onCancel={() => setShowAddProvider(false)} />
            )}

            {providers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无上游接口，点击「添加接口」创建第一个
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {providers.map((p) => (
                    <ProviderCard key={p.id} provider={p} models={models} onRefresh={fetchData} />
                  ))}
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={providersPage}
                    totalPages={providersTotalPages}
                    onPageChange={setProvidersPage}
                    totalItems={providersTotalCount}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {tab === "pricing" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold mb-4">{t('admin.pricing')}</h2>
              <p className="text-sm text-gray-600 mb-6">{t('admin.margin')}</p>
              <div className="space-y-4">
                {models.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-gray-700">{m.provider}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-700 mb-1">{t('admin.inputPrice')}</div>
                        <div className="px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-sm text-indigo-600 font-mono">${m.inputPrice.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-700 mb-1">{t('admin.outputPrice')}</div>
                        <div className="px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-sm text-indigo-600 font-mono">${m.outputPrice.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-700 mb-1">{t('admin.margin')}</div>
                        <div className="px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 text-sm text-green-400 font-mono">
                          {(m.upstreamInput + m.upstreamOutput) > 0 ? ((1 - (m.upstreamInput + m.upstreamOutput) / (m.inputPrice + m.outputPrice)) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {models.length === 0 && <p className="text-sm text-gray-700">{t('admin.noModels')}</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "crypto" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold">虚拟货币充值管理</h2>
                  <p className="text-sm text-gray-600 mt-1">管理用户的虚拟货币充值记录</p>
                </div>
                {cryptoStats && (
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-600">总充值金额</div>
                      <div className="text-xl font-bold text-green-600">${cryptoStats.totalAmount?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">总笔数</div>
                      <div className="text-xl font-bold">{cryptoStats.totalCount || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">待确认</div>
                      <div className="text-xl font-bold text-orange-600">{cryptoStats.pendingCount || 0}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="text-left px-4 py-3 font-medium">用户</th>
                      <th className="text-left px-4 py-3 font-medium">网络</th>
                      <th className="text-left px-4 py-3 font-medium">代币</th>
                      <th className="text-right px-4 py-3 font-medium">数量</th>
                      <th className="text-right px-4 py-3 font-medium">金额(USD)</th>
                      <th className="text-center px-4 py-3 font-medium">状态</th>
                      <th className="text-center px-4 py-3 font-medium">确认数</th>
                      <th className="text-left px-4 py-3 font-medium">交易哈希</th>
                      <th className="text-left px-4 py-3 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cryptoDeposits.map((deposit: any) => (
                      <tr key={deposit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{deposit.user?.email || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{deposit.user?.name || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                            {deposit.chain.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{deposit.token}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {parseFloat(deposit.amount).toFixed(8)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          ${parseFloat(deposit.amountUsd).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            deposit.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            deposit.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {deposit.status === 'confirmed' ? '已确认' :
                             deposit.status === 'pending' ? '待确认' : '失败'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {deposit.confirmations}/12
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://etherscan.io/tx/${deposit.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                          >
                            {deposit.txHash.slice(0, 10)}...{deposit.txHash.slice(-8)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(deposit.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cryptoDeposits.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    暂无充值记录
                  </div>
                )}
                <Pagination
                  currentPage={cryptoPage}
                  totalPages={cryptoTotalPages}
                  onPageChange={setCryptoPage}
                  totalItems={cryptoTotalCount}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "router" && (
          <div className="space-y-6">
            <iframe
              src="/admin/router"
              className="w-full border-0 rounded-xl overflow-hidden"
              style={{ height: 'calc(100vh - 180px)' }}
              title="智能路由配置"
            />
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-700">© 2026 AgentOPC Team</div>
      </footer>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-100 border border-gray-200 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-100 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedUser.name || "User"}</h2>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-600 hover:text-gray-900"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-700 mb-1">{t('admin.balance')}</div>
                  <div className="text-2xl font-bold text-indigo-600">${selectedUser.balance.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-700 mb-1">{t('admin.role')}</div>
                  <div className="text-2xl font-bold">{selectedUser.role}</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-700 mb-1">{t('admin.keys')}</div>
                  <div className="text-2xl font-bold">{selectedUser._count.apiKeys}</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-700 mb-1">{t('admin.calls')}</div>
                  <div className="text-2xl font-bold">{selectedUser._count.usageLogs.toLocaleString()}</div>
                </div>
              </div>

              {/* Usage Summary */}
              {userUsage && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-600">{t('admin.usageSummary')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white border border-gray-200">
                      <div className="text-xs text-gray-700 mb-1">{t('admin.totalCost')}</div>
                      <div className="text-xl font-bold text-red-600">${userUsage.totalCost?.toFixed(2) || "0.00"}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-gray-200">
                      <div className="text-xs text-gray-700 mb-1">{t('admin.inputTokens')}</div>
                      <div className="text-xl font-bold">{userUsage.totalInputTokens?.toLocaleString() || "0"}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-gray-200">
                      <div className="text-xs text-gray-700 mb-1">{t('admin.outputTokens')}</div>
                      <div className="text-xl font-bold">{userUsage.totalOutputTokens?.toLocaleString() || "0"}</div>
                    </div>
                  </div>

                  {/* By Model */}
                  {userUsage.byModel && userUsage.byModel.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('admin.usageByModel')}</h4>
                      <div className="space-y-2">
                        {userUsage.byModel.map((m: any) => (
                          <div key={m.modelName} className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
                            <div>
                              <div className="text-sm font-medium">{m.modelName}</div>
                              <div className="text-xs text-gray-700">{m.requests} {t('admin.requests')}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-indigo-600">${m.cost.toFixed(2)}</div>
                              <div className="text-xs text-gray-700">{m.inputTokens.toLocaleString()} in / {m.outputTokens.toLocaleString()} out</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setTopupUserId(selectedUser.id); setSelectedUser(null); }} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                  {t('admin.topupUser')}
                </button>
                <button onClick={() => { resetBalance(selectedUser.id); setSelectedUser(null); }} className="flex-1 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-100 text-red-700 text-sm">
                  {t('admin.resetBalance')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AddProviderForm ── */
function AddProviderForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: "", slug: "", apiUrl: "", apiKey: "", priceMultiplier: 1.25, priority: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/providers", { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) onSave();
    else alert((await res.json()).error || "Failed");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
      <h3 className="font-semibold text-sm mb-2">添加上游接口</h3>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="显示名称（如：主线路）" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="标识符（如：main）" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })} placeholder="API URL（如：https://api.openai.com/v1）" className="col-span-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="API Key" type="password" className="col-span-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.priceMultiplier} onChange={e => setForm({ ...form, priceMultiplier: parseFloat(e.target.value) || 1 })} placeholder="倍率（如：1.25）" type="number" step="0.01" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} placeholder="优先级（数字越大越优先）" type="number" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
        <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="备注（可选）" className="col-span-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50">{saving ? "保存中..." : "创建"}</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm">取消</button>
      </div>
    </div>
  );
}

/* ── ProviderCard ── */
function ProviderCard({ provider: p, models, onRefresh }: { provider: ProviderData; models: ModelData[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [multiplier, setMultiplier] = useState(p.priceMultiplier);
  const [applyingAll, setApplyingAll] = useState(false);
  const linkedModels = models.filter(m => m.providerId === p.id);

  async function toggleActive() {
    await fetch("/api/admin/providers", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id: p.id, active: !p.active }) });
    onRefresh();
  }

  async function updateMultiplier() {
    await fetch("/api/admin/providers", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id: p.id, priceMultiplier: multiplier }) });
    setEditing(false);
    onRefresh();
  }

  async function applyMultiplierToModels() {
    setApplyingAll(true);
    await fetch("/api/admin/providers/apply-multiplier", { method: "POST", headers: authHeaders(), body: JSON.stringify({ providerId: p.id, multiplier }) });
    setApplyingAll(false);
    onRefresh();
  }

  async function deleteProvider() {
    if (!confirm(`确定删除接口「${p.name}」？`)) return;
    const res = await fetch(`/api/admin/providers?id=${p.id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) onRefresh();
    else alert((await res.json()).error || "Failed");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-lg">{p.name}</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono">{p.slug}</span>
          <button onClick={toggleActive} className={`px-2 py-0.5 rounded text-xs ${p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {p.active ? "● 启用" : "● 停用"}
          </button>
        </div>
        <button onClick={deleteProvider} className="text-gray-400 hover:text-red-500 transition-colors">
          <TrashIcon size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">API URL</span>
          <p className="font-mono text-xs mt-1 truncate">{p.apiUrl}</p>
        </div>
        <div>
          <span className="text-gray-500">API Key</span>
          <p className="font-mono text-xs mt-1">{"•".repeat(8)}...{p.apiKey.slice(-4)}</p>
        </div>
        <div>
          <span className="text-gray-500">优先级</span>
          <p className="mt-1">{p.priority}</p>
        </div>
      </div>

      {/* 倍率管理 */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
        <span className="text-sm text-gray-600">倍率：</span>
        {editing ? (
          <>
            <input value={multiplier} onChange={e => setMultiplier(parseFloat(e.target.value) || 1)} type="number" step="0.01" min="0.1" className="w-20 px-2 py-1 rounded border border-gray-200 text-sm text-center" />
            <button onClick={updateMultiplier} className="px-3 py-1 rounded bg-indigo-600 text-white text-xs">保存</button>
            <button onClick={() => { setMultiplier(p.priceMultiplier); setEditing(false); }} className="px-3 py-1 rounded border border-gray-200 text-gray-600 text-xs">取消</button>
          </>
        ) : (
          <>
            <span className="text-lg font-bold text-indigo-600">{p.priceMultiplier}x</span>
            <button onClick={() => setEditing(true)} className="px-3 py-1 rounded border border-gray-200 text-gray-600 text-xs hover:bg-gray-100">修改</button>
          </>
        )}
        <button onClick={applyMultiplierToModels} disabled={applyingAll} className="ml-auto px-3 py-1 rounded bg-orange-500 hover:bg-orange-400 text-white text-xs disabled:opacity-50">
          {applyingAll ? "应用中..." : `应用倍率到全部模型 (${linkedModels.length})`}
        </button>
      </div>

      {/* 关联模型 */}
      {linkedModels.length > 0 && (
        <div className="mt-3">
          <span className="text-xs text-gray-500">关联模型：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {linkedModels.map(m => (
              <span key={m.id} className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">{m.name}</span>
            ))}
          </div>
        </div>
      )}

      {p.notes && <p className="mt-3 text-xs text-gray-400">{p.notes}</p>}
    </div>
  );
}
