'use client'

import { useState } from 'react'
import { Play, ChevronDown, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

// Pre-built examples
const EXAMPLES = {
  'sign-in': {
    title: 'Sign In User',
    description: 'Basic authentication flow',
    code: `import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'playground-demo',
  network: 'base-sepolia'
})

// Sign in user
const result = await villa.signIn({
  scopes: ['profile', 'wallet']
})

if (result.success) {
  console.log('Welcome!', result.identity.nickname)
  console.log('Address:', result.identity.address)
} else {
  console.error('Error:', result.error)
}`,
  },
  'get-profile': {
    title: 'Get User Profile',
    description: 'Retrieve authenticated user information',
    code: `import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  appId: 'playground-demo'
})

// Check authentication status
if (villa.isAuthenticated()) {
  const identity = villa.getIdentity()

  console.log('Nickname:', identity.nickname)
  console.log('Address:', identity.address)
  console.log('Avatar:', identity.avatar)
} else {
  console.log('Not authenticated')
}`,
  },
  'resolve-ens': {
    title: 'Resolve ENS Name',
    description: 'Look up nickname to address',
    code: `import { Villa } from '@rockfridrich/villa-sdk'

const villa = new Villa({
  network: 'base-sepolia'
})

// Resolve nickname to address
const address = await villa.resolveEns('alice.villa.cash')

if (address) {
  console.log('alice.villa.cash ->', address)
} else {
  console.log('Nickname not found')
}

// Reverse lookup (address to nickname)
const nickname = await villa.reverseEns(
  '0x1234567890123456789012345678901234567890'
)

if (nickname) {
  console.log('Address nickname:', nickname)
}`,
  },
}

type ExampleKey = keyof typeof EXAMPLES

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

export default function PlaygroundPage() {
  const [selectedExample, setSelectedExample] = useState<ExampleKey>('sign-in')
  const [code, setCode] = useState(EXAMPLES['sign-in'].code)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleExampleChange = (key: ExampleKey) => {
    setSelectedExample(key)
    setCode(EXAMPLES[key].code)
    setOutput([])
    setDropdownOpen(false)
  }

  const handleRun = () => {
    setIsRunning(true)
    setOutput([
      '[Playground] Running code in sandbox...',
      '',
      '[Note] This is a demo playground. Real execution requires integration with beta.villa.cash.',
      '',
      'To test live:',
      '1. Install SDK: npm install @rockfridrich/villa-sdk',
      '2. Use beta.villa.cash for authentication',
      '3. Follow the quickstart guide in Documentation',
    ])

    setTimeout(() => {
      setIsRunning(false)
    }, 1000)
  }

  const currentExample = EXAMPLES[selectedExample]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto space-y-4">
          <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">
            Playground
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl">
            Interactive code sandbox to test Villa SDK. Try pre-built examples or write your own code.
          </p>
          <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg p-4 text-sm">
            <strong>Note:</strong> Connect to{' '}
            <a
              href="https://beta.villa.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline"
            >
              beta.villa.cash
            </a>
            {' '}for live testing. This playground demonstrates SDK usage patterns.
          </div>
        </div>
      </section>

      {/* Main Playground */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Example Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-muted mb-2">
              Select Example
            </label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full sm:w-auto min-w-[280px] flex items-center justify-between gap-3 px-4 py-3 bg-cream-50 border border-ink/10 rounded-lg hover:bg-cream-100 transition-colors"
                aria-expanded={dropdownOpen}
              >
                <div className="text-left">
                  <div className="font-medium text-ink">{currentExample.title}</div>
                  <div className="text-xs text-ink-muted">{currentExample.description}</div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-ink-muted transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />

                  {/* Dropdown */}
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-auto min-w-[280px] bg-cream-50 border border-ink/10 rounded-lg shadow-lg z-20">
                    {Object.entries(EXAMPLES).map(([key, example]) => (
                      <button
                        key={key}
                        onClick={() => handleExampleChange(key as ExampleKey)}
                        className={`w-full text-left px-4 py-3 hover:bg-cream-100 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-ink/5 last:border-b-0 ${
                          selectedExample === key ? 'bg-accent-yellow/10' : ''
                        }`}
                      >
                        <div className="font-medium text-ink">{example.title}</div>
                        <div className="text-xs text-ink-muted">{example.description}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Split View */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink-muted">Code Editor</h2>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 bg-accent-yellow text-ink font-medium px-4 py-2 rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <div className="relative group rounded-lg overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                  <CopyButton text={code} />
                </div>
                <div className="bg-ink rounded-lg overflow-hidden border border-ink/20">
                  <SyntaxHighlighter
                    language="typescript"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      backgroundColor: 'transparent',
                      minHeight: '400px',
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>

            {/* Preview/Output */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-ink-muted">Console Output</h2>
              <div className="bg-ink text-cream-100 rounded-lg p-6 font-mono text-sm min-h-[400px] border border-ink/20">
                {output.length === 0 ? (
                  <div className="text-ink-muted">
                    Click &quot;Run Code&quot; to execute the example.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {output.map((line, index) => (
                      <div
                        key={index}
                        className={line.startsWith('[') ? 'text-accent-yellow' : ''}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-4">
            <h3 className="font-medium">Next Steps</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <a
                  href="/"
                  className="text-accent-yellow hover:underline font-medium"
                >
                  Read the Documentation
                </a>
                <p className="text-ink-muted mt-1">
                  Complete SDK reference with examples
                </p>
              </div>
              <div>
                <a
                  href="https://beta.villa.cash/sdk-demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-yellow hover:underline font-medium"
                >
                  Try Live Demo
                </a>
                <p className="text-ink-muted mt-1">
                  See authentication flow in action
                </p>
              </div>
              <div>
                <a
                  href="https://github.com/rockfridrich/villa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-yellow hover:underline font-medium"
                >
                  View Source Code
                </a>
                <p className="text-ink-muted mt-1">
                  Explore SDK implementation on GitHub
                </p>
              </div>
              <div>
                <a
                  href="https://github.com/rockfridrich/villa/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-yellow hover:underline font-medium"
                >
                  Report Issues
                </a>
                <p className="text-ink-muted mt-1">
                  Found a bug? Let us know
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
