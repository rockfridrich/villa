'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, ExternalLink } from 'lucide-react'

type CodeTab = 'react' | 'vanilla'

/**
 * Quick start documentation with code examples
 * Tabbed code snippets with copy functionality
 */
export function QuickStartDocs() {
  const [activeTab, setActiveTab] = useState<CodeTab>('react')
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const installCode = 'npm install @rockfridrich/villa-sdk'

  const reactCode = `import { Villa } from '@rockfridrich/villa-sdk'

function App() {
  const villa = new Villa({
    appId: 'your-app-id',
    appSignature: '0x...',
    appWallet: '0x...'
  })

  const handleSignIn = async () => {
    try {
      // Opens fullscreen auth flow
      const identity = await villa.signIn()

      console.log('Signed in:', identity.nickname)
      console.log('Wallet:', identity.walletAddress)
    } catch (error) {
      console.error('Auth failed:', error)
    }
  }

  return <button onClick={handleSignIn}>Sign In with Villa</button>
}`

  const vanillaCode = `import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'your-app-id',
  appSignature: '0x...',
  appWallet: '0x...'
})

document.getElementById('signin-btn').addEventListener('click', async () => {
  try {
    // Opens fullscreen auth flow
    const identity = await villa.signIn()

    console.log('Signed in:', identity.nickname)
    console.log('Wallet:', identity.walletAddress)
  } catch (error) {
    console.error('Auth failed:', error)
  }
})`

  const steps = [
    {
      number: 1,
      title: 'Register your app',
      description: 'Connect your wallet and register to get credentials',
    },
    {
      number: 2,
      title: 'Install the SDK',
      description: 'Add the Villa Identity SDK to your project',
    },
    {
      number: 3,
      title: 'Initialize & authenticate',
      description: 'Set up the SDK with your credentials and call signIn()',
    },
    {
      number: 4,
      title: 'Access user data',
      description: 'Request user profile data with consent',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-5xl mx-auto px-5 py-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <h1 className="text-3xl font-serif text-ink mb-4">Quick Start</h1>
        <p className="text-lg text-ink-muted max-w-2xl mx-auto">
          Get up and running with Villa Identity in 5 minutes
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div variants={itemVariants} className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-12 h-12 bg-accent-yellow rounded-full flex items-center justify-center text-accent-brown font-serif text-xl mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-base font-serif text-ink mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Installation */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-serif text-ink mb-4">Installation</h2>
        <div className="relative bg-ink rounded-lg p-6">
          <pre className="text-sm text-cream-50 font-mono">{installCode}</pre>
          <button
            onClick={() => handleCopy('install', installCode)}
            className="absolute top-4 right-4 p-2 hover:bg-ink-light rounded transition-colors duration-150 flex items-center gap-2"
            aria-label="Copy code"
          >
            {copiedId === 'install' ? (
              <>
                <Check className="w-5 h-5 text-accent-yellow" />
                <span className="text-sm text-accent-yellow">Copied</span>
              </>
            ) : (
              <Copy className="w-5 h-5 text-cream-50" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Code Examples */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-serif text-ink mb-4">Usage</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-neutral-100" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'react'}
            onClick={() => setActiveTab('react')}
            className={`px-4 py-2 text-base font-medium transition-colors duration-150 border-b-2 ${
              activeTab === 'react'
                ? 'border-accent-yellow text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            React
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'vanilla'}
            onClick={() => setActiveTab('vanilla')}
            className={`px-4 py-2 text-base font-medium transition-colors duration-150 border-b-2 ${
              activeTab === 'vanilla'
                ? 'border-accent-yellow text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Vanilla JS
          </button>
        </div>

        {/* Code Block */}
        <div className="relative bg-ink rounded-lg p-6">
          <pre className="text-sm text-cream-50 font-mono overflow-x-auto">
            {activeTab === 'react' ? reactCode : vanillaCode}
          </pre>
          <button
            onClick={() =>
              handleCopy(
                activeTab,
                activeTab === 'react' ? reactCode : vanillaCode
              )
            }
            className="absolute top-4 right-4 p-2 hover:bg-ink-light rounded transition-colors duration-150 flex items-center gap-2"
            aria-label="Copy code"
          >
            {copiedId === activeTab ? (
              <>
                <Check className="w-5 h-5 text-accent-yellow" />
                <span className="text-sm text-accent-yellow">Copied</span>
              </>
            ) : (
              <Copy className="w-5 h-5 text-cream-50" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Additional Resources */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-serif text-ink mb-4">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/sdk-demo"
            className="bg-cream-100 rounded-lg p-6 border border-neutral-100 hover:shadow transition-shadow duration-150 flex items-start justify-between group"
          >
            <div>
              <h3 className="text-base font-serif text-ink mb-2">
                Interactive Demo
              </h3>
              <p className="text-sm text-ink-muted">
                Test the full authentication flow in your browser
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors duration-150" />
          </a>

          <a
            href="/llms.txt"
            target="_blank"
            className="bg-cream-100 rounded-lg p-6 border border-neutral-100 hover:shadow transition-shadow duration-150 flex items-start justify-between group"
          >
            <div>
              <h3 className="text-base font-serif text-ink mb-2">
                AI Integration Guide
              </h3>
              <p className="text-sm text-ink-muted">
                Machine-readable docs for AI coding assistants
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors duration-150" />
          </a>

          <a
            href="https://github.com/rockfridrich/villa/tree/main/packages/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cream-100 rounded-lg p-6 border border-neutral-100 hover:shadow transition-shadow duration-150 flex items-start justify-between group"
          >
            <div>
              <h3 className="text-base font-serif text-ink mb-2">
                Source Code
              </h3>
              <p className="text-sm text-ink-muted">
                Browse SDK source, examples, and types on GitHub
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors duration-150" />
          </a>

          <a
            href="https://www.npmjs.com/package/@rockfridrich/villa-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cream-100 rounded-lg p-6 border border-neutral-100 hover:shadow transition-shadow duration-150 flex items-start justify-between group"
          >
            <div>
              <h3 className="text-base font-serif text-ink mb-2">
                npm Package
              </h3>
              <p className="text-sm text-ink-muted">
                View package details, versions, and install instructions
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-ink-muted group-hover:text-ink transition-colors duration-150" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}
