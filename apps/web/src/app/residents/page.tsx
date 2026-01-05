'use client'

import { useState } from 'react'
import { VillaAuth, type VillaAuthResponse } from '@/components/sdk'
import { Button } from '@/components/ui'
import { AvatarPreview } from '@/components/sdk'
import { LogOut, User, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * Residents App - Example integration of VillaAuth
 *
 * This demonstrates how a "Residents" application (like a retreat/village app)
 * would integrate Villa authentication with ONE component.
 *
 * Integration is literally:
 * ```tsx
 * <VillaAuth onComplete={(result) => {
 *   if (result.success) setUser(result.identity)
 * }} />
 * ```
 */
export default function ResidentsPage() {
  const [user, setUser] = useState<VillaAuthResponse | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  const handleAuthComplete = (result: VillaAuthResponse) => {
    setUser(result)
    setShowAuth(false)
  }

  const handleSignOut = () => {
    setUser(null)
  }

  // Show auth flow
  if (showAuth) {
    return (
      <VillaAuth
        onComplete={handleAuthComplete}
        appName="Residents"
      />
    )
  }

  // Authenticated - show dashboard
  if (user?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        {/* Header */}
        <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-emerald-600" />
              <span className="font-serif text-xl text-emerald-900">Residents</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <AvatarPreview
                    walletAddress={user.identity.address}
                    selection={user.identity.avatar.selection || 'other'}
                    variant={user.identity.avatar.variant || 0}
                    size={32}
                  />
                </div>
                <span className="text-sm font-medium text-emerald-800">
                  @{user.identity.nickname}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-emerald-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5 text-emerald-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Welcome card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                  <AvatarPreview
                    walletAddress={user.identity.address}
                    selection={user.identity.avatar.selection || 'other'}
                    variant={user.identity.avatar.variant || 0}
                    size={80}
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-serif text-emerald-900">
                    Welcome back, @{user.identity.nickname}!
                  </h1>
                  <p className="text-emerald-600 mt-1">
                    You&apos;re checked in to the village
                  </p>
                  <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      Resident
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      Week 2
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Schedule', icon: '📅', color: 'bg-blue-50 text-blue-600' },
                { label: 'Directory', icon: '👥', color: 'bg-purple-50 text-purple-600' },
                { label: 'Events', icon: '🎉', color: 'bg-pink-50 text-pink-600' },
                { label: 'Resources', icon: '📚', color: 'bg-amber-50 text-amber-600' },
              ].map((action) => (
                <button
                  key={action.label}
                  className={`${action.color} p-6 rounded-xl text-center hover:scale-105 transition-transform`}
                >
                  <span className="text-3xl block mb-2">{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Identity debug */}
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h3 className="font-mono text-sm text-emerald-700 mb-3">Villa Identity (Debug)</h3>
              <pre className="text-xs bg-white p-4 rounded-lg overflow-x-auto border border-emerald-100">
{JSON.stringify(user.identity, null, 2)}
              </pre>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Not authenticated - show landing
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Home className="w-6 h-6 text-emerald-600" />
          <span className="font-serif text-xl text-emerald-900">Residents</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-8"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center">
              <User className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-serif text-emerald-900">
              Welcome to the Village
            </h1>
            <p className="text-emerald-600">
              Join your community with one tap. No passwords, no hassle.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setShowAuth(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Enter with Villa ID
          </Button>

          <p className="text-sm text-emerald-500">
            Powered by Villa passkey authentication
          </p>

          {/* Back to demo */}
          <Link
            href="/sdk-demo"
            className="text-sm text-emerald-600 hover:underline inline-block"
          >
            ← Back to SDK Demo
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
