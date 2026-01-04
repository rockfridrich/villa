'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Code2, Lock, Zap, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui'

interface DeveloperLandingProps {
  onConnect: () => void
  isConnected?: boolean
}

/**
 * Developer Portal landing page
 * Hero section, features, code snippet, and CTA
 */
export function DeveloperLanding({ onConnect, isConnected }: DeveloperLandingProps) {
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
        <motion.div variants={itemVariants} className="pt-4">
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
