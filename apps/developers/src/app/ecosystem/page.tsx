'use client'

import { ExternalLink, Code2, FileText, Rocket, Check } from 'lucide-react'

interface App {
  name: string
  url: string
  description: string
  icon: string
  features: string[]
}

const featuredApps: App[] = [
  {
    name: 'Residents',
    url: 'https://residents.proofofretreat.me/',
    description: 'Community directory for Villa ID holders. Discover other residents, view profiles, and connect with the village.',
    icon: '👥',
    features: [
      'Browse all Villa residents',
      'View member profiles and avatars',
      'Search by nickname',
      'Real-time community updates',
    ],
  },
  {
    name: 'Map',
    url: 'https://map.proofofretreat.me/',
    description: 'Interactive village explorer. Navigate the pop-up village space and discover locations tied to Villa IDs.',
    icon: '🗺️',
    features: [
      'Interactive village map',
      'Location discovery',
      'Villa ID integration',
      'Community landmarks',
    ],
  },
]

function AppCard({ app }: { app: App }) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{app.icon}</div>
          <div>
            <h3 className="font-serif text-xl">{app.name}</h3>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              {app.url.replace('https://', '')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <p className="text-ink-muted">{app.description}</p>

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Features</h4>
        <ul className="space-y-1">
          {app.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-ink-muted">
              <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-4 py-2 rounded-lg hover:bg-accent-yellow/90 transition-colors w-full justify-center"
      >
        Visit App
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  )
}

function IntegrationRequirement({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-lg p-4 space-y-2">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-ink-muted">{description}</p>
    </div>
  )
}

export default function EcosystemPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl tracking-tight">Ecosystem</h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            Apps and services built with Villa authentication. One identity, everywhere.
          </p>
        </div>

        {/* Featured Apps */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl">Featured Apps</h2>
            <p className="text-ink-muted">
              Production apps using Villa ID for authentication
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredApps.map((app) => (
              <AppCard key={app.name} app={app} />
            ))}
          </div>
        </section>

        {/* Build with Villa */}
        <section className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <Rocket className="w-12 h-12 mx-auto text-accent-yellow" />
            <h2 className="font-serif text-3xl">Build with Villa</h2>
            <p className="text-ink-muted max-w-xl mx-auto">
              Join the ecosystem. Build apps that share a common identity layer and reach the entire pop-up village network.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              SDK Documentation
            </a>
            <a
              href="https://github.com/rockfridrich/villa/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Contributing Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="border-t border-accent-yellow/20 pt-6">
            <h3 className="font-medium text-center mb-4">Submit Your App</h3>
            <p className="text-sm text-ink-muted text-center max-w-md mx-auto">
              Built something with Villa? We&apos;d love to feature it! Open a PR to add your app to this page.
            </p>
            <div className="text-center mt-4">
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
        </section>

        {/* Integration Requirements */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl">Integration Requirements</h2>
            <p className="text-ink-muted">
              What you need to integrate Villa into your app
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <IntegrationRequirement
              title="Villa SDK"
              description="Install @rockfridrich/villa-sdk or @rockfridrich/villa-sdk-react for authentication. Supports TypeScript and works with all modern frameworks."
            />
            <IntegrationRequirement
              title="Base Network"
              description="Villa IDs are deployed on Base (mainnet) and Base Sepolia (testnet). Smart contracts handle ENS-compatible nickname resolution."
            />
            <IntegrationRequirement
              title="HTTPS Required"
              description="Passkey authentication requires a secure context. Use HTTPS in production and localhost/ngrok for development."
            />
            <IntegrationRequirement
              title="Identity Scopes"
              description="Request only the scopes you need: profile (nickname, avatar) and/or wallet (address). Users consent during authentication."
            />
          </div>

          <div className="bg-cream-50 border border-ink/5 rounded-lg p-6 space-y-4">
            <h3 className="font-medium">Quick Start</h3>
            <pre className="bg-ink text-cream-50 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{`npm install @rockfridrich/villa-sdk viem zod

import { VillaAuth } from '@rockfridrich/villa-sdk-react'

<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      console.log('Welcome,', result.identity.nickname)
    }
  }}
/>`}</code>
            </pre>
            <p className="text-sm text-ink-muted">
              See the{' '}
              <a href="/" className="text-accent-yellow hover:underline">
                full documentation
              </a>{' '}
              for advanced usage and configuration.
            </p>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="bg-cream-50 border border-ink/5 rounded-xl p-8 space-y-4">
          <h2 className="font-serif text-2xl text-center">Privacy & Security</h2>
          <div className="space-y-3 text-ink-muted max-w-2xl mx-auto">
            <p>
              All apps in the Villa ecosystem follow the same privacy-first principles:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span><strong>Passkeys never leave devices.</strong> Private keys stay in hardware-backed storage.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span><strong>User consent required.</strong> Apps must request and receive permission for data access.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span><strong>No passwords, ever.</strong> Biometric authentication via WebAuthn standard.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                <span><strong>ENS-compatible.</strong> Nicknames resolve like ENS names, enabling portable identity.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer links */}
        <div className="text-center text-sm text-ink-muted space-y-2">
          <p>Questions about building in the ecosystem?</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/rockfridrich/villa/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              GitHub Discussions
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>|</span>
            <a
              href="https://github.com/rockfridrich/villa/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              Report Issue
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
