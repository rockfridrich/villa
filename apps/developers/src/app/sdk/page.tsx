'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Package, BookOpen, Code2, Zap } from 'lucide-react'
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

interface TypeReference {
  name: string
  description: string
  code: string
}

const typeReferences: TypeReference[] = [
  {
    name: 'SignInResult',
    description: 'Returned from villa.signIn()',
    code: `type SignInResult =
  | {
      success: true
      identity: Identity
    }
  | {
      success: false
      error: string
      code: SignInErrorCode
    }

type SignInErrorCode =
  | 'CANCELLED'      // User closed auth
  | 'TIMEOUT'        // Took too long
  | 'NETWORK_ERROR'  // Failed to load
  | 'INVALID_CONFIG' // Bad config
  | 'AUTH_ERROR'     // Auth failed`,
  },
  {
    name: 'Identity',
    description: "User's Villa identity",
    code: `interface Identity {
  /** Ethereum address derived from passkey */
  address: \`0x\${string}\`

  /** User's chosen nickname (unique) */
  nickname: string

  /** Avatar configuration */
  avatar: AvatarConfig
}

interface AvatarConfig {
  style: 'adventurer' | 'avataaars' | 'bottts' | 'thumbs'
  seed: string          // Address or nickname
  gender?: 'male' | 'female' | 'other'
}`,
  },
  {
    name: 'VillaConfig',
    description: 'Configuration for Villa SDK instance',
    code: `interface VillaConfig {
  /** Your application ID */
  appId: string

  /** Network to use */
  network?: 'base' | 'base-sepolia'

  /** Override API URL (advanced) */
  apiUrl?: string

  /** Enable debug logging */
  debug?: boolean
}`,
  },
]

interface ComponentAPI {
  name: string
  description: string
  props: Array<{ name: string; type: string; description: string }>
  example: string
}

const componentAPIs: ComponentAPI[] = [
  {
    name: 'VillaAuth',
    description: 'Complete auth flow in one component. Handles welcome, passkey, nickname, and avatar selection.',
    props: [
      {
        name: 'onComplete',
        type: '(result: SignInResult) => void',
        description: 'Called when auth completes (success or error)',
      },
      {
        name: 'appName',
        type: 'string',
        description: 'Your app name for consent screen (optional)',
      },
      {
        name: 'initialStep',
        type: 'string',
        description: 'Skip to step for testing (optional)',
      },
    ],
    example: `import { VillaAuth } from '@rockfridrich/villa-sdk-react'

function LoginPage() {
  return (
    <VillaAuth
      onComplete={(result) => {
        if (result.success) {
          router.push('/dashboard')
        }
      }}
      appName="My App"
    />
  )
}`,
  },
  {
    name: 'AvatarPreview',
    description: "Display a user's avatar from their configuration.",
    props: [
      {
        name: 'walletAddress',
        type: 'string',
        description: "User's wallet address",
      },
      {
        name: 'selection',
        type: 'AvatarStyle',
        description: 'Avatar style selection',
      },
      {
        name: 'variant',
        type: 'AvatarVariant',
        description: 'Avatar variant options',
      },
      {
        name: 'size',
        type: 'number',
        description: 'Avatar size in pixels',
      },
    ],
    example: `import { AvatarPreview } from '@rockfridrich/villa-sdk-react'

<AvatarPreview
  walletAddress={user.address}
  selection={user.avatar.selection}
  variant={user.avatar.variant}
  size={48}
/>`,
  },
]

export default function SDKPage() {
  return (
    <div className="min-h-screen py-20">
      {/* Hero */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-yellow/20 rounded-full text-sm font-medium">
            <Package className="w-4 h-4" />
            <span>SDK Reference</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl tracking-tight">
            Villa SDK
          </h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            Complete API reference for the Villa authentication SDK.
            All exports, types, and usage examples.
          </p>

          {/* Install command */}
          <div className="inline-flex items-center gap-3 bg-ink text-cream-50 rounded-lg px-4 py-3 font-mono text-sm">
            <span className="text-accent-yellow">$</span>
            <span>npm install @rockfridrich/villa-sdk</span>
            <CopyButton text="npm install @rockfridrich/villa-sdk viem zod" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Full Documentation
            </a>
            <a
              href="https://www.npmjs.com/package/@rockfridrich/villa-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              npm Package
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Core Packages */}
      <section className="mb-20 bg-ink/[0.02] py-16 -mx-6 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Packages</h2>
            <p className="text-ink-muted">Choose the right package for your stack</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-accent-yellow" />
                <div>
                  <h3 className="font-mono text-lg">@rockfridrich/villa-sdk</h3>
                  <p className="text-sm text-ink-muted">Core SDK</p>
                </div>
              </div>
              <p className="text-ink-muted text-sm">
                Framework-agnostic JavaScript/TypeScript SDK. Works with vanilla JS, Vue, Svelte, or any framework.
              </p>
              <CodeBlock
                code="npm install @rockfridrich/villa-sdk viem zod"
                language="bash"
              />
              <ul className="text-sm text-ink-muted space-y-1">
                <li>• Villa class (high-level API)</li>
                <li>• VillaBridge (low-level control)</li>
                <li>• TypeScript types and utilities</li>
              </ul>
            </div>

            <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-accent-yellow" />
                <div>
                  <h3 className="font-mono text-lg">@rockfridrich/villa-sdk-react</h3>
                  <p className="text-sm text-ink-muted">React SDK</p>
                </div>
              </div>
              <p className="text-ink-muted text-sm">
                React-specific SDK with hooks and components. Pre-built auth flow and avatar components.
              </p>
              <CodeBlock
                code="npm install @rockfridrich/villa-sdk-react"
                language="bash"
              />
              <ul className="text-sm text-ink-muted space-y-1">
                <li>• VillaAuth component</li>
                <li>• AvatarPreview component</li>
                <li>• useVilla hook</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Quick Start</h2>
            <p className="text-ink-muted">Get started in 3 lines of code</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-yellow" />
                React (Recommended)
              </h3>
              <CodeBlock
                code={`import { VillaAuth } from '@rockfridrich/villa-sdk-react'

<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      console.log('Welcome,', result.identity.nickname)
    }
  }}
/>`}
                language="tsx"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5 text-accent-yellow" />
                Vanilla JavaScript
              </h3>
              <CodeBlock
                code={`import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({ appId: 'your-app' })

const result = await villa.signIn()
if (result.success) {
  console.log('Welcome,', result.identity.nickname)
}`}
                language="typescript"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core API */}
      <section className="mb-20 bg-ink/[0.02] py-16 -mx-6 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Core API</h2>
            <p className="text-ink-muted">Villa class methods and utilities</p>
          </div>

          <div className="space-y-8">
            {/* Villa Constructor */}
            <div className="space-y-4">
              <h3 className="font-mono text-xl">new Villa(config)</h3>
              <p className="text-ink-muted text-sm">
                Create a new Villa SDK instance with your app configuration.
              </p>
              <CodeBlock
                code={`import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'your-app',           // Required: your app ID
  network: 'base',             // Optional: 'base' | 'base-sepolia'
  apiUrl: 'https://api.villa.cash',  // Optional: override API
  debug: false                 // Optional: enable debug logs
})`}
                language="typescript"
              />
            </div>

            {/* signIn */}
            <div className="space-y-4">
              <h3 className="font-mono text-xl">villa.signIn()</h3>
              <p className="text-ink-muted text-sm">
                Open auth flow and return user identity. Returns a Promise that resolves to SignInResult.
              </p>
              <CodeBlock
                code={`const result = await villa.signIn({
  scopes: ['profile', 'wallet'],  // What data to request
  onProgress: (step) => {
    console.log(step.message)     // Track auth progress
  },
  timeout: 5 * 60 * 1000          // Max wait time (5 min)
})

if (result.success) {
  console.log('Address:', result.identity.address)
  console.log('Nickname:', result.identity.nickname)
  console.log('Avatar:', result.identity.avatar)
} else {
  console.error('Error:', result.error)
  console.error('Code:', result.code)
}`}
                language="typescript"
              />
            </div>

            {/* Other Methods */}
            <div className="space-y-4">
              <h3 className="font-mono text-xl">Other Methods</h3>
              <CodeBlock
                code={`// Check authentication state
villa.isAuthenticated()       // boolean
villa.getIdentity()           // Identity | null

// Sign out
await villa.signOut()         // Clear session

// Network info
villa.getNetwork()            // 'base' | 'base-sepolia'
villa.getApiUrl()             // API endpoint

// Avatar utilities
villa.getAvatarUrl(seed)      // Generate avatar URL

// ENS resolution
await villa.resolveEns(name)  // name -> address
await villa.reverseEns(addr)  // address -> name`}
                language="typescript"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Type Definitions */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Type Definitions</h2>
            <p className="text-ink-muted">TypeScript types exported by the SDK</p>
          </div>

          <div className="space-y-8">
            {typeReferences.map((type) => (
              <div key={type.name} className="space-y-4">
                <div>
                  <h3 className="font-mono text-xl">{type.name}</h3>
                  <p className="text-ink-muted text-sm mt-1">{type.description}</p>
                </div>
                <CodeBlock code={type.code} language="typescript" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* React Components */}
      <section className="mb-20 bg-ink/[0.02] py-16 -mx-6 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">React Components</h2>
            <p className="text-ink-muted">Pre-built components from @rockfridrich/villa-sdk-react</p>
          </div>

          <div className="space-y-12">
            {componentAPIs.map((component) => (
              <div key={component.name} className="space-y-6">
                <div>
                  <h3 className="font-mono text-xl">{component.name}</h3>
                  <p className="text-ink-muted text-sm mt-1">{component.description}</p>
                </div>

                {/* Props Table */}
                <div className="bg-cream-50 border border-ink/5 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink/5 bg-cream-100">
                        <th className="text-left p-3 font-medium">Prop</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {component.props.map((prop) => (
                        <tr key={prop.name} className="border-b border-ink/5 last:border-0">
                          <td className="p-3 font-mono text-accent-yellow">{prop.name}</td>
                          <td className="p-3 font-mono text-xs">{prop.type}</td>
                          <td className="p-3 text-ink-muted">{prop.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Example */}
                <div className="space-y-2">
                  <h4 className="font-medium">Example</h4>
                  <CodeBlock code={component.example} language="tsx" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced: VillaBridge */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ink/5 rounded-full text-sm font-medium">
              <span>ADVANCED</span>
            </div>
            <h2 className="font-serif text-3xl">VillaBridge</h2>
            <p className="text-ink-muted">
              Low-level API for fine-grained control over the authentication flow.
              Most developers should use the Villa class instead.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Event-Based API</h3>
              <CodeBlock
                code={`import { VillaBridge } from '@rockfridrich/villa-sdk'

const bridge = new VillaBridge({
  appId: 'your-app',
  network: 'base',
  timeout: 5 * 60 * 1000,
  debug: false
})

// Event handlers
bridge.on('ready', () => {
  console.log('Auth UI loaded')
})

bridge.on('success', (identity) => {
  console.log('Authenticated:', identity)
})

bridge.on('cancel', () => {
  console.log('User cancelled')
})

bridge.on('error', (error, code) => {
  console.error('Auth error:', error, code)
})

// Lifecycle
await bridge.open(['profile', 'wallet'])
bridge.close()

// State
bridge.getState()  // State machine
bridge.isOpen()    // boolean`}
                language="typescript"
              />
            </div>

            <div className="bg-cream-100/50 border border-ink/5 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">When to Use VillaBridge</h4>
              <ul className="text-sm text-ink-muted space-y-1">
                <li>• Need granular control over auth lifecycle</li>
                <li>• Building custom UI around auth flow</li>
                <li>• Integrating with complex state management</li>
                <li>• Tracking detailed analytics events</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contract Addresses */}
      <section className="mb-20 bg-ink/[0.02] py-16 -mx-6 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl">Contract Addresses</h2>
            <p className="text-ink-muted">Access deployed smart contract addresses</p>
          </div>

          <div className="space-y-6">
            <div className="bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-4">
              <h3 className="font-medium">Base Sepolia (Testnet)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted">VillaNicknameResolver</span>
                  <code className="font-mono text-xs">0xf4648423aC6b3f6328018c49B2102f4E9bA6D800</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted">BiometricRecoverySigner</span>
                  <code className="font-mono text-xs">0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836</code>
                </div>
              </div>
              <a
                href="https://sepolia.basescan.org/address/0xf4648423aC6b3f6328018c49B2102f4E9bA6D800"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent-yellow hover:underline text-sm"
              >
                View on BaseScan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Import from SDK</h3>
              <CodeBlock
                code={`import { getContracts, getNicknameResolverAddress } from '@rockfridrich/villa-sdk'
import { baseSepolia } from 'viem/chains'

// Get all contracts for a chain
const contracts = getContracts(baseSepolia.id)
if (contracts) {
  console.log('Resolver:', contracts.nicknameResolver.proxy)
  console.log('Recovery:', contracts.recoverySigner.proxy)
}

// Get specific contract address
const resolverAddress = getNicknameResolverAddress(84532)
// Returns: '0xf4648423aC6b3f6328018c49B2102f4E9bA6D800'`}
                language="typescript"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-cream-50 border border-ink/5 rounded-xl p-8 space-y-6">
            <h2 className="font-serif text-2xl text-center">Related Resources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="/"
                className="flex items-center gap-3 p-4 bg-cream-100/50 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm">Full Documentation</h3>
                  <p className="text-xs text-ink-muted">Complete guides and tutorials</p>
                </div>
              </a>
              <a
                href="https://www.npmjs.com/package/@rockfridrich/villa-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-cream-100/50 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <Package className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">npm Package</h3>
                  <p className="text-xs text-ink-muted">View on npm registry</p>
                </div>
                <ExternalLink className="w-4 h-4 text-ink-muted flex-shrink-0" />
              </a>
              <a
                href="https://github.com/rockfridrich/villa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-cream-100/50 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <Code2 className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Source Code</h3>
                  <p className="text-xs text-ink-muted">View on GitHub</p>
                </div>
                <ExternalLink className="w-4 h-4 text-ink-muted flex-shrink-0" />
              </a>
              <a
                href="https://beta.villa.cash/sdk-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-cream-100/50 rounded-lg hover:bg-cream-100 transition-colors"
              >
                <Zap className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Live Demo</h3>
                  <p className="text-xs text-ink-muted">Try it in action</p>
                </div>
                <ExternalLink className="w-4 h-4 text-ink-muted flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
