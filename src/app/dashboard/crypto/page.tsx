'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { OpenClawLogo, DollarIcon, HomeIcon, KeyIcon, LogOutIcon, ClockIcon } from '@/components/icons'

type Chain = 'ethereum' | 'bsc' | 'tron' | 'polygon' | 'solana'

interface WalletAddress {
  chain: string
  address: string
  qrCode: string
}

interface UserInfo {
  id: string
  email: string
  name: string | null
  balance: number
  role: string
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  }
}

export default function CryptoDepositPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [walletAddress, setWalletAddress] = useState<WalletAddress | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const chains = [
    { id: 'ethereum' as Chain, name: 'Ethereum', tokens: 'ETH, USDT' },
    { id: 'bsc' as Chain, name: 'BSC', tokens: 'BNB, BUSD' },
    { id: 'tron' as Chain, name: 'TRON', tokens: 'TRX, USDT' },
    { id: 'polygon' as Chain, name: 'Polygon', tokens: 'MATIC, USDC' },
    { id: 'solana' as Chain, name: 'Solana', tokens: 'SOL, USDC' },
  ]

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    const token = getToken()
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      const res = await fetch('/api/auth/me', { headers: authHeaders() })
      if (!res.ok) {
        window.location.href = '/login'
        return
      }
      setUser(await res.json())
    } catch {
      window.location.href = '/login'
    }
    setPageLoading(false)
  }

  async function selectChain(chain: Chain) {
    setSelectedChain(chain)
    setLoading(true)

    try {
      const res = await fetch(`/api/crypto/wallet/${chain}`, {
        headers: authHeaders()
      })

      if (!res.ok) {
        throw new Error('Failed to get wallet address')
      }

      const data = await res.json()
      setWalletAddress(data)
    } catch (error) {
      console.error('Failed to get wallet address:', error)
      alert(t('crypto.error.getAddress'))
    } finally {
      setLoading(false)
    }
  }

  function copyAddress() {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress.address)
      alert(t('crypto.copied'))
    }
  }

  function viewDepositHistory() {
    router.push('/dashboard/crypto/history')
  }

  function logout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">{t('crypto.title')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <HomeIcon size={18} />
            </a>
            <a href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <KeyIcon size={18} />
            </a>
            <span className="text-[var(--text-secondary)]">{user?.email}</span>
            <button onClick={logout} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <LogOutIcon size={18} />
            </button>
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

        {/* 选择区块链 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('crypto.selectChain')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => selectChain(chain.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedChain === chain.id
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-[var(--border)] hover:border-indigo-300 bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-base mb-1">{chain.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{chain.tokens}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 充值地址 */}
        {loading && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-[var(--text-secondary)]">{t('crypto.loading')}</p>
            </div>
          </div>
        )}

        {walletAddress && !loading && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('crypto.depositAddress')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  {t('crypto.network')}
                </label>
                <div className="text-base font-medium">{walletAddress.chain.toUpperCase()}</div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  {t('crypto.address')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={walletAddress.address}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-sm"
                  />
                  <button
                    onClick={copyAddress}
                    className="px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    {t('crypto.copy')}
                  </button>
                </div>
              </div>
              <div className="flex justify-center py-4">
                <img
                  src={walletAddress.qrCode}
                  alt="QR Code"
                  className="w-48 h-48 border border-[var(--border)] rounded-lg"
                />
              </div>
              <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-600 mb-2">{t('crypto.notice.title')}</h3>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-500 space-y-1 list-disc list-inside">
                      <li>{t('crypto.notice.network')}</li>
                      <li>{t('crypto.notice.minimum')}</li>
                      <li>{t('crypto.notice.confirmation')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 充值说明 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('crypto.howToDeposit')}</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-600 mb-2">{t('crypto.depositSteps.title')}</h3>
                  <ol className="text-sm text-blue-700 dark:text-blue-500 space-y-2 list-decimal list-inside">
                    <li>{t('crypto.depositSteps.step1')}</li>
                    <li>{t('crypto.depositSteps.step2')}</li>
                    <li>{t('crypto.depositSteps.step3')}</li>
                    <li>{t('crypto.depositSteps.step4')}</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-600 mb-2">真实区块链充值</h3>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    这是真实的区块链充值系统。您的充值将在区块链确认后自动到账。系统会自动监控您的充值地址，无需手动操作。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Button */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <button
            onClick={viewDepositHistory}
            className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-2"
          >
            <ClockIcon size={18} />
            {t('crypto.viewHistory')}
          </button>
        </div>
      </div>
    </div>
  )
}
