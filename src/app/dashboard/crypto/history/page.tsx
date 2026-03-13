'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { OpenClawLogo, KeyIcon, LogOutIcon } from '@/components/icons'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Deposit {
  id: string
  chain: string
  token: string
  amount: number
  amountUsd: number
  txHash: string
  status: string
  confirmations: number
  createdAt: string
  confirmedAt: string | null
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

export default function CryptoHistoryPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const token = getToken()
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      const [userRes, depositsRes] = await Promise.all([
        fetch('/api/auth/me', { headers: authHeaders() }),
        fetch('/api/crypto/deposit/history', { headers: authHeaders() })
      ])

      if (!userRes.ok) {
        window.location.href = '/login'
        return
      }

      setUser(await userRes.json())
      const depositsData = await depositsRes.json()
      setDeposits(depositsData.deposits || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: t('admin.crypto.status'), className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: t('admin.crypto.status'), className: 'bg-green-100 text-green-800' },
      failed: { text: t('admin.crypto.status'), className: 'bg-red-100 text-red-800' }
    }

    const badge = statusMap[status] || statusMap.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--bg-nav)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <OpenClawLogo size={28} />
            <span className="text-lg font-semibold tracking-tight">Deposit History</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
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

      {/* 主内容 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-[var(--text-secondary)]">{t('crypto.loading')}</p>
            </div>
          </div>
        ) : deposits.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="text-center text-[var(--text-secondary)]">
              {t('admin.crypto.noDeposits')}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.chain')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.token')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.confirmations')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.txHash')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.crypto.time')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {deposit.chain.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deposit.token}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deposit.amount} {deposit.token}
                        <div className="text-xs text-gray-500">${deposit.amountUsd}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deposit.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deposit.confirmations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={`https://etherscan.io/tx/${deposit.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {deposit.txHash.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
