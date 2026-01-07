'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Code2 } from 'lucide-react'
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

interface ExampleCard {
  title: string
  description: string
  icon: string
  code: string
  language?: string
  githubUrl?: string
}

const examples: ExampleCard[] = [
  {
    title: 'Basic Authentication',
    description: 'Complete sign in/out flow with session management',
    icon: '🔐',
    code: `'use client'

import { useState } from 'react'
import { VillaAuth, type VillaAuthResponse } from '@rockfridrich/villa-sdk-react'

export default function BasicAuthExample() {
  const [user, setUser] = useState<VillaAuthResponse | null>(null)

  const handleSignOut = () => {
    // Clear session
    localStorage.removeItem('villa:session')
    setUser(null)
  }

  // Show auth flow
  if (!user?.success) {
    return (
      <VillaAuth
        onComplete={setUser}
        appName="My App"
      />
    )
  }

  // User is authenticated
  return (
    <div>
      <h1>Welcome, @{user.identity.nickname}!</h1>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}`,
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/basic-auth',
  },
  {
    title: 'Profile Management',
    description: 'Read and update user profile information',
    icon: '👤',
    code: `'use client'

import { useState, useEffect } from 'react'
import { Villa } from '@rockfridrich/villa-sdk'

export default function ProfileExample() {
  const [identity, setIdentity] = useState(null)
  const villa = new Villa({ appId: 'my-app', network: 'base' })

  useEffect(() => {
    // Get current identity
    const current = villa.getIdentity()
    if (current) {
      setIdentity(current)
    }
  }, [])

  const refreshProfile = async () => {
    // Re-authenticate to get latest profile
    const result = await villa.signIn()
    if (result.success) {
      setIdentity(result.identity)
    }
  }

  if (!identity) {
    return <p>Not signed in</p>
  }

  return (
    <div>
      <h2>@{identity.nickname}</h2>
      <p>Address: {identity.address}</p>
      <p>Avatar: {identity.avatar.style}</p>
      <button onClick={refreshProfile}>
        Refresh Profile
      </button>
    </div>
  )
}`,
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/profile-management',
  },
  {
    title: 'React Hook Integration',
    description: 'Custom useVilla hook for managing auth state',
    icon: '⚛️',
    code: `// hooks/useVilla.ts
import { useState, useEffect } from 'react'
import { Villa, type Identity } from '@rockfridrich/villa-sdk'

export function useVilla(config: { appId: string; network?: 'base' | 'base-sepolia' }) {
  const [villa] = useState(() => new Villa(config))
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing session
    const current = villa.getIdentity()
    if (current) {
      setIdentity(current)
      setIsAuthenticated(true)
    }
  }, [villa])

  const signIn = async () => {
    const result = await villa.signIn()
    if (result.success) {
      setIdentity(result.identity)
      setIsAuthenticated(true)
      return result
    }
    return result
  }

  const signOut = async () => {
    await villa.signOut()
    setIdentity(null)
    setIsAuthenticated(false)
  }

  return {
    villa,
    identity,
    isAuthenticated,
    signIn,
    signOut,
  }
}

// Usage in component
export default function App() {
  const { identity, isAuthenticated, signIn, signOut } = useVilla({
    appId: 'my-app',
    network: 'base'
  })

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Welcome, @{identity?.nickname}</h1>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signIn}>Sign In with Villa</button>
      )}
    </div>
  )
}`,
    language: 'typescript',
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/react-hook',
  },
  {
    title: 'Iframe Embed',
    description: 'Embed Villa authentication in an iframe',
    icon: '🖼️',
    code: `'use client'

import { VillaBridge } from '@rockfridrich/villa-sdk'
import { useEffect, useRef } from 'react'

export default function IframeEmbedExample() {
  const bridgeRef = useRef<VillaBridge | null>(null)

  useEffect(() => {
    // Initialize bridge
    const bridge = new VillaBridge({
      appId: 'my-app',
      network: 'base',
      debug: true,
    })

    // Listen for auth events
    bridge.on('success', (identity) => {
      console.log('User authenticated:', identity)
      // Handle success: save session, redirect, etc.
    })

    bridge.on('cancel', () => {
      console.log('User cancelled auth')
    })

    bridge.on('error', (error, code) => {
      console.error('Auth error:', error, code)
    })

    bridgeRef.current = bridge

    return () => {
      bridge.close()
    }
  }, [])

  const handleAuth = async () => {
    if (bridgeRef.current) {
      await bridgeRef.current.open(['profile', 'wallet'])
    }
  }

  return (
    <div>
      <button onClick={handleAuth}>
        Authenticate with Villa
      </button>
    </div>
  )
}`,
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/iframe-embed',
  },
  {
    title: 'ENS Resolution',
    description: 'Resolve Villa nicknames to addresses',
    icon: '🔍',
    code: `import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'my-app',
  network: 'base-sepolia'
})

// Resolve nickname to address
async function resolveNickname(nickname: string) {
  const address = await villa.resolveEns(\`\${nickname}.villa.cash\`)
  console.log('Address:', address)
  return address
}

// Reverse resolve address to nickname
async function reverseResolve(address: string) {
  const nickname = await villa.reverseEns(address)
  console.log('Nickname:', nickname)
  return nickname
}

// Example usage
await resolveNickname('alice')
// Returns: 0x1234...

await reverseResolve('0x1234...')
// Returns: alice.villa.cash`,
    language: 'typescript',
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/ens-resolution',
  },
  {
    title: 'Avatar Display',
    description: 'Display user avatars with customization',
    icon: '🎨',
    code: `import { AvatarPreview } from '@rockfridrich/villa-sdk-react'
import { Villa } from '@rockfridrich/villa-sdk'

export default function AvatarExample() {
  const villa = new Villa({ appId: 'my-app' })
  const identity = villa.getIdentity()

  if (!identity) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Using AvatarPreview component */}
      <AvatarPreview
        walletAddress={identity.address}
        selection={identity.avatar.selection}
        variant={identity.avatar.variant}
        size={64}
      />

      {/* Using direct URL */}
      <img
        src={villa.getAvatarUrl(identity.address, {
          style: identity.avatar.style,
          seed: identity.address,
          gender: identity.avatar.gender,
        })}
        alt={\`@\${identity.nickname} avatar\`}
        width={64}
        height={64}
        className="rounded-full"
      />

      {/* Custom sizes */}
      <div className="flex gap-2">
        <AvatarPreview {...identity.avatar} size={32} />
        <AvatarPreview {...identity.avatar} size={48} />
        <AvatarPreview {...identity.avatar} size={64} />
        <AvatarPreview {...identity.avatar} size={96} />
      </div>
    </div>
  )
}`,
    githubUrl: 'https://github.com/rockfridrich/villa/tree/main/examples/avatar-display',
  },
]

export default function ExamplesPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl tracking-tight">Examples</h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            Code snippets and integration patterns to help you build with Villa SDK.
          </p>
        </div>

        {/* Example Cards */}
        <div className="grid gap-8">
          {examples.map((example, index) => (
            <div
              key={index}
              className="bg-cream-50 border border-ink/5 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-ink/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{example.icon}</div>
                    <div>
                      <h2 className="font-serif text-2xl">{example.title}</h2>
                      <p className="text-ink-muted">{example.description}</p>
                    </div>
                  </div>
                </div>
                {example.githubUrl && (
                  <a
                    href={example.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent-yellow hover:underline"
                  >
                    <Code2 className="w-4 h-4" />
                    View on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Code */}
              <div className="p-6">
                <CodeBlock code={example.code} language={example.language} />
              </div>
            </div>
          ))}
        </div>

        {/* Full Documentation CTA */}
        <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-8 text-center space-y-4">
          <h2 className="font-serif text-2xl">Need More Help?</h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            Check out the complete SDK documentation for detailed API reference, component guides, and troubleshooting.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
          >
            Full Documentation
          </a>
        </div>

        {/* Contributing */}
        <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 space-y-4">
          <h2 className="font-serif text-xl">Submit Your Example</h2>
          <p className="text-ink-muted text-sm">
            Have a useful Villa SDK integration pattern? Share it with the community by contributing an example.
          </p>
          <a
            href="https://github.com/rockfridrich/villa/pulls"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent-yellow hover:underline"
          >
            Create Pull Request
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
