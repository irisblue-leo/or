'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { OpenClawLogo, ArrowRightIcon } from '@/components/icons'
import LanguageSwitcher from '@/components/LanguageSwitcher'

type Chain = 'ethereum' | 'bsc' | 'tron' | 'polygon' | 'solana'

interface WalletAddress {
  chain: string
  address: string
  qrCode: string
}

export default function CryptoDepositPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [walletAddress, setWalletAddress] = useState<WalletAddress | null>(null)
  const [loading, setLoading] = useState(false)

  const chains = [
    { id: 'ethereum' as Chain, name: 'Ethereum', tokens: 'ETH, USDT' },
    { id: 'bsc' as Chain, name: 'BSC', tokens: 'BNB, BUSD' },
    { id: 'tron' as Chain, name: 'TRON', tokens: 'TRX, USDT' },
    { id: 'polygon' as Chain, name: 'Polygon', tokens: 'MATIC, USDC' },
    { id: 'solana' as Chain, name: 'Solana', tokens: 'SOL, USDC' },
  ]

  async function selectChain(chain: Chain) {
    setSelectedChain(chain)
    setLoading(true)

    try {
      const res = await fetch(`/api/crypto/wallet/${chain}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowRightIcon size={20} className="rotate-180" />
              </button>
              <a href="/" className="flex items-center gap-2">
                <OpenClawLogo size={28} />
                <span className="text-xl font-bold text-[var(--text-primary)]">OpenClaw Relay</span>
              </a>
            </div>
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('crypto.title')}</h1>
          <p className="text-[var(--text-secondary)]">{t('crypto.subtitle')}</p>
        </div>

        {/* 选择区块链 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('crypto.selectChain')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => selectChain(chain.id)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedChain === chain.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-lg mb-1">{chain.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{chain.tokens}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 充值地址 */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 mb-6">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-[var(--text-secondary)]">{t('crypto.loading')}</p>
            </div>
          </div>
        )}

        {walletAddress && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{t('crypto.depositAddress')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('crypto.network')}
                </label>
                <div className="text-lg font-medium">{walletAddress.chain.toUpperCase()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('crypto.address')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={walletAddress.address}
                    readOnly
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={copyAddress}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {t('crypto.copy')}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <img
                  src={walletAddress.qrCode}
                  alt="QR Code"
                  className="mx-auto w-48 h-48 border border-[var(--border)] rounded-lg"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">{t('crypto.notice.title')}</h3>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
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
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-4">{t('crypto.howToDeposit')}</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-2">{t('crypto.depositSteps.title')}</h3>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                    <li>{t('crypto.depositSteps.step1')}</li>
                    <li>{t('crypto.depositSteps.step2')}</li>
                    <li>{t('crypto.depositSteps.step3')}</li>
                    <li>{t('crypto.depositSteps.step4')}</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-2">真实区块链充值</h3>
                  <p className="text-sm text-green-700">
                    这是真实的区块链充值系统。您的充值将在区块链确认后自动到账。系统会自动监控您的充值地址，无需手动操作。
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={viewDepositHistory}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('crypto.viewHistory')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
