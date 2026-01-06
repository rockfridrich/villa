'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Zap,
  GitCommit,
  GitPullRequest,
  CheckCircle,
  Clock,
  DollarSign,
  Brain,
  Users,
  AlertCircle,
  Sparkles
} from 'lucide-react'

interface SessionMetrics {
  id: string
  date: string
  branch: string
  commits: number
  corrections: number
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  prsCreated: number
  prsMerged: number
  tasksCompleted: number
  duration: string
  efficiency: number
  tokenEstimate: number
}

interface MetricsData {
  sessions: SessionMetrics[]
  totals: {
    totalCommits: number
    totalPRs: number
    totalTasksCompleted: number
    avgEfficiency: number
    totalTokenEstimate: number
    totalLinesAdded: number
  }
  tokenPricing: {
    inputPer1k: number
    outputPer1k: number
    avgSessionCost: number
  }
  lastUpdated: string
}

// Simple bar chart component
function BarChartSimple({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data, 1)

  return (
    <div className="space-y-2">
      <div className="text-xs text-ink-muted uppercase tracking-wider">{label}</div>
      <div className="flex items-end gap-1 h-20">
        {data.map((value, i) => (
          <div
            key={i}
            className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
            style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
            title={`${value}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink-muted">
        <span>7d ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

// Efficiency gauge
function EfficiencyGauge({ value }: { value: number }) {
  const rotation = (value / 100) * 180 - 90

  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full">
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-ink/10"
        />
        {/* Colored arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${value * 1.26} 126`}
          className={value >= 80 ? 'text-green-500' : value >= 60 ? 'text-accent-yellow' : 'text-red-500'}
        />
        {/* Needle */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink"
          transform={`rotate(${rotation} 50 50)`}
        />
        <circle cx="50" cy="50" r="4" fill="currentColor" className="text-ink" />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

// Stat card
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend
}: {
  icon: typeof BarChart3
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-accent-yellow/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent-yellow" />
        </div>
        {trend && (
          <TrendingUp
            className={`w-4 h-4 ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500 rotate-180' : 'text-ink-muted'
            }`}
          />
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-ink-muted">{label}</div>
        {subtext && <div className="text-xs text-ink-muted mt-1">{subtext}</div>}
      </div>
    </div>
  )
}

// Session row
function SessionRow({ session }: { session: SessionMetrics }) {
  const efficiencyColor =
    session.efficiency >= 80 ? 'text-green-600 bg-green-500/10' :
    session.efficiency >= 60 ? 'text-accent-yellow bg-accent-yellow/10' :
    'text-red-600 bg-red-500/10'

  return (
    <div className="flex items-center gap-4 p-4 bg-cream-50 border border-ink/5 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-24">
        <div className="text-sm font-medium">{session.date}</div>
        <div className="text-xs text-ink-muted">{session.duration}</div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold">{session.commits}</div>
          <div className="text-xs text-ink-muted">commits</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{session.linesAdded.toLocaleString()}</div>
          <div className="text-xs text-ink-muted">lines+</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{session.filesChanged}</div>
          <div className="text-xs text-ink-muted">files</div>
        </div>
        <div>
          <div className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${efficiencyColor}`}>
            {session.efficiency}%
          </div>
          <div className="text-xs text-ink-muted">efficiency</div>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-mono">
          ~{Math.round(session.tokenEstimate / 1000)}k tokens
        </div>
        <div className="text-xs text-ink-muted">
          ~${(session.tokenEstimate / 1000 * 0.045).toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/api/metrics')
        if (res.ok) {
          const metricsData = await res.json()
          setData(metricsData)
        } else {
          setError('Could not load metrics')
        }
      } catch {
        setError('Could not load metrics')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  // Prepare chart data (last 7 days)
  const chartData = data?.sessions.slice(0, 7).reverse() || []
  const commitsChart = chartData.map(s => s.commits)
  const efficiencyChart = chartData.map(s => s.efficiency)
  const tokensChart = chartData.map(s => Math.round(s.tokenEstimate / 1000))

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-yellow/10 text-accent-yellow rounded-full text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Human + AI Collaboration</span>
          </div>

          <h1 className="font-serif text-5xl tracking-tight">
            Development Metrics
          </h1>

          <p className="text-xl text-ink-muted max-w-2xl mx-auto">
            Real-time insights into our human-AI development workflow.
            Every commit, every PR, every token — tracked and optimized.
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full mx-auto" />
            <p className="text-ink-muted mt-4">Loading metrics...</p>
          </div>
        )}

        {error && (
          <div className="bg-ink/5 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-ink-muted mb-4" />
            <p className="text-ink-muted">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Collaboration Model */}
            <div className="bg-gradient-to-br from-ink to-ink/90 text-cream-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-accent-yellow" />
                <h2 className="font-serif text-2xl">The Collaboration Model</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Human</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Sets direction, writes specs, reviews PRs, makes architectural decisions
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Claude Code</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Orchestrates agents, implements features, runs tests, optimizes token usage
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Result</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Full-stack development at unprecedented velocity with transparent cost tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={GitCommit}
                label="Total Commits"
                value={data.totals.totalCommits}
                trend="up"
              />
              <StatCard
                icon={GitPullRequest}
                label="PRs Merged"
                value={data.totals.totalPRs}
                trend="up"
              />
              <StatCard
                icon={BarChart3}
                label="Lines Added"
                value={data.totals.totalLinesAdded.toLocaleString()}
                trend="up"
              />
              <StatCard
                icon={DollarSign}
                label="Estimated Cost"
                value={`$${(data.totals.totalTokenEstimate / 1000 * 0.045).toFixed(2)}`}
                subtext={`~${Math.round(data.totals.totalTokenEstimate / 1000)}k tokens`}
              />
            </div>

            {/* Efficiency & Charts */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Efficiency Gauge */}
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 text-center">
                <h3 className="font-serif text-xl mb-4">Average Efficiency</h3>
                <EfficiencyGauge value={data.totals.avgEfficiency} />
                <p className="text-sm text-ink-muted mt-4">
                  Based on correction commit ratio across all sessions
                </p>
              </div>

              {/* Token Pricing */}
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                <h3 className="font-serif text-xl mb-4">Token Economics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Input tokens (1k)</span>
                    <span className="font-mono">${data.tokenPricing.inputPer1k}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Output tokens (1k)</span>
                    <span className="font-mono">${data.tokenPricing.outputPer1k}</span>
                  </div>
                  <div className="border-t border-ink/10 pt-4 flex justify-between items-center">
                    <span className="font-medium">Avg per session</span>
                    <span className="font-mono text-lg">${data.tokenPricing.avgSessionCost}</span>
                  </div>
                </div>
                <p className="text-xs text-ink-muted mt-4">
                  Based on Claude Opus 4.5 pricing (blended input/output)
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                <BarChartSimple data={commitsChart} label="Commits (7 days)" color="bg-accent-yellow" />
              </div>
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                <BarChartSimple data={efficiencyChart} label="Efficiency % (7 days)" color="bg-green-500" />
              </div>
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                <BarChartSimple data={tokensChart} label="Tokens (k) (7 days)" color="bg-ink/60" />
              </div>
            </div>

            {/* Session History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Session Receipts</h2>
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Clock className="w-4 h-4" />
                  <span>Last {data.sessions.length} sessions</span>
                </div>
              </div>

              <div className="space-y-3">
                {data.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>

              {data.sessions.length === 0 && (
                <div className="text-center py-8 text-ink-muted">
                  No session data yet. Sessions are tracked automatically.
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="text-center text-sm text-ink-muted border-t border-ink/5 pt-8">
              <p>
                Metrics are collected from git history and session reflections.
              </p>
              <p className="mt-2">
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
