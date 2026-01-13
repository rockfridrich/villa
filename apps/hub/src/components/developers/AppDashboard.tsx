'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface App {
  id: string
  appId: string
  appName: string
  status: 'active' | 'inactive'
  createdAt: string
  requestCount?: number
}

interface AppDashboardProps {
  apps: App[]
  onRegisterNew: () => void
  onAppClick: (appId: string) => void
}

/**
 * Dashboard showing registered apps
 * Card grid with app details and quick actions
 */
export function AppDashboard({ apps, onRegisterNew, onAppClick }: AppDashboardProps) {
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
            staggerChildren: 0.05,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl mx-auto px-5 py-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-serif text-ink">Your Apps</h1>
          <p className="text-base text-ink-muted mt-2">
            Manage registered applications and credentials
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            size="default"
            variant="primary"
            onClick={onRegisterNew}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Register New App
          </Button>
        </motion.div>
      </div>

      {/* Apps Grid */}
      {apps.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center py-20 bg-cream-100 rounded-lg border border-neutral-100"
        >
          <p className="text-lg text-ink-muted mb-6">
            No apps registered yet
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={onRegisterNew}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Register Your First App
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {apps.map((app) => (
            <motion.div key={app.id} variants={itemVariants}>
              <Card
                className="cursor-pointer hover:shadow transition-shadow duration-150"
                onClick={() => onAppClick(app.appId)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.appName}</CardTitle>
                      <p className="text-sm text-ink-muted mt-1">
                        {app.appId}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'active'
                          ? 'bg-accent-green text-white'
                          : 'bg-neutral-200 text-ink-muted'
                      }`}
                    >
                      {app.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-ink-muted">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="text-ink">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {app.requestCount !== undefined && (
                      <div className="flex justify-between">
                        <span>API Requests</span>
                        <span className="text-ink">
                          {app.requestCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
