'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  GitCommit,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Brain,
  Users,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react'

/**
 * METRICS PAGE - ONLY VERIFIABLE DATA
 *
 * Shows:
 * 1. Git metrics - directly from git log (100% verifiable)
 * 2. Cost data - ONLY if manually entered in .claude/costs.json
 *
 * NO FAKE DATA. NO ESTIMATES. If we don't have it, we say "No data".
 */

interface SessionMetrics {
  id: string
  date: string
  commits: number
  corrections: number
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  efficiency: number
}

interface CostEntry {
  date: string
  amount: number
  breakdown?: {
    opus?: number
    sonnet?: number
    haiku?: number
    web_search?: number
  }
  source: string
}

interface MetricsData {
  git: {
    sessions: SessionMetrics[]
    totals: {
      totalCommits: number
      totalLinesAdded: number
      avgEfficiency: number
      firstCommit: string
      lastCommit: string
    }
  }
  costs: {
    hasData: boolean
    entries: CostEntry[]
    totalSpent: number
    dailyAverage: number
    byModel: Record<string, number>
    currency: string
    period?: { start: string; end: string; days: number }
    sourceFile?: string
    note: string
  }
  lastUpdated: string
}

// Simple bar chart - showing REAL data only
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
        <span>{data.length}d ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

// Stat card with verification badge
function StatCard({
  icon: Icon,
  label,
  value,
  verified,
  subtext
}: {
  icon: typeof BarChart3
  label: string
  value: string | number
  verified: boolean
  subtext?: string
}) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-accent-yellow/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent-yellow" />
        </div>
        {verified ? (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-ink-muted bg-ink/5 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            No data
          </span>
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

// Session row - git data only
function SessionRow({ session }: { session: SessionMetrics }) {
  const efficiencyColor =
    session.efficiency >= 90 ? 'text-green-600 bg-green-500/10' :
    session.efficiency >= 70 ? 'text-accent-yellow bg-accent-yellow/10' :
    'text-red-600 bg-red-500/10'

  return (
    <div className="flex items-center gap-4 p-4 bg-cream-50 border border-ink/5 rounded-lg">
      <div className="flex-shrink-0 w-24">
        <div className="text-sm font-medium font-mono">{session.date}</div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold">{session.commits}</div>
          <div className="text-xs text-ink-muted">commits</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">+{session.linesAdded.toLocaleString()}</div>
          <div className="text-xs text-ink-muted">lines</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{session.filesChanged}</div>
          <div className="text-xs text-ink-muted">files</div>
        </div>
        <div>
          <div className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${efficiencyColor}`}>
            {session.efficiency}%
          </div>
          <div className="text-xs text-ink-muted">clean</div>
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
  const chartData = data?.git.sessions.slice(0, 7).reverse() || []
  const commitsChart = chartData.map(s => s.commits)
  const linesChart = chartData.map(s => s.linesAdded)

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-yellow/10 text-accent-yellow rounded-full text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Human + Claude Code</span>
          </div>

          <h1 className="font-serif text-5xl tracking-tight">
            Development Metrics
          </h1>

          <p className="text-xl text-ink-muted max-w-2xl mx-auto">
            Transparent tracking of our collaboration.
            Only verified data — no estimates, no guesses.
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
            {/* Data Source Notice */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">Verified Git Data</h3>
                  <p className="text-sm text-green-700 mt-1">
                    All metrics below are extracted directly from git history.
                    Run <code className="bg-green-500/10 px-1.5 py-0.5 rounded text-xs">git log</code> to verify.
                  </p>
                </div>
              </div>
            </div>

            {/* Collaboration Model */}
            <div className="bg-gradient-to-br from-ink to-ink/90 text-cream-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-accent-yellow" />
                <h2 className="font-serif text-2xl">The Model</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Human</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Direction, specs, review, final decisions
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Claude Code</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Implementation, tests, orchestration
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent-yellow" />
                    <span className="font-medium">Output</span>
                  </div>
                  <p className="text-cream-50/70 text-sm">
                    Verifiable commits, tracked costs
                  </p>
                </div>
              </div>
            </div>

            {/* Git Stats - VERIFIED */}
            <div>
              <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
                <GitCommit className="w-6 h-6" />
                Git Activity
                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded ml-2">
                  Verified from git log
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={GitCommit}
                  label="Total Commits"
                  value={data.git.totals.totalCommits}
                  verified={true}
                  subtext={`${data.git.totals.firstCommit} → ${data.git.totals.lastCommit}`}
                />
                <StatCard
                  icon={FileCode}
                  label="Lines Added"
                  value={`+${data.git.totals.totalLinesAdded.toLocaleString()}`}
                  verified={true}
                />
                <StatCard
                  icon={BarChart3}
                  label="Avg Efficiency"
                  value={`${data.git.totals.avgEfficiency}%`}
                  verified={true}
                  subtext="Clean commits (no fixes)"
                />
                <StatCard
                  icon={Clock}
                  label="Active Days"
                  value={data.git.sessions.length}
                  verified={true}
                  subtext="Last 30 days"
                />
              </div>
            </div>

            {/* Charts */}
            {chartData.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                  <BarChartSimple data={commitsChart} label="Commits (last 7 active days)" color="bg-accent-yellow" />
                </div>
                <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                  <BarChartSimple data={linesChart} label="Lines added (last 7 active days)" color="bg-green-500" />
                </div>
              </div>
            )}

            {/* Cost Section */}
            <div>
              <h2 className="font-serif text-2xl mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Cost Tracking
                {data.costs.hasData ? (
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded ml-2">
                    From .claude/costs.json
                  </span>
                ) : (
                  <span className="text-xs bg-ink/5 text-ink-muted px-2 py-0.5 rounded ml-2">
                    No data yet
                  </span>
                )}
              </h2>

              {data.costs.hasData ? (
                <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
                  <div className="text-4xl font-bold mb-2">
                    ${data.costs.totalSpent.toFixed(2)}
                  </div>
                  <div className="text-ink-muted">Total spent ({data.costs.currency})</div>

                  {data.costs.entries.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {data.costs.entries.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-ink/5 last:border-0">
                          <div>
                            <div className="font-mono text-sm">{entry.date}</div>
                            <div className="text-xs text-ink-muted">{entry.source}</div>
                          </div>
                          <div className="font-medium">${entry.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-ink/5 border border-ink/10 rounded-xl p-8 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-ink-muted mb-4" />
                  <h3 className="font-medium mb-2">No Cost Data</h3>
                  <p className="text-ink-muted text-sm max-w-md mx-auto mb-4">
                    To track costs transparently, add your actual spending to{' '}
                    <code className="bg-ink/10 px-1.5 py-0.5 rounded text-xs">.claude/costs.json</code>
                  </p>
                  <p className="text-xs text-ink-muted">
                    Get your usage from{' '}
                    <a
                      href="https://console.anthropic.com/settings/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-yellow hover:underline inline-flex items-center gap-1"
                    >
                      console.anthropic.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Session History */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Daily Activity
              </h2>

              <div className="space-y-2">
                {data.git.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>

              {data.git.sessions.length === 0 && (
                <div className="text-center py-8 text-ink-muted">
                  No git activity in the last 30 days.
                </div>
              )}
            </div>

            {/* Transparency Note */}
            <div className="text-center text-sm text-ink-muted border-t border-ink/5 pt-8 space-y-2">
              <p>
                <strong>No fake numbers.</strong> Git data from <code>git log</code>.
                Cost data only if manually entered.
              </p>
              <p>
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
