'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

interface AppRegistrationProps {
  developerAddress: string
  onSuccess: (app: { id: string; name: string; apiKey: string }) => void
  onCancel: () => void
}

/**
 * App registration form
 * Collects app details and triggers wallet signature
 */
export function AppRegistration({ developerAddress: _developerAddress, onSuccess, onCancel }: AppRegistrationProps) {
  const [appId, setAppId] = useState('')
  const [appName, setAppName] = useState('')
  const [origins, setOrigins] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate app ID
    if (!/^[a-z0-9-]+$/.test(appId)) {
      setError('App ID must contain only lowercase letters, numbers, and hyphens')
      return
    }

    if (appId.length < 3 || appId.length > 64) {
      setError('App ID must be 3-64 characters')
      return
    }

    // Parse origins
    const allowedOrigins = origins
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0)

    if (allowedOrigins.length === 0) {
      setError('At least one allowed origin is required')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Call API to register app with wallet signature
      // For now, mock the registration
      const mockApiKey = `vk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
      const mockAppId = `app_${Math.random().toString(36).slice(2, 10)}`

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      onSuccess({
        id: mockAppId,
        name: appName || appId,
        apiKey: mockApiKey,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl mx-auto px-5 py-12"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-serif text-ink">Register New App</h1>
        <p className="text-base text-ink-muted mt-2">
          Register your application to get SDK credentials
        </p>
      </motion.div>

      <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          {/* App ID */}
          <div>
            <label htmlFor="appId" className="block text-sm font-medium text-ink mb-2">
              App ID <span className="text-red-500">*</span>
            </label>
            <Input
              id="appId"
              value={appId}
              onChange={(e) => setAppId(e.target.value.toLowerCase())}
              placeholder="my-village-app"
              required
            />
            <p className="text-xs text-ink-muted mt-1">
              Lowercase letters, numbers, and hyphens only. 3-64 characters.
            </p>
          </div>

          {/* App Name */}
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-ink mb-2">
              App Name
            </label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="My Village App"
            />
            <p className="text-xs text-ink-muted mt-1">
              Display name shown to users during consent.
            </p>
          </div>

          {/* Allowed Origins */}
          <div>
            <label htmlFor="origins" className="block text-sm font-medium text-ink mb-2">
              Allowed Origins <span className="text-red-500">*</span>
            </label>
            <textarea
              id="origins"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              placeholder="https://myapp.com&#10;https://staging.myapp.com"
              required
              rows={3}
              className="w-full min-h-11 px-4 py-2 rounded-lg border border-neutral-100 bg-cream-50 text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50 placeholder:text-ink-muted"
            />
            <p className="text-xs text-ink-muted mt-1">
              One origin per line. Must be valid URLs (https required for production).
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your app..."
              rows={3}
              className="w-full min-h-11 px-4 py-2 rounded-lg border border-neutral-100 bg-cream-50 text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50 placeholder:text-ink-muted"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Registering...' : 'Register & Sign'}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <p className="text-sm text-ink-muted text-center">
          You&apos;ll be prompted to sign a message with your connected wallet
        </p>
      </motion.form>
    </motion.div>
  )
}
