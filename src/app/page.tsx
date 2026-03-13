'use client'

import { useState, useEffect } from "react";
import { OpenClawLogo, ArrowRightIcon, KeyIcon, ChartIcon, ShieldIcon, ZapIcon, GiftIcon, ClockIcon, DollarIcon } from "@/components/icons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import AuthDrawer from "@/components/AuthDrawer";
import LoadBalancerAnimation from "@/components/LoadBalancerAnimation";
import FailoverAnimation from "@/components/FailoverAnimation";

type AuthMode = "login" | "register";

export default function Home() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setDrawerOpen(true);
  }

  // Auto-open auth drawer from URL param (e.g. /?auth=login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth === "login" || auth === "register") {
      openAuth(auth);
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const features = [
    { icon: ZapIcon, titleKey: "home.feature1.title", descKey: "home.feature1.desc" },
    { icon: ClockIcon, titleKey: "home.feature2.title", descKey: "home.feature2.desc" },
    { icon: DollarIcon, titleKey: "home.feature3.title", descKey: "home.feature3.desc" },
    { icon: ShieldIcon, titleKey: "home.feature4.title", descKey: "home.feature4.desc" },
  ];

  const models = [
    { name: "GPT-5.4", provider: "OpenAI", input: "2.75", output: "16.50" },
    { name: "Claude Opus 4.6", provider: "Anthropic", input: "5.50", output: "27.50" },
    { name: "Claude Sonnet 4.5", provider: "Anthropic", input: "3.30", output: "16.50" },
    { name: "Gemini 3.1 Pro", provider: "Google", input: "2.20", output: "13.20" },
    { name: "DeepSeek V3.2", provider: "DeepSeek", input: "0.28", output: "0.44" },
    { name: "Qwen3.5 Flash", provider: "Qwen", input: "0.11", output: "0.44" },
    { name: "GPT-5 Mini", provider: "OpenAI", input: "0.28", output: "2.20" },
    { name: "Gemini 2.5 Flash", provider: "Google", input: "0.33", output: "2.75" },
  ];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 sm:gap-3">
            <OpenClawLogo size={28} />
            <span className="text-base sm:text-lg font-semibold tracking-tight">OpenClaw Relay</span>
          </a>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.pricing')}</a>
            <a href="/learn" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.learn')}</a>
            <a href="/docs" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t('nav.docs')}</a>
            <LanguageSwitcher />
            <button onClick={() => openAuth("register")} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              {t('nav.getStarted')}
            </button>
          </div>
          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-3 text-sm">
            <LanguageSwitcher />
            <button onClick={() => openAuth("register")} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
              {t('nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* OpenClaw Logo */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/openclaw-logo.jpg" 
              alt="OpenClaw Logo" 
              className="h-16 sm:h-24 w-auto object-contain"
            />
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
            {t('home.title1')}
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {t('home.title2')}
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-4 sm:mb-6 leading-relaxed">
            {t('home.subtitle')}
          </p>

          {/* Failover Animation */}
          <FailoverAnimation />
          
          {/* 充值说明 */}
          <div className="max-w-2xl mx-auto mb-8 space-y-3">
            {/* 充值码充值 */}
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <div className="flex items-center gap-2 mb-2">
                <GiftIcon size={18} className="text-indigo-600" />
                <span className="text-indigo-600 font-semibold">{t('home.recharge.title')}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    {t('home.recharge.desc')} <a href="https://m.tb.cn/h.iV2cwJ0?tk=MFDaUDcLKTv" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">{t('home.recharge.xianyu')}</a> {t('home.recharge.search')} 
                    <span className="mx-1 px-2 py-0.5 rounded bg-gray-200 font-mono text-xs">OpenClaw Relay</span>
                    {t('home.recharge.buy')}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium">👆 使用闲鱼 APP 扫描右侧二维码进入店铺</p>
                </div>
                <div className="flex-shrink-0">
                  <a href="https://m.tb.cn/h.iV2cwJ0?tk=MFDaUDcLKTv" target="_blank" rel="noopener noreferrer">
                    <img 
                      src="/xianyu-qr.jpg" 
                      alt="闲鱼店铺二维码" 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border-2 border-indigo-300 hover:border-indigo-500 transition-colors"
                    />
                  </a>
                </div>
              </div>
            </div>

            {/* 虚拟货币充值 */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-600 font-semibold">虚拟货币充值</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                支持 <span className="font-semibold text-emerald-600">USDT</span>、<span className="font-semibold text-blue-600">ETH</span>、<span className="font-semibold text-yellow-600">BNB</span>、<span className="font-semibold text-red-600">TRX</span>、<span className="font-semibold text-purple-600">SOL</span> 等主流加密货币充值
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Ethereum</span>
                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-medium">BSC</span>
                <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-medium">TRON</span>
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 font-medium">Polygon</span>
                <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium">Solana</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                💡 注册后在用户中心获取专属充值地址，自动到账
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <button onClick={() => openAuth("register")} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              {t('home.cta.register')}
              <ArrowRightIcon size={16} />
            </button>
            <a href="/docs" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text-secondary)] font-medium transition-colors">
              {t('home.cta.docs')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 border-t border-[var(--border-light)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">{t('home.features.title')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors text-indigo-600">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold mb-2">{t(f.titleKey as any)}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t(f.descKey as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Load Balancing Animation */}
      <LoadBalancerAnimation />

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 border-t border-[var(--border-light)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">{t('home.pricing.title')}</h2>
          <p className="text-[var(--text-secondary)] text-center mb-12">{t('home.pricing.subtitle')}</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs sm:text-sm min-w-[360px]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <th className="text-left px-6 py-4 font-medium">{t('home.pricing.model')}</th>
                  <th className="text-left px-6 py-4 font-medium">{t('home.pricing.provider')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('home.pricing.input')}</th>
                  <th className="text-right px-6 py-4 font-medium">{t('home.pricing.output')}</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={i} className="border-t border-[var(--border-light)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4 font-medium">{m.name}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{m.provider}</td>
                    <td className="px-6 py-4 text-right text-indigo-600">${m.input}</td>
                    <td className="px-6 py-4 text-right text-indigo-600">${m.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-4 text-center">
            {t('home.pricing.note')} <a href="/docs" className="text-indigo-600 hover:text-indigo-500 underline">{t('home.pricing.more')}</a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 border-t border-[var(--border-light)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-[var(--text-secondary)] mb-8">{t('home.cta.subtitle')}</p>
          
          {/* 充值码购买 */}
          <div className="max-w-md mx-auto mb-8">
            <div className="p-8 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/5">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <GiftIcon size={32} className="text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('home.cta.recharge.title')}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {t('home.cta.recharge.desc')} <span className="px-2 py-0.5 rounded bg-gray-200 font-mono text-xs">OpenClaw Relay</span> {t('home.cta.recharge.desc2')}
              </p>
              <a 
                href="https://m.tb.cn/h.iV2cwJ0?tk=MFDaUDcLKTv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors mb-3"
              >
                {t('home.cta.recharge.button')}
              </a>
              <div className="text-xs text-[var(--text-muted)]">
                {t('home.cta.recharge.contact')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-[var(--text-secondary)] mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
              {t('home.cta.step1')}
            </div>
            <ArrowRightIcon size={16} />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
              {t('home.cta.step2')}
            </div>
            <ArrowRightIcon size={16} />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
              {t('home.cta.step3')}
            </div>
            <ArrowRightIcon size={16} />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 flex items-center justify-center text-xs font-bold">4</span>
              {t('home.cta.step4')}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <button onClick={() => openAuth("register")} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25">
              {t('home.cta.register')}
              <ArrowRightIcon size={16} />
            </button>
            <a href="/docs" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text-secondary)] font-medium transition-colors">
              {t('home.cta.docs')}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-light)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <OpenClawLogo size={20} />
            <span>OpenClaw Relay</span>
          </div>
          <span>{t('footer.copyright')}</span>
        </div>
      </footer>

      <AuthDrawer open={drawerOpen} mode={authMode} onClose={() => setDrawerOpen(false)} onModeChange={setAuthMode} />
    </div>
  );
}
