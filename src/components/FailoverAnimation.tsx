"use client";

import { useState, useEffect, useRef } from "react";

const ROUTES = [
  { name: "Route A", color: "#6366f1" },
  { name: "Route B", color: "#8b5cf6" },
  { name: "Route C", color: "#06b6d4" },
];

type RouteState = "active" | "down" | "idle";

export default function FailoverAnimation() {
  const [states, setStates] = useState<RouteState[]>(["active", "active", "active"]);
  const [downIdx, setDownIdx] = useState<number | null>(null);
  const [alertText, setAlertText] = useState("");
  const [alertType, setAlertType] = useState<"danger" | "warn" | "none">("none");
  const [particles, setParticles] = useState<{ id: number; route: number; progress: number }[]>([]);
  const counterRef = useRef(0);

  // Animation cycle: multiplex → one fails → redistribute → recover
  useEffect(() => {
    const cycle = () => {
      // Phase 0: All 3 routes active (multiplex)
      setStates(["active", "active", "active"]);
      setDownIdx(null);
      setAlertText("");
      setAlertType("none");

      // Phase 1: Route A fails at 3s
      setTimeout(() => {
        setStates(["down", "active", "active"]);
        setDownIdx(0);
        setAlertText("Route A failure detected — rerouting...");
        setAlertType("danger");
      }, 3000);

      // Phase 2: Traffic redistributed to B+C at 4s
      setTimeout(() => {
        setAlertText("Traffic rerouted to Route B + C");
        setAlertType("warn");
      }, 4200);

      // Phase 3: Alert fades at 5.5s
      setTimeout(() => {
        setAlertType("none");
        setAlertText("");
      }, 6000);

      // Phase 4: Route A recovers at 7s
      setTimeout(() => {
        setStates(["active", "active", "active"]);
        setDownIdx(null);
      }, 7500);
    };

    cycle();
    const interval = setInterval(cycle, 9500);
    return () => clearInterval(interval);
  }, []);

  // Spawn particles across active routes
  useEffect(() => {
    const interval = setInterval(() => {
      const activeRoutes = states
        .map((s, i) => (s === "active" ? i : -1))
        .filter((i) => i >= 0);
      if (activeRoutes.length === 0) return;

      // Spawn on a random active route
      counterRef.current++;
      const route = activeRoutes[counterRef.current % activeRoutes.length];
      setParticles((p) => [
        ...p,
        { id: Date.now() + counterRef.current, route, progress: 0 },
      ]);
    }, 300);
    return () => clearInterval(interval);
  }, [states]);

  // Animate particles
  useEffect(() => {
    const frame = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, progress: p.progress + 0.04 }))
          .filter((p) => p.progress <= 1.15)
      );
    }, 25);
    return () => clearInterval(frame);
  }, []);

  // Route Y positions
  const routeY = [38, 75, 112];

  return (
    <div className="relative w-full max-w-xl mx-auto my-4 sm:my-6 px-2" style={{ height: 140 }}>
      {/* Alert banner */}
      <div
        className={`absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium z-20 transition-all duration-400 whitespace-nowrap ${
          alertType !== "none"
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        } ${alertType === "danger" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
      >
        {/* SVG icon instead of emoji */}
        {alertType === "danger" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
        {alertType === "warn" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
        )}
        {alertText}
      </div>

      <svg viewBox="0 0 500 150" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Defs for glow */}
        <defs>
          {ROUTES.map((r, i) => (
            <filter key={`glow-${i}`} id={`glow-${i}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Left node: Request */}
        <g>
          <rect x="10" y="52" width="60" height="46" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          <svg x="28" y="57" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <text x="40" y="92" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="600">Request</text>
        </g>

        {/* Right node: Model */}
        <g>
          <rect x="430" y="52" width="60" height="46" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
          <svg x="448" y="57" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <text x="460" y="92" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="600">Model</text>
        </g>

        {/* Center: Relay node */}
        <g>
          <circle cx="250" cy="75" r="18" fill="white" stroke="#6366f1" strokeWidth="2" />
          <svg x="240" y="65" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </g>

        {/* Three route paths */}
        {ROUTES.map((r, i) => {
          const y = routeY[i];
          const state = states[i];
          const isActive = state === "active";
          const isDown = state === "down";

          return (
            <g key={r.name}>
              {/* Left segment: Request → Relay */}
              <path
                d={`M 70 75 Q 130 ${y}, 232 ${y === 75 ? 75 : y}`}
                fill="none"
                stroke={isDown ? "#fca5a5" : isActive ? r.color : "#e2e8f0"}
                strokeWidth={isActive ? 2 : 1.5}
                strokeDasharray={isActive ? "none" : "5,4"}
                opacity={isActive ? 1 : isDown ? 0.5 : 0.4}
                className="transition-all duration-500"
              />
              
              {/* Right segment: Relay → Model */}
              <path
                d={`M 268 ${y === 75 ? 75 : y} Q 370 ${y}, 430 75`}
                fill="none"
                stroke={isDown ? "#fca5a5" : isActive ? r.color : "#e2e8f0"}
                strokeWidth={isActive ? 2 : 1.5}
                strokeDasharray={isActive ? "none" : "5,4"}
                opacity={isActive ? 1 : isDown ? 0.5 : 0.4}
                className="transition-all duration-500"
              />

              {/* Route label pill */}
              <rect
                x="157"
                y={y - 8}
                width="44"
                height="16"
                rx="8"
                fill={isDown ? "#fef2f2" : isActive ? "white" : "#fafafa"}
                stroke={isDown ? "#fca5a5" : isActive ? r.color : "#e2e8f0"}
                strokeWidth="1"
                className="transition-all duration-500"
              />
              <text
                x="179"
                y={y + 4}
                textAnchor="middle"
                fill={isDown ? "#ef4444" : isActive ? r.color : "#94a3b8"}
                fontSize="7"
                fontWeight="600"
                className="transition-all duration-500"
              >
                {r.name}
              </text>

              {/* Right side label pill */}
              <rect
                x="299"
                y={y - 8}
                width="44"
                height="16"
                rx="8"
                fill={isDown ? "#fef2f2" : isActive ? "white" : "#fafafa"}
                stroke={isDown ? "#fca5a5" : isActive ? r.color : "#e2e8f0"}
                strokeWidth="1"
                className="transition-all duration-500"
              />
              <text
                x="321"
                y={y + 4}
                textAnchor="middle"
                fill={isDown ? "#ef4444" : isActive ? r.color : "#94a3b8"}
                fontSize="7"
                fontWeight="600"
                className="transition-all duration-500"
              >
                {r.name}
              </text>

              {/* Status indicator on left label */}
              <circle
                cx="162"
                cy={y}
                r="2.5"
                fill={isDown ? "#ef4444" : isActive ? "#22c55e" : "#d1d5db"}
                className="transition-all duration-500"
              >
                {isActive && (
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                )}
              </circle>

              {/* X mark for down route */}
              {isDown && (
                <g>
                  <line x1="175" y1={y - 3} x2="183" y2={y + 3} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                  <line x1="183" y1={y - 3} x2="175" y2={y + 3} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                </g>
              )}
            </g>
          );
        })}

        {/* Animated particles */}
        {particles.map((p) => {
          const y = routeY[p.route];
          const t = p.progress;
          let px: number, py: number;

          if (t <= 0.45) {
            // Left segment: Request(70,75) → through route arc → Relay entry
            const s = t / 0.45;
            const a = 1 - s;
            // Quadratic bezier: (70,75) → (130,y) → (232, y==75?75:y)
            const endY = y === 75 ? 75 : y;
            px = a * a * 70 + 2 * a * s * 130 + s * s * 232;
            py = a * a * 75 + 2 * a * s * y + s * s * endY;
          } else {
            // Right segment: Relay exit → through route arc → Model(430,75)
            const s = Math.min((t - 0.45) / 0.45, 1);
            const a = 1 - s;
            const startY = y === 75 ? 75 : y;
            px = a * a * 268 + 2 * a * s * 370 + s * s * 430;
            py = a * a * startY + 2 * a * s * y + s * s * 75;
          }

          return (
            <circle
              key={p.id}
              cx={px}
              cy={py}
              r="3"
              fill={ROUTES[p.route].color}
              opacity={t > 1 ? Math.max(0, 1 - (t - 1) * 8) : 0.85}
              filter={`url(#glow-${p.route})`}
            />
          );
        })}

        {/* Multiplex indicator text */}
        <text x="250" y="145" textAnchor="middle" fill="#64748b" fontSize="8">
          Multi-route multiplexing with auto-failover
        </text>
      </svg>
    </div>
  );
}
