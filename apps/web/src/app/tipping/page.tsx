'use client'

import { useState, useEffect } from 'react'
import { Send, LogOut, Loader2, CheckCircle, AlertCircle, User } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { VillaAuth } from '@/components/sdk/VillaAuth'
import { AvatarImage } from '@/components/sdk/AvatarImage'
import { useIdentityStore } from '@/lib/store'
import { disconnectPorto, sendTransaction } from '@/lib/porto'
import { parseEther } from 'viem'

interface TipRecord {
  id: string
  fromNickname: string
  fromAddress: string
  toNickname: string
  toAddress: string
  amount: string
  timestamp: number
  txHash?: string
}

const STORAGE_KEY = 'villa-tipping-history'

type TipStatus = 'idle' | 'resolving' | 'confirming' | 'sending' | 'success' | 'error'

export default function TippingPage() {
  const { identity, clearIdentity } = useIdentityStore()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [history, setHistory] = useState<TipRecord[]>([])
  const [showAuth, setShowAuth] = useState(false)
  const [status, setStatus] = useState<TipStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch {
        setHistory([])
      }
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }, [history])

  // Resolve nickname to address
  const resolveNickname = async (nickname: string): Promise<string | null> => {
    const cleanNickname = nickname.replace('@', '').trim()
    if (!cleanNickname) return null

    try {
      const response = await fetch(`/api/nicknames/reverse/${cleanNickname}`)
      if (response.ok) {
        const data = await response.json()
        return data.address
      }
      // Try ENS-style resolution
      const ensResponse = await fetch(`/api/ens/resolve?name=${cleanNickname}.villa.eth`)
      if (ensResponse.ok) {
        const data = await ensResponse.json()
        return data.address
      }
      return null
    } catch {
      return null
    }
  }

  const handleSendTip = async () => {
    if (!identity || !recipient || !amount) return

    setError(null)
    setStatus('resolving')

    try {
      // Resolve nickname to address
      const toAddress = await resolveNickname(recipient)
      if (!toAddress) {
        setError(`Could not find @${recipient.replace('@', '')}`)
        setStatus('error')
        return
      }
      // Validate amount
      const amountWei = parseEther(amount)
      if (amountWei <= 0n) {
        setError('Amount must be greater than 0')
        setStatus('error')
        return
      }

      setStatus('confirming')

      // Send transaction using Porto
      const txHash = await sendTransaction({
        to: toAddress as `0x${string}`,
        value: amountWei,
      })

      setStatus('success')

      // Record the tip
      const record: TipRecord = {
        id: crypto.randomUUID(),
        fromNickname: identity.displayName,
        fromAddress: identity.address,
        toNickname: recipient.replace('@', ''),
        toAddress,
        amount,
        timestamp: Date.now(),
        txHash,
      }

      setHistory((prev) => [record, ...prev].slice(0, 50))

      // Reset form
      setRecipient('')
      setAmount('')

      // Reset status after delay
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      console.error('Tip failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to send tip')
      setStatus('error')
    }
  }

  const handleLogout = async () => {
    await disconnectPorto()
    clearIdentity()
    setShowAuth(false)
  }

  const statusMessages: Record<TipStatus, string> = {
    idle: '',
    resolving: 'Finding recipient...',
    confirming: 'Confirm in your wallet...',
    sending: 'Sending tip...',
    success: 'Tip sent!',
    error: error || 'Something went wrong',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-4xl tracking-tight">Tip a Friend</h1>
          <p className="text-ink-muted">Send ETH to any @nickname</p>
        </div>

        {identity ? (
          <>
            {/* Logged in user */}
            <div className="flex items-center justify-between bg-cream-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AvatarImage avatar={typeof identity.avatar === 'string' ? null : (identity.avatar || null)} walletAddress={identity.address} size={40} />
                <div>
                  <p className="font-medium">@{identity.displayName}</p>
                  <p className="text-xs text-ink-muted">
                    {identity.address.slice(0, 6)}...{identity.address.slice(-4)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Tip form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="@nickname"
                    className="pl-10"
                    disabled={status !== 'idle' && status !== 'error'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  disabled={status !== 'idle' && status !== 'error'}
                />
              </div>

              {/* Status display */}
              {status !== 'idle' && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    status === 'success'
                      ? 'bg-accent-green/10 text-accent-green'
                      : status === 'error'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-accent-yellow/10 text-accent-yellow'
                  }`}
                >
                  {status === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="text-sm">{statusMessages[status]}</span>
                </div>
              )}

              <Button
                onClick={handleSendTip}
                className="w-full"
                disabled={!recipient || !amount || (status !== 'idle' && status !== 'error')}
              >
                {status === 'idle' || status === 'error' ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Tip
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {statusMessages[status]}
                  </>
                )}
              </Button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-medium text-sm text-ink-muted">Recent Tips</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.slice(0, 10).map((tip) => (
                    <div
                      key={tip.id}
                      className="flex items-center justify-between bg-cream-50 rounded-lg p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">@{tip.fromNickname}</span>
                        <span className="text-ink-muted"> → </span>
                        <span className="font-medium">@{tip.toNickname}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">{tip.amount} ETH</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(tip.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Not logged in */}
            <div className="text-center space-y-4">
              <p className="text-ink-muted">Sign in to send tips</p>
              <Button onClick={() => setShowAuth(true)} className="w-full">
                Sign in with Villa
              </Button>
            </div>

            {/* Auth modal */}
            {showAuth && (
              <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4">
                <div className="bg-cream-50 rounded-2xl p-6 w-full max-w-md relative">
                  <button
                    onClick={() => setShowAuth(false)}
                    className="absolute top-4 right-4 text-ink-muted hover:text-ink"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <VillaAuth
                    onComplete={(result) => {
                      if (result.success) {
                        setShowAuth(false)
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-ink-muted">
          Tips are sent on Base Sepolia testnet.{' '}
          <a
            href="https://www.alchemy.com/faucets/base-sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink"
          >
            Get testnet ETH
          </a>
        </p>
      </div>
    </div>
  )
}
