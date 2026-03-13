"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const PROVIDERS = [
  { name: "OpenAI", color: "#10b981", models: "GPT-5.4 / o3 / o4" },
  { name: "Anthropic", color: "#8b5cf6", models: "Claude 4.5 / 4.6" },
  { name: "Google", color: "#3b82f6", models: "Gemini 3.1 / 2.5" },
  { name: "DeepSeek", color: "#06b6d4", models: "V3.2 / R1" },
  { name: "Qwen", color: "#f59e0b", models: "3.5 / Coder" },
  { name: "Meta", color: "#ef4444", models: "Llama 4" },
];

export default function LoadBalancerAnimation() {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [particles, setParticles] = useState<{ id: number; target: number; progress: number }[]>([]);
  const idRef = { current: 0 };

  // Rotate active provider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PROVIDERS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Spawn particles
  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const id = Date.now() + counter;
      setParticles((p) => [...p, { id, target: Math.floor(Math.random() * PROVIDERS.length), progress: 0 }]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Animate particles
  useEffect(() => {
    const frame = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, progress: p.progress + 0.04 }))
          .filter((p) => p.progress <= 1.2)
      );
    }, 30);
    return () => clearInterval(frame);
  }, []);

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 border-t border-[var(--border-light)] overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="hidden md:flex relative items-center justify-center" style={{ minHeight: 280 }}>
          
          {/* Left: User Request */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-36 text-center z-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-sm font-semibold">API Request</div>
            <div className="text-xs text-[var(--text-muted)]">sk-relay-***</div>
          </div>

          {/* Center: Relay Hub */}
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 animate-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Relay</div>
              <div className="text-xs text-[var(--text-muted)]">{t('home.loadBalancer')}</div>
            </div>
          </div>

          {/* Right: Provider nodes */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-3 w-44">
            {PROVIDERS.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-500 ${
                  activeIdx === i
                    ? "border-indigo-400 bg-indigo-50 shadow-sm scale-105"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    activeIdx === i ? "animate-ping-slow" : ""
                  }`}
                  style={{ backgroundColor: p.color }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{p.models}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SVG lines and particles */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet">
            {/* Left line: User -> Relay */}
            <line x1="140" y1="140" x2="350" y2="140" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6,4" />
            
            {/* Right lines: Relay -> each provider */}
            {PROVIDERS.map((p, i) => {
              const y = 28 + i * 44;
              return (
                <line
                  key={p.name}
                  x1="450"
                  y1="140"
                  x2="630"
                  y2={y}
                  stroke={activeIdx === i ? p.color : "#e2e8f0"}
                  strokeWidth={activeIdx === i ? 2 : 1.5}
                  strokeDasharray={activeIdx === i ? "none" : "6,4"}
                  className="transition-all duration-500"
                />
              );
            })}

            {/* Animated particles */}
            {particles.map((p) => {
              const targetY = 28 + p.target * 44;
              let cx: number, cy: number;
              if (p.progress <= 0.4) {
                // Phase 1: User -> Relay
                const t = p.progress / 0.4;
                cx = 140 + (350 - 140) * t;
                cy = 140;
              } else {
                // Phase 2: Relay -> Provider
                const t = Math.min((p.progress - 0.4) / 0.5, 1);
                cx = 450 + (630 - 450) * t;
                cy = 140 + (targetY - 140) * t;
              }
              return (
                <circle
                  key={p.id}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill={PROVIDERS[p.target].color}
                  opacity={p.progress > 1 ? Math.max(0, 1 - (p.progress - 1) * 5) : 0.9}
                >
                  <animate attributeName="r" values="3;5;3" dur="0.6s" repeatCount="indefinite" />
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Mobile: simplified vertical layout */}
        <div className="md:hidden">
          <div className="text-center mb-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">Relay</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-500 ${
                  activeIdx === i
                    ? "border-indigo-400 bg-indigo-50 shadow-sm"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <div>
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{p.models}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
