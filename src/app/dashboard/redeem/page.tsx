"use client";

import { useState, useEffect } from "react";
import {
  OpenClawLogo, DollarIcon, CheckIcon, XIcon, ClockIcon,
  LogOutIcon, KeyIcon,
} from "@/components/icons";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" }; }

interface UserInfo { id: string; email: string; name: string | null; balance: number; role: string }
interface RedeemHistory { id: string; code: string; amount: number; redeemedAt: string }

export default function RedeemPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; amount?: number; message?: string } | null>(null);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<RedeemHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const token = getToken();
    if (!token) { window.location.href = "/login"; return; }
    try {
      const [userRes, historyRes] = await Promise.all([
        fetch("/api/auth/me", { headers: authHeaders() }),
        fetch("/api/redeem-codes/history", { headers: authHeaders() }),
      ]);
      if (!userRes.ok) { window.location.href = "/login"; return; }
      setUser(await userRes.json());
      const historyData = await historyRes.json();
      setHistory(historyData.history || []);
    } catch { window.location.href = "/login"; }
    setLoading(false);
  }

  async function handleVerify() {
    if (!code.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/redeem-codes/verify", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ valid: false, message: "Network error" });
    }
    setVerifying(false);
  }

  async function handleRedeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/redeem-codes/redeem", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      setRedeemResult(data);
      if (data.success) {
        setCode("");
        setVerifyResult(null);
        fetchData();
      }
    } catch {
      setRedeemResult({ success: false, message: "Network error" });
    }
    setRedeeming(false);
  }

  function logout() { localStorage.removeItem("token"); window.location.href = "/login"; }

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
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">Redeem</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><KeyIcon size={18} /></a>
            <span className="text-[var(--text-secondary)]">{user?.email}</span>
            <button onClick={logout} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><LogOutIcon size={18} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Balance Card */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <DollarIcon size={20} />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">Current Balance</span>
          </div>
          <div className="text-3xl font-bold">${(user?.balance ?? 0).toFixed(2)}</div>
        </div>

        {/* Redeem Form */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Redeem Code</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Enter your redeem code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="OCR-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Verify Result */}
            {verifyResult && (
              <div className={`p-4 rounded-lg border ${verifyResult.valid ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <div className="flex items-center gap-2">
                  {verifyResult.valid ? (
                    <>
                      <div className="text-green-500"><CheckIcon size={18} /></div>
                      <span className="text-sm text-green-500">Valid code: ${verifyResult.amount?.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <div className="text-red-500"><XIcon size={18} /></div>
                      <span className="text-sm text-red-500">{verifyResult.message || "Invalid code"}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Redeem Result */}
            {redeemResult && (
              <div className={`p-4 rounded-lg border ${redeemResult.success ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <div className="flex items-center gap-2">
                  {redeemResult.success ? (
                    <>
                      <div className="text-green-500"><CheckIcon size={18} /></div>
                      <span className="text-sm text-green-500">{redeemResult.message}</span>
                    </>
                  ) : (
                    <>
                      <div className="text-red-500"><XIcon size={18} /></div>
                      <span className="text-sm text-red-500">{redeemResult.message}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={!code.trim() || verifying}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
              <button
                onClick={handleRedeem}
                disabled={!code.trim() || redeeming || (verifyResult !== null && !verifyResult.valid)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {redeeming ? "Redeeming..." : "Redeem"}
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Redeem History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No redeem history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div>
                    <div className="text-sm font-medium font-mono">{item.code}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                      <ClockIcon size={12} />
                      {new Date(item.redeemedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-500">+${item.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
