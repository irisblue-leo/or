"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Model {
  id: string;
  name: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  upstreamInput: number;
  upstreamOutput: number;
  active: boolean;
}

interface UpstreamModel {
  id: string;
  name?: string;
  pricing?: {
    prompt?: number;
    completion?: number;
  };
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export default function PricingPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [multiplier, setMultiplier] = useState(1.2);
  const [selectedProvider, setSelectedProvider] = useState<"default" | "openrouter">("default");
  const [upstreamModels, setUpstreamModels] = useState<UpstreamModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch("/api/admin/models", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      setModels(data.models || data);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
    setLoading(false);
  }

  async function fetchUpstreamModels() {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/models/fetch-upstream?provider=${selectedProvider}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch upstream models");
      const data = await res.json();
      setUpstreamModels(data.models || []);
    } catch (error) {
      console.error("Failed to fetch upstream models:", error);
      alert(t('pricing.fetchFailed'));
    }
    setFetching(false);
  }

  async function applyMultiplier() {
    if (multiplier <= 1) {
      alert(t('pricing.mustBeGreaterThan1'));
      return;
    }

    try {
      const res = await fetch("/api/admin/providers/apply-multiplier", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ multiplier }),
      });

      if (!res.ok) throw new Error("Failed to apply multiplier");

      alert(t('pricing.appliedSuccess').replace('{multiplier}', multiplier.toString()));
      fetchModels();
    } catch (error) {
      console.error("Failed to apply multiplier:", error);
      alert(t('pricing.applyFailed'));
    }
  }

  async function importModel(upstreamModel: UpstreamModel) {
    const inputPrice = upstreamModel.pricing?.prompt || 0;
    const outputPrice = upstreamModel.pricing?.completion || 0;

    const newModel = {
      name: upstreamModel.id,
      provider: selectedProvider === "openrouter" ? "openrouter" : "openai",
      inputPrice: inputPrice * multiplier,
      outputPrice: outputPrice * multiplier,
      upstreamInput: inputPrice,
      upstreamOutput: outputPrice,
      active: true,
    };

    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newModel),
      });

      if (!res.ok) throw new Error("Failed to import model");

      alert(t('pricing.importedSuccess').replace('{model}', upstreamModel.id));
      fetchModels();
    } catch (error) {
      console.error("Failed to import model:", error);
      alert(t('pricing.importFailed'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('pricing.title')}</h1>

        {/* 利润率设置 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('pricing.profitMargin')}</h2>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              step="0.1"
              min="1"
              className="px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] w-32"
            />
            <span className="text-sm text-[var(--text-secondary)]">{t('pricing.multiplier')}</span>
            <button
              onClick={applyMultiplier}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              {t('pricing.applyToAll')}
            </button>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-3">
            {t('pricing.profitMarginNote')}
          </p>
        </div>

        {/* 从上游导入模型 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('pricing.importFromUpstream')}</h2>

          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as "default" | "openrouter")}
              className="px-4 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)]"
            >
              <option value="default">{t('pricing.selectProvider')}</option>
              <option value="openrouter">{t('pricing.openrouter')}</option>
            </select>

            <button
              onClick={fetchUpstreamModels}
              disabled={fetching}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
            >
              {fetching ? t('pricing.fetching') : t('pricing.fetchModels')}
            </button>
          </div>

          {upstreamModels.length > 0 && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[var(--border)]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.modelName')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.inputPrice')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.outputPrice')}</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upstreamModels.map((model) => (
                      <tr key={model.id} className="border-b border-[var(--border)]">
                        <td className="py-3 px-4 text-sm font-mono">{model.id}</td>
                        <td className="py-3 px-4 text-sm">${(model.pricing?.prompt || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">${(model.pricing?.completion || 0).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => importModel(model)}
                            className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
                          >
                            {t('pricing.import')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 现有模型列表 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-semibold mb-4">{t('pricing.existingModels')} ({models.length})</h2>

          {models.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">{t('pricing.noModels')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.modelName')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('admin.provider')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.userInputPrice')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.userOutputPrice')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.upstreamInputPrice')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.upstreamOutputPrice')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('pricing.profitMarginRatio')}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">{t('admin.crypto.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => {
                    const profitMargin = model.upstreamInput > 0
                      ? (model.inputPrice / model.upstreamInput).toFixed(2)
                      : "N/A";

                    return (
                      <tr key={model.id} className="border-b border-[var(--border)]">
                        <td className="py-3 px-4 text-sm font-mono">{model.name}</td>
                        <td className="py-3 px-4 text-sm">{model.provider}</td>
                        <td className="py-3 px-4 text-sm">${model.inputPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">${model.outputPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)]">${model.upstreamInput.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)]">${model.upstreamOutput.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-green-600">{profitMargin}x</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            model.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {model.active ? t('admin.active') : t('admin.inactive')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
