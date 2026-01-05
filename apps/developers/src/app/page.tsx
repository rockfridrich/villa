'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Github, ChevronRight } from 'lucide-react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-accent-green" />
      ) : (
        <Copy className="w-4 h-4 text-cream-100/60" />
      )}
    </button>
  )
}

function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  return (
    <div className="code-block group relative">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs text-cream-100/40">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-cream-50/80 backdrop-blur-sm border-b border-ink/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-serif text-xl">Villa SDK</span>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <a href="#quickstart" className="text-ink-muted hover:text-ink transition-colors">
                Quickstart
              </a>
              <a href="#api" className="text-ink-muted hover:text-ink transition-colors">
                API
              </a>
              <a href="#components" className="text-ink-muted hover:text-ink transition-colors">
                Components
              </a>
            </div>
          </div>
          <a
            href="https://github.com/rockfridrich/villa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="font-serif text-5xl sm:text-6xl tracking-tight">
            Villa SDK
          </h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            One-prompt authentication for pop-up villages.
            <br />
            Passkeys. No passwords. Privacy-first.
          </p>

          {/* Install command */}
          <div className="inline-flex items-center gap-3 bg-ink text-cream-50 rounded-lg px-4 py-3 font-mono text-sm">
            <span className="text-accent-yellow">$</span>
            <span>pnpm add @villa/sdk</span>
            <CopyButton text="pnpm add @villa/sdk" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="https://beta.villa.cash/sdk-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              Live Demo
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="py-16 px-6 bg-ink/[0.02]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Privacy-first',
              description: 'Passkeys stay on device. We never see private keys.',
            },
            {
              title: 'One prompt',
              description: 'Full auth flow in a single signIn() call.',
            },
            {
              title: 'ENS compatible',
              description: 'Nicknames resolve like ENS. alice.villa.eth',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-cream-50 border border-ink/5 rounded-xl p-6 space-y-2"
            >
              <h3 className="font-serif text-lg">{feature.title}</h3>
              <p className="text-ink-muted text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Quickstart</h2>
            <p className="text-ink-muted">Get up and running in 4 steps</p>
          </div>

          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium">
                1
              </span>
              <h3 className="font-medium">Install</h3>
            </div>
            <CodeBlock code="pnpm add @villa/sdk" language="bash" />
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium">
                2
              </span>
              <h3 className="font-medium">Import</h3>
            </div>
            <CodeBlock
              code={`import { VillaAuth } from '@villa/sdk/react'`}
              language="tsx"
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium">
                3
              </span>
              <h3 className="font-medium">Authenticate</h3>
            </div>
            <CodeBlock
              code={`<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      console.log('Welcome,', result.identity.nickname)
      // result.identity: { address, nickname, avatar }
    }
  }}
/>`}
              language="tsx"
            />
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium">
                4
              </span>
              <h3 className="font-medium">Ship it</h3>
            </div>
            <p className="text-ink-muted">
              Your users now have Villa IDs. No passwords. Just passkeys.
            </p>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section id="api" className="py-20 px-6 bg-ink/[0.02]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">API Reference</h2>
            <p className="text-ink-muted">Types and interfaces</p>
          </div>

          {/* VillaAuthResult */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">VillaAuthResult</h3>
            <p className="text-ink-muted text-sm">
              Returned on successful authentication
            </p>
            <CodeBlock
              code={`interface VillaAuthResult {
  success: true
  identity: {
    address: \`0x\${string}\`  // Wallet address
    nickname: string         // User's chosen nickname
    avatar: AvatarConfig     // Avatar configuration
  }
}`}
              language="tsx"
            />
          </div>

          {/* VillaAuthError */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">VillaAuthError</h3>
            <p className="text-ink-muted text-sm">
              Returned when authentication fails or is cancelled
            </p>
            <CodeBlock
              code={`interface VillaAuthError {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}`}
              language="tsx"
            />
          </div>

          {/* AvatarConfig */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">AvatarConfig</h3>
            <p className="text-ink-muted text-sm">
              User&apos;s avatar configuration
            </p>
            <CodeBlock
              code={`interface AvatarConfig {
  style: 'avataaars' | 'bottts'
  selection: 'male' | 'female' | 'other'
  variant: number  // 0-4, for avatar variations
}`}
              language="tsx"
            />
          </div>
        </div>
      </section>

      {/* Components */}
      <section id="components" className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">React Components</h2>
            <p className="text-ink-muted">Ready-to-use UI components</p>
          </div>

          {/* VillaAuth */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">VillaAuth</h3>
            <p className="text-ink-muted text-sm">
              Complete auth flow in one component. Handles welcome, passkey, nickname, and avatar selection.
            </p>
            <CodeBlock
              code={`import { VillaAuth } from '@villa/sdk/react'

function LoginPage() {
  return (
    <VillaAuth
      onComplete={(result) => {
        if (result.success) {
          // User authenticated
          router.push('/dashboard')
        }
      }}
      appName="My App"  // Optional: shown in consent
    />
  )
}`}
              language="tsx"
            />

            <div className="bg-cream-100/50 border border-ink/5 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Props</h4>
              <ul className="text-sm text-ink-muted space-y-1">
                <li>
                  <code className="code-inline">onComplete</code> - Called when auth completes (success or error)
                </li>
                <li>
                  <code className="code-inline">appName?</code> - Your app name for consent screen
                </li>
                <li>
                  <code className="code-inline">initialStep?</code> - Skip to step (for testing)
                </li>
              </ul>
            </div>
          </div>

          {/* AvatarPreview */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">AvatarPreview</h3>
            <p className="text-ink-muted text-sm">
              Display a user&apos;s avatar from their configuration.
            </p>
            <CodeBlock
              code={`import { AvatarPreview } from '@villa/sdk/react'

<AvatarPreview
  walletAddress={user.address}
  selection={user.avatar.selection}
  variant={user.avatar.variant}
  size={48}
/>`}
              language="tsx"
            />
          </div>
        </div>
      </section>

      {/* Full Example */}
      <section className="py-20 px-6 bg-ink/[0.02]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Full Example</h2>
            <p className="text-ink-muted">Complete integration in under 30 lines</p>
          </div>

          <CodeBlock
            code={`'use client'

import { useState } from 'react'
import { VillaAuth, AvatarPreview, type VillaAuthResponse } from '@villa/sdk/react'

export default function App() {
  const [user, setUser] = useState<VillaAuthResponse | null>(null)

  // Show auth flow
  if (!user?.success) {
    return <VillaAuth onComplete={setUser} appName="My Village" />
  }

  // User is authenticated
  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <AvatarPreview
          walletAddress={user.identity.address}
          selection={user.identity.avatar.selection}
          variant={user.identity.avatar.variant}
          size={64}
        />
        <div>
          <h1>Welcome, @{user.identity.nickname}!</h1>
          <p className="text-gray-500">You're authenticated with Villa ID</p>
        </div>
      </div>
    </div>
  )
}`}
            language="tsx"
          />

          <div className="text-center">
            <a
              href="https://beta.villa.cash/residents"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors"
            >
              See live example
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-ink/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <a href="https://villa.cash" className="hover:text-ink transition-colors">
              villa.cash
            </a>
            <span>|</span>
            <a
              href="https://github.com/rockfridrich/villa"
              className="hover:text-ink transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="text-sm text-ink-muted">
            Built for pop-up villages
          </p>
        </div>
      </footer>
    </div>
  )
}
