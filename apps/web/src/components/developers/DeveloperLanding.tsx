'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Code2, Lock, Zap, Fingerprint, Play, ExternalLink, Sparkles, Copy, Check, FileText } from 'lucide-react'
import { Button } from '@/components/ui'
import Link from 'next/link'

const AI_INTEGRATION_PROMPT = `I want to add Villa passkey authentication to my project. Villa provides privacy-first authentication on Base network - no passwords, just biometrics.

Read the SDK documentation at: https://villa.cash/llms.txt
Source code: https://github.com/rockfridrich/villa/tree/main/packages/sdk

Integration steps:
1. Install: npm install @rockfridrich/villa-sdk viem zod
2. For React: npm install @rockfridrich/villa-sdk-react

Basic usage:
\`\`\`tsx
import { VillaProvider, VillaAuth } from '@rockfridrich/villa-sdk-react'

function App() {
  const [user, setUser] = useState(null)
  return (
    <VillaProvider config={{ appId: 'my-app' }}>
      {!user ? (
        <VillaAuth onComplete={(r) => r.success && setUser(r.identity)} />
      ) : (
        <h1>Welcome, @{user.nickname}</h1>
      )}
    </VillaProvider>
  )
}
\`\`\`

Please analyze my project structure and suggest the best way to integrate Villa authentication.`

interface DeveloperLandingProps {
  onConnect: () => void
  isConnected?: boolean
}

/**
 * Developer Portal landing page
 * Hero section, features, code snippet, and CTA
 */
export function DeveloperLanding({ onConnect, isConnected }: DeveloperLandingProps) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AI_INTEGRATION_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = AI_INTEGRATION_PROMPT
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.3,
            staggerChildren: 0.1,
          },
        },
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3 },
        },
      }

  const features = [
    {
      icon: Fingerprint,
      title: 'Passkey Authentication',
      description: 'No passwords. Users authenticate with biometrics.',
    },
    {
      icon: Lock,
      title: 'Privacy-First',
      description: 'Users control exactly what data apps can access.',
    },
    {
      icon: Zap,
      title: 'Fast Integration',
      description: 'One SDK. Five minutes to working auth.',
    },
    {
      icon: Code2,
      title: 'ENS Compatible',
      description: 'Nicknames resolve as proofofretreat.eth subdomains.',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl mx-auto px-5 py-20"
    >
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-20">
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-serif text-ink"
        >
          Villa Identity SDK
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-xl text-ink-muted max-w-2xl mx-auto"
        >
          Privacy-first passkey authentication on Base. Drop-in identity for your village apps.
        </motion.p>
        <motion.div variants={itemVariants} className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            variant="primary"
            onClick={onConnect}
            className="min-w-[200px]"
          >
            {isConnected ? 'View Dashboard' : 'Connect Wallet'}
          </Button>
        </motion.div>
      </div>

      {/* AI Integration - Most Prominent */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-2xl p-8 mb-20 border border-purple-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-ink">AI-Powered Integration</h2>
              <p className="text-sm text-ink-muted">Let AI tools integrate Villa auth for you</p>
            </div>
          </div>

          <p className="text-ink-muted mb-6 max-w-2xl">
            Copy this prompt and paste it into Claude, ChatGPT, or any AI coding assistant.
            It will analyze your project and suggest the best integration approach.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={copyPrompt}
              className="min-w-[200px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy AI Prompt
                </>
              )}
            </Button>
            <Link href="/llms.txt" target="_blank">
              <Button variant="secondary" size="lg">
                <FileText className="w-5 h-5 mr-2" />
                View llms.txt
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-ink/5 rounded-lg border border-ink/10">
            <p className="text-xs text-ink-muted font-mono line-clamp-3">
              {AI_INTEGRATION_PROMPT.substring(0, 200)}...
            </p>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              data-testid="feature-card"
              className="bg-cream-100 rounded-lg p-6 border border-neutral-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-yellow rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-brown" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif text-ink mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-base text-ink-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Try the Demo */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-accent-yellow/20 to-accent-yellow/5 rounded-xl p-8 mb-20 border border-accent-yellow/30"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-serif text-ink mb-2">
              Try the Interactive Demo
            </h2>
            <p className="text-ink-muted">
              Test the full SDK flow in your browser. See postMessage events, inspect the iframe, and debug your integration.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/sdk-demo">
              <Button variant="primary" className="min-w-[160px]">
                <Play className="w-4 h-4 mr-2" />
                Full Demo
              </Button>
            </Link>
            <Link href="/sdk-demo/iframe-test">
              <Button variant="secondary" className="min-w-[160px]">
                <ExternalLink className="w-4 h-4 mr-2" />
                Iframe Test
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Code Preview */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-serif text-ink text-center mb-6">
          Quick Start
        </h2>
        <div className="bg-ink rounded-lg p-6 overflow-x-auto">
          <pre className="text-sm text-cream-50 font-mono">
            <code>{`import { VillaIdentity } from '@villa/identity-sdk'

const villa = new VillaIdentity({
  appId: 'your-app-id',
  appSignature: '0x...',
  appWallet: '0x...'
})

// Open fullscreen auth flow
const identity = await villa.signIn()

console.log(identity.nickname)  // "alice"
console.log(identity.walletAddress)  // "0x..."

// Get user data with consent
const profile = await villa.getData(['nickname', 'avatar'])`}</code>
          </pre>
        </div>
      </motion.div>
    </motion.div>
  )
}
