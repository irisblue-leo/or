"use client";

import { useState, useEffect } from "react";
import {
  OpenClawLogo, TicketIcon, PlusIcon, DownloadIcon, FilterIcon,
  HomeIcon, LogOutIcon, ChartIcon,
} from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }; }

interface RedeemCode {
  id: string;
  code: string;
  amount: number;
  status: "active" | "used" | "expired";
  createdBy: { email: string };
  usedBy?: { email: string };
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminRedeemCodesPage() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  
  // Generate form
  const [amount, setAmount] = useState("10");
  const [count, setCount] = useState("1");
  const [expiresIn, setExpiresIn] = useState("30");
  
  // Filter
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "used" | "expired">("all");
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    const token = getToken();
    if (!token) { window.location.href = "/login"; return; }
    try {
      const res = await fetch("/api/admin/redeem-codes", { headers: authHeaders() });
      if (!res.ok) { window.location.href = "/login"; return; }
      const data = await res.json();
      setCodes(data.codes || []);
    } catch { window.location.href = "/login"; }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/redeem-codes/generate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          amount: parseFloat(amount),
          count: parseInt(count),
          expiresInDays: parseInt(expiresIn),
        }),
      });
      if (res.ok) {
        setShowGenerate(false);
        setAmount("10");
        setCount("1");
        setExpiresIn("30");
        fetchCodes();
      }
    } catch {}
    setGenerating(false);
  }

  function exportCSV() {
    const filtered = getFilteredCodes();
    const csv = [
      ["Code", "Amount", "Status", "Created By", "Used By", "Used At", "Expires At", "Created At"].join(","),
      ...filtered.map((c) =>
        [
          c.code,
          c.amount,
          c.status,
          c.createdBy.email,
          c.usedBy?.email || "",
          c.usedAt ? new Date(c.usedAt).toISOString() : "",
          c.expiresAt ? new Date(c.expiresAt).toISOString() : "",
          new Date(c.createdAt).toISOString(),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redeem-codes-${Date.now()}.csv`;
    a.click();
  }

  function getFilteredCodes() {
    return codes.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchEmail && !c.createdBy.email.includes(searchEmail) && !(c.usedBy?.email || "").includes(searchEmail)) return false;
      return true;
    });
  }

  function logout() { localStorage.removeItem("token"); window.location.href = "/login"; }

  const filtered = getFilteredCodes();
  const stats = {
    total: codes.length,
    active: codes.filter((c) => c.status === "active").length,
    used: codes.filter((c) => c.status === "used").length,
    expired: codes.filter((c) => c.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">{t('admin.redeemCodes.title')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors"><HomeIcon size={18} /></a>
            <a href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors"><ChartIcon size={18} /></a>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900 transition-colors"><LogOutIcon size={18} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 mb-1">{t('admin.redeemCodes.allStatus')}</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 mb-1">{t('admin.redeemCodes.active')}</div>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </div>
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 mb-1">{t('admin.redeemCodes.used')}</div>
            <div className="text-2xl font-bold text-blue-500">{stats.used}</div>
          </div>
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 mb-1">{t('admin.redeemCodes.expired')}</div>
            <div className="text-2xl font-bold text-red-500">{stats.expired}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t('admin.redeemCodes.allStatus')}</option>
              <option value="active">{t('admin.redeemCodes.active')}</option>
              <option value="used">{t('admin.redeemCodes.used')}</option>
              <option value="expired">{t('admin.redeemCodes.expired')}</option>
            </select>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder={t('admin.redeemCodes.searchEmail')}
              className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-700 text-sm transition-colors"
            >
              <DownloadIcon size={16} /> {t('admin.redeemCodes.export')}
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
            >
              <PlusIcon size={16} /> {t('admin.redeemCodes.generate')}
            </button>
          </div>
        </div>

        {/* Generate Modal */}
        {showGenerate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{t('admin.redeemCodes.generate')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('admin.redeemCodes.amountLabel')}</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('admin.redeemCodes.countLabel')}</label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('admin.redeemCodes.expiresInDays')}</label>
                  <input
                    type="number"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                  >
                    {generating ? t('admin.generating') : t('admin.generate')}
                  </button>
                  <button
                    onClick={() => setShowGenerate(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Codes List */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.code')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.createdBy')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.usedBy')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.expiresAt')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('admin.redeemCodes.createdAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      {t('admin.redeemCodes.noCodes')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((code) => (
                    <tr key={code.id} className="hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono">{code.code}</td>
                      <td className="px-4 py-3 text-sm">${code.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            code.status === "active"
                              ? "bg-green-500/10 text-green-500"
                              : code.status === "used"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {code.status === 'active' ? t('admin.redeemCodes.active') : code.status === 'used' ? t('admin.redeemCodes.used') : t('admin.redeemCodes.expired')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{code.createdBy.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{code.usedBy?.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : t('admin.redeemCodes.never')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
