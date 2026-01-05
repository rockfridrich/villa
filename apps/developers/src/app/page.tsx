'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, ChevronRight } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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
      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-150 bg-ink/80 backdrop-blur-sm"
      aria-label="Copy code to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-accent-green" />
      ) : (
        <Copy className="w-4 h-4 text-cream-100/60 hover:text-cream-100 transition-colors" />
      )}
    </button>
  )
}

function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  const lineCount = code.split('\n').length

  return (
    <div className="relative group rounded-lg overflow-hidden">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <span className="text-xs text-cream-100/40 bg-ink/80 px-2 py-1 rounded backdrop-blur-sm">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1.5rem',
          paddingTop: '3.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          border: '1px solid rgba(255, 252, 248, 0.05)',
        }}
        showLineNumbers={lineCount > 10}
        wrapLines={true}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section id="getting-started" className="py-20">
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
            <span>npm install @rockfridrich/villa-sdk</span>
            <CopyButton text="npm install @rockfridrich/villa-sdk viem zod" />
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
      <section className="py-16 bg-ink/[0.02]">
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
      <section id="quickstart" className="py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Quickstart</h2>
            <p className="text-ink-muted">Get up and running in 4 steps</p>
          </div>

          {/* Step 1 */}
          <div id="installation" className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium">
                1
              </span>
              <h3 className="font-medium">Install</h3>
            </div>
            <CodeBlock code="npm install @rockfridrich/villa-sdk viem zod" language="bash" />
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
              code={`import { VillaAuth } from '@rockfridrich/villa-sdk-react'`}
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
      <section id="api" className="py-20 bg-ink/[0.02]">
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
      <section id="components" className="py-20">
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
              code={`import { VillaAuth } from '@rockfridrich/villa-sdk-react'

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
              code={`import { AvatarPreview } from '@rockfridrich/villa-sdk-react'

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

      {/* AI Integration */}
      <section id="ai" className="py-20 bg-accent-yellow/5 border-y border-accent-yellow/20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-yellow/20 rounded-full text-sm font-medium">
              <span>NEW</span>
            </div>
            <h2 className="font-serif text-3xl">AI Integration</h2>
            <p className="text-ink-muted">
              One prompt to authenticate. Works with Claude Code, Cursor, Lovable, and more.
            </p>
          </div>

          {/* One-liner prompt */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">The One-Prompt Integration</h3>
            <p className="text-ink-muted text-sm">
              Just tell your AI assistant:
            </p>
            <div className="bg-ink text-cream-50 rounded-lg p-6 font-mono text-lg text-center">
              &quot;Add Villa authentication to my app&quot;
            </div>
            <p className="text-ink-muted text-sm text-center">
              That&apos;s it. The AI knows what to do.
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">How It Works</h3>
            <p className="text-ink-muted text-sm">
              Villa SDK ships with <code className="code-inline">CLAUDE.txt</code> and{' '}
              <code className="code-inline">llms.txt</code> files that give AI assistants
              complete context for integration.
            </p>
            <CodeBlock
              code={`# After installing, copy to your project:
cp node_modules/@rockfridrich/villa-sdk/CLAUDE.txt .claude/villa.md

# Or download directly:
curl -o .claude/villa.md https://developers.villa.cash/CLAUDE.txt`}
              language="bash"
            />
          </div>

          {/* Download buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/CLAUDE.txt"
              download
              className="inline-flex items-center gap-2 bg-ink text-cream-50 px-6 py-3 rounded-lg hover:bg-ink/90 transition-colors"
            >
              Download CLAUDE.txt
            </a>
            <a
              href="/llms.txt"
              download
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              Download llms.txt
            </a>
          </div>

          {/* What the AI generates */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">What You Get</h3>
            <p className="text-ink-muted text-sm">
              When an AI integrates Villa, it generates:
            </p>
            <CodeBlock
              code={`import { VillaProvider, VillaAuth } from '@rockfridrich/villa-sdk-react'
import { useState } from 'react'

function App() {
  const [user, setUser] = useState(null)

  return (
    <VillaProvider config={{ appId: 'your-app' }}>
      {!user ? (
        <VillaAuth onComplete={(result) => {
          if (result.success) setUser(result.identity)
        }} />
      ) : (
        <h1>Welcome, @{user.nickname}</h1>
      )}
    </VillaProvider>
  )
}`}
              language="tsx"
            />
          </div>

          {/* Manifesto */}
          <div className="bg-cream-50 border border-ink/10 rounded-xl p-6 space-y-4">
            <h3 className="font-serif text-lg">The Villa Manifesto</h3>
            <div className="text-ink-muted text-sm space-y-3">
              <p>
                <strong>Privacy is not a feature, it&apos;s the foundation.</strong>{' '}
                Passkeys never leave your device. We don&apos;t see your keys, we don&apos;t want them.
              </p>
              <p>
                <strong>One identity, everywhere.</strong>{' '}
                Your Villa ID works across all pop-up village apps. Same nickname, same avatar, no re-registration.
              </p>
              <p>
                <strong>AI-native by design.</strong>{' '}
                Integration should be a conversation, not a documentation scavenger hunt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Full Example */}
      <section className="py-20 bg-ink/[0.02]">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Full Example</h2>
            <p className="text-ink-muted">Complete integration in under 30 lines</p>
          </div>

          <CodeBlock
            code={`'use client'

import { useState } from 'react'
import { VillaAuth, AvatarPreview, type VillaAuthResponse } from '@rockfridrich/villa-sdk-react'

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
      <footer className="py-12 border-t border-ink/5">
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
