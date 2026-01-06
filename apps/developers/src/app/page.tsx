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
            <p className="text-ink-muted">Complete SDK API documentation</p>
          </div>

          {/* Villa Client */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Villa Client</h3>
            <p className="text-ink-muted text-sm">
              Main SDK entry point for authentication and identity
            </p>
            <CodeBlock
              code={`// Create SDK instance
const villa = new Villa({
  appId: 'your-app',           // Required: your app ID
  network: 'base',             // Optional: 'base' | 'base-sepolia'
  apiUrl: 'https://api.villa.cash'  // Optional: override API
})

// Sign in user
const result = await villa.signIn({
  scopes: ['profile', 'wallet'],  // What data to request
  onProgress: (step) => console.log(step.message),
  timeout: 5 * 60 * 1000          // Max wait time
})

// Check methods
villa.isAuthenticated()       // boolean
villa.getIdentity()           // Identity | null
await villa.signOut()         // Clear session

// Utility methods
villa.getNetwork()            // 'base' | 'base-sepolia'
villa.getApiUrl()             // API endpoint
villa.getAvatarUrl(seed)      // Generate avatar
await villa.resolveEns(name)  // name -> address
await villa.reverseEns(addr)  // address -> name`}
              language="typescript"
            />
          </div>

          {/* SignInResult Type */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">SignInResult</h3>
            <p className="text-ink-muted text-sm">
              Returned from villa.signIn()
            </p>
            <CodeBlock
              code={`type SignInResult =
  | {
      success: true
      identity: {
        address: \`0x\${string}\`     // Ethereum address
        nickname: string            // User's chosen name
        avatar: AvatarConfig        // Avatar config
      }
    }
  | {
      success: false
      error: string                 // Error message
      code: SignInErrorCode         // Error code
    }

type SignInErrorCode =
  | 'CANCELLED'                     // User closed auth
  | 'TIMEOUT'                       // Took too long
  | 'NETWORK_ERROR'                 // Failed to load
  | 'INVALID_CONFIG'                // Bad config
  | 'AUTH_ERROR'                    // Auth failed`}
              language="typescript"
            />
          </div>

          {/* Identity Type */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Identity</h3>
            <p className="text-ink-muted text-sm">
              User&apos;s Villa identity
            </p>
            <CodeBlock
              code={`interface Identity {
  /** Ethereum address derived from passkey */
  address: \`0x\${string}\`

  /** User's chosen nickname (unique) */
  nickname: string

  /** Avatar configuration */
  avatar: {
    style: 'adventurer' | 'avataaars' | 'bottts' | 'thumbs'
    seed: string          // Address or nickname
    gender?: 'male' | 'female' | 'other'
  }
}`}
              language="typescript"
            />
          </div>

          {/* VillaBridge for Advanced Usage */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">VillaBridge (Advanced)</h3>
            <p className="text-ink-muted text-sm">
              Fine-grained control over authentication flow
            </p>
            <CodeBlock
              code={`import { VillaBridge } from '@rockfridrich/villa-sdk'

const bridge = new VillaBridge({
  appId: 'your-app',
  network: 'base',
  timeout: 5 * 60 * 1000,
  debug: false
})

// Event-based API
bridge.on('ready', () => {})
bridge.on('success', (identity) => {})
bridge.on('cancel', () => {})
bridge.on('error', (error, code) => {})
bridge.on('consent_granted', (appId, scopes) => {})
bridge.on('consent_denied', (appId) => {})

// Lifecycle
await bridge.open(['profile', 'wallet'])
bridge.close()

// Query state
bridge.getState()  // State machine
bridge.isOpen()    // boolean`}
              language="typescript"
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
              Villa SDK ships with AI context files that give assistants complete integration knowledge:
            </p>
            <ul className="list-disc list-inside text-ink-muted text-sm space-y-2">
              <li><code className="code-inline">CLAUDE.txt</code> - For Claude Code and Claude-based tools</li>
              <li><code className="code-inline">llms.txt</code> - Universal format for all LLMs</li>
              <li><code className="code-inline">LOVABLE.txt</code> - Optimized for Lovable projects</li>
            </ul>
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
              download="CLAUDE.txt"
              className="inline-flex items-center gap-2 bg-ink text-cream-50 px-6 py-3 rounded-lg hover:bg-ink/90 transition-colors"
            >
              Download CLAUDE.txt
            </a>
            <a
              href="/llms.txt"
              download="llms.txt"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              Download llms.txt
            </a>
            <a
              href="/LOVABLE.txt"
              download="LOVABLE.txt"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              Download LOVABLE.txt
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

      {/* Authentication Flow */}
      <section id="auth-flow" className="py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Authentication Flow</h2>
            <p className="text-ink-muted">How Villa SDK handles passkey authentication</p>
          </div>

          {/* Flow Diagram */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Step-by-Step Flow</h3>
            <div className="bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">1</div>
                <div>
                  <h4 className="font-medium">App calls signIn()</h4>
                  <p className="text-ink-muted text-sm">SDK creates fullscreen iframe with Villa auth UI</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">2</div>
                <div>
                  <h4 className="font-medium">User creates/uses passkey</h4>
                  <p className="text-ink-muted text-sm">WebAuthn handles biometric or security key authentication</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">3</div>
                <div>
                  <h4 className="font-medium">Choose identity</h4>
                  <p className="text-ink-muted text-sm">User selects nickname and avatar to customize their Villa ID</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">4</div>
                <div>
                  <h4 className="font-medium">Sign message</h4>
                  <p className="text-ink-muted text-sm">Passkey signs message proving ownership (private key never leaves device)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">5</div>
                <div>
                  <h4 className="font-medium">Derive address</h4>
                  <p className="text-ink-muted text-sm">Deterministic Ethereum address calculated from signature</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">6</div>
                <div>
                  <h4 className="font-medium">Send identity</h4>
                  <p className="text-ink-muted text-sm">Iframe sends address + nickname via secure postMessage</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">7</div>
                <div>
                  <h4 className="font-medium">Save session</h4>
                  <p className="text-ink-muted text-sm">App stores identity in localStorage (7-day expiry)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Iframe vs Popup */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Integration Options</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-cream-50 border border-ink/5 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Iframe (Recommended)</h4>
                <ul className="text-ink-muted text-sm space-y-1">
                  <li className="flex gap-2"><span className="text-accent-green">✓</span> Fullscreen modal</li>
                  <li className="flex gap-2"><span className="text-accent-green">✓</span> No popup blockers</li>
                  <li className="flex gap-2"><span className="text-accent-green">✓</span> Seamless UX</li>
                  <li className="flex gap-2"><span className="text-accent-green">✓</span> Best for all apps</li>
                </ul>
              </div>
              <div className="bg-cream-50 border border-ink/5 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Popup (Advanced)</h4>
                <ul className="text-ink-muted text-sm space-y-1">
                  <li className="flex gap-2"><span>Opens in new window</span></li>
                  <li className="flex gap-2"><span>Subject to popup blockers</span></li>
                  <li className="flex gap-2"><span>Use if iframe blocked by CSP</span></li>
                  <li className="flex gap-2"><span>Requires parent window open</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Handling */}
      <section id="events" className="py-20 bg-ink/[0.02]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Event Handling</h2>
            <p className="text-ink-muted">React to authentication events</p>
          </div>

          {/* Success Event */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">onSuccess (success event)</h3>
            <p className="text-ink-muted text-sm">
              Fired when user successfully authenticates
            </p>
            <CodeBlock
              code={`// Using Villa class
const result = await villa.signIn()
if (result.success) {
  // result.identity contains:
  // - address: '0x...'
  // - nickname: 'alice'
  // - avatar: { style, seed, gender }
  console.log('Welcome,', result.identity.nickname)
}

// Using VillaBridge (advanced)
bridge.on('success', (identity) => {
  console.log('Authenticated:', identity.nickname)
  // Save to session, redirect, etc.
})`}
              language="typescript"
            />
          </div>

          {/* Cancel Event */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">onCancel (cancel event)</h3>
            <p className="text-ink-muted text-sm">
              Fired when user closes auth flow
            </p>
            <CodeBlock
              code={`// Using Villa class
const result = await villa.signIn()
if (!result.success && result.code === 'CANCELLED') {
  console.log('User closed auth')
}

// Using VillaBridge (advanced)
bridge.on('cancel', () => {
  console.log('User cancelled auth')
  // Bridge is automatically closed
})`}
              language="typescript"
            />
          </div>

          {/* Error Event */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">onError (error event)</h3>
            <p className="text-ink-muted text-sm">
              Fired when authentication fails
            </p>
            <CodeBlock
              code={`// Using Villa class
const result = await villa.signIn()
if (!result.success) {
  console.error('Error:', result.error)
  console.error('Code:', result.code)

  // Handle specific errors
  switch (result.code) {
    case 'TIMEOUT':
      console.error('Auth took too long')
      break
    case 'NETWORK_ERROR':
      console.error('Network error:', result.error)
      break
    case 'INVALID_CONFIG':
      console.error('Invalid configuration')
      break
  }
}

// Using VillaBridge (advanced)
bridge.on('error', (error, code) => {
  console.error('Auth error:', error, code)
  // Show error message to user
})`}
              language="typescript"
            />
          </div>

          {/* Other Events */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Other Events (VillaBridge)</h3>
            <p className="text-ink-muted text-sm">
              Additional events for advanced use cases
            </p>
            <CodeBlock
              code={`// Ready - iframe loaded and ready
bridge.on('ready', () => {
  console.log('Auth UI is ready')
})

// Consent - user grants data access
bridge.on('consent_granted', (appId, scopes) => {
  console.log('Consent for scopes:', scopes)
})

// Consent denied
bridge.on('consent_denied', (appId) => {
  console.log('User denied consent')
})`}
              language="typescript"
            />
          </div>

          {/* Progress Tracking */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Progress Tracking</h3>
            <p className="text-ink-muted text-sm">
              Track authentication progress with onProgress callback
            </p>
            <CodeBlock
              code={`await villa.signIn({
  onProgress: (step) => {
    switch (step.step) {
      case 'opening_auth':
        console.log('Showing auth UI...')
        // Show loading spinner
        break
      case 'waiting_for_user':
        console.log('Waiting for user to authenticate...')
        // User sees passkey prompt
        break
      case 'processing':
        console.log('Processing response...')
        // Show processing indicator
        break
      case 'complete':
        console.log('Complete!')
        // Redirect or update state
        break
    }
  }
})`}
              language="typescript"
            />
          </div>
        </div>
      </section>

      {/* Theming & Customization */}
      <section id="theming" className="py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Theming & Customization</h2>
            <p className="text-ink-muted">Customize the authentication experience</p>
          </div>

          {/* Avatar Styles */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Avatar Styles</h3>
            <p className="text-ink-muted text-sm">
              Choose from multiple avatar generation styles
            </p>
            <CodeBlock
              code={`// Avatar styles available:
// - 'adventurer' (colorful, minimalist)
// - 'avataaars' (cartoon-style)
// - 'bottts' (robot-like)
// - 'thumbs' (emoji-based)

const url = villa.getAvatarUrl(address, {
  style: 'avataaars',
  seed: address,
  gender: 'female'  // optional
})

// Use in UI
<img src={url} alt="User avatar" />
<img src={url} width={64} height={64} />`}
              language="typescript"
            />
          </div>

          {/* Custom App Name */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Consent Screen Customization</h3>
            <p className="text-ink-muted text-sm">
              Show your app name on the consent screen (if using React SDK)
            </p>
            <CodeBlock
              code={`// In React
import { VillaAuth } from '@rockfridrich/villa-sdk-react'

<VillaAuth
  appName="My Village App"  // Shows in consent
  onComplete={(result) => {
    if (result.success) {
      console.log('Auth complete!')
    }
  }}
/>`}
              language="typescript"
            />
          </div>

          {/* CSS Customization */}
          <div className="space-y-4">
            <h3 className="font-mono text-lg">Default Styling</h3>
            <p className="text-ink-muted text-sm">
              Auth iframe uses Villa design system (can override if needed)
            </p>
            <CodeBlock
              code={`// Auth container styles (fixed):
// - position: fixed (fullscreen)
// - z-index: 999999 (always on top)
// - background: #FFFDF8 (Villa cream)

// Override if absolutely necessary:
#villa-bridge-container {
  z-index: var(--my-z-index) !important;
  background-color: var(--my-bg-color) !important;
}`}
              language="css"
            />
          </div>
        </div>
      </section>

      {/* Error Handling & Troubleshooting */}
      <section id="troubleshooting" className="py-20 bg-ink/[0.02]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Error Handling & Troubleshooting</h2>
            <p className="text-ink-muted">Common issues and how to solve them</p>
          </div>

          {/* Error Codes Reference */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Error Codes Reference</h3>
            <div className="bg-cream-50 border border-ink/5 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/5">
                    <th className="text-left p-3 font-mono">Code</th>
                    <th className="text-left p-3 font-mono">Cause</th>
                    <th className="text-left p-3 font-mono">Solution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-ink/5">
                    <td className="p-3 font-mono text-accent-yellow">CANCELLED</td>
                    <td className="p-3">User closed auth</td>
                    <td className="p-3">Expected - handle gracefully</td>
                  </tr>
                  <tr className="border-b border-ink/5">
                    <td className="p-3 font-mono text-accent-yellow">TIMEOUT</td>
                    <td className="p-3">Auth took too long</td>
                    <td className="p-3">Increase timeout or check network</td>
                  </tr>
                  <tr className="border-b border-ink/5">
                    <td className="p-3 font-mono text-accent-yellow">NETWORK_ERROR</td>
                    <td className="p-3">Failed to load auth</td>
                    <td className="p-3">Check internet connection</td>
                  </tr>
                  <tr className="border-b border-ink/5">
                    <td className="p-3 font-mono text-accent-yellow">INVALID_CONFIG</td>
                    <td className="p-3">Bad SDK config</td>
                    <td className="p-3">Check appId and scopes</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-accent-yellow">AUTH_ERROR</td>
                    <td className="p-3">Auth failed (passkey)</td>
                    <td className="p-3">Check device passkey support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Issues */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Common Issues</h3>
            <CodeBlock
              code={`// Issue: "appId is required"
// Solution: Pass appId to constructor
const villa = new Villa({ appId: 'my-app' })

// Issue: Blank auth page
// Solution: Clear cache and restart
// Run: pnpm dev:clean

// Issue: Passkey not working
// Solution: Use HTTPS or localhost
// Run: pnpm dev:https

// Issue: "Origin not in allowlist"
// Solution: Don't set custom origin in production
// Remove: origin from BridgeConfig

// Issue: Session not persisting
// Solution: Check localStorage availability
console.log(localStorage.getItem('villa:session'))

// Issue: Passkey canceled by user
// Solution: This is normal - gracefully handle
if (result.code === 'CANCELLED') {
  // Show retry button or message
}`}
              language="typescript"
            />
          </div>

          {/* Debug Mode */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Debug Mode</h3>
            <p className="text-ink-muted text-sm">
              Enable debug logging for troubleshooting
            </p>
            <CodeBlock
              code={`// Enable debug logging
const bridge = new VillaBridge({
  appId: 'my-app',
  debug: true  // Logs all messages to console
})

// Or in development, debug is auto-enabled:
// if (process.env.NODE_ENV === 'development')

// Check iframe in DevTools:
// 1. Open DevTools (F12)
// 2. Go to Elements tab
// 3. Find <div id="villa-bridge-container">
// 4. Look for <iframe id="villa-auth-iframe">
// 5. Check Console for [VillaBridge] logs`}
              language="typescript"
            />
          </div>

          {/* Device Support */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Platform Requirements</h3>
            <div className="bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Desktop</h4>
                <ul className="text-ink-muted text-sm space-y-1">
                  <li>Chrome/Edge 90+, Firefox 90+, Safari 13+</li>
                  <li>Windows Hello, Touch ID, or security keys</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Mobile</h4>
                <ul className="text-ink-muted text-sm space-y-1">
                  <li>iOS 16+ (Face ID/Touch ID)</li>
                  <li>Android 9+ (fingerprint or face unlock)</li>
                  <li>Must use HTTPS (ngrok for dev: pnpm qa)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Fallback</h4>
                <ul className="text-ink-muted text-sm space-y-1">
                  <li>Security keys (Yubikey, etc.) on supported platforms</li>
                  <li>Platform authenticator (system passkeys)</li>
                </ul>
              </div>
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
