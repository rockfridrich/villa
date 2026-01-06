'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, GitPullRequest, GitCommit, Trophy, Star, Users } from 'lucide-react'

// Security: Sanitize usernames to prevent XSS
// GitHub usernames can only contain alphanumeric characters and hyphens
function sanitizeUsername(username: string): string {
  if (!username) return 'unknown'
  // Only allow GitHub-valid username characters
  return username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39)
}

interface Contributor {
  username: string
  commits: number
  additions: number
  deletions: number
  prsOpened: number
  prsMerged: number
  firstContribution: string
  latestContribution: string
  achievements: string[]
}

interface Stats {
  generated: string
  period: {
    since: string
    until: string
  }
  totals: {
    commits: number
    contributors: number
    additions: number
    deletions: number
  }
  contributors: Contributor[]
  newContributors: string[]
}

const ACHIEVEMENT_DISPLAY: Record<string, { emoji: string; name: string; description: string }> = {
  'first-pr': { emoji: '🎯', name: 'First PR', description: 'Opened first pull request' },
  'first-merge': { emoji: '🚀', name: 'Code Shipped', description: 'First PR merged' },
  'contributor-level-2': { emoji: '⭐', name: 'Active Contributor', description: '10+ commits' },
  'trusted-contributor': { emoji: '💎', name: 'Trusted', description: '50+ commits' },
  'bug-squasher': { emoji: '🐛', name: 'Bug Squasher', description: 'Fixed multiple bugs' },
  'feature-builder': { emoji: '✨', name: 'Feature Builder', description: 'Shipped major feature' },
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function AchievementBadge({ id }: { id: string }) {
  const achievement = ACHIEVEMENT_DISPLAY[id]
  if (!achievement) return null

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-yellow/10 text-accent-yellow rounded-full text-xs"
      title={achievement.description}
    >
      {achievement.emoji} {achievement.name}
    </span>
  )
}

function ContributorCard({ contributor, rank }: { contributor: Contributor; rank: number }) {
  // Security: Sanitize username before display
  const safeUsername = sanitizeUsername(contributor.username)

  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-ink/60">{getRankEmoji(rank)}</div>
          <div>
            <a
              href={`https://github.com/${encodeURIComponent(safeUsername)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-lg hover:text-accent-yellow transition-colors inline-flex items-center gap-1"
            >
              @{safeUsername}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <div className="text-sm text-ink-muted mt-1">
              Contributing since {new Date(contributor.firstContribution).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-ink-muted mb-1">
            <GitCommit className="w-4 h-4" />
            <span className="text-xs">Commits</span>
          </div>
          <div className="text-xl font-bold">{contributor.commits}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-ink-muted mb-1">
            <GitPullRequest className="w-4 h-4" />
            <span className="text-xs">PRs</span>
          </div>
          <div className="text-xl font-bold">{contributor.prsMerged || '-'}</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-ink-muted mb-1">
            <span className="text-xs">Lines</span>
          </div>
          <div className="text-xl font-bold">
            <span className="text-accent-green">+{contributor.additions}</span>
            <span className="text-ink-muted">/</span>
            <span className="text-red-500">-{contributor.deletions}</span>
          </div>
        </div>
      </div>

      {contributor.achievements.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-ink/5">
          {contributor.achievements.map((id) => (
            <AchievementBadge key={id} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof GitCommit; label: string; value: string | number }) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-6 text-center">
      <Icon className="w-8 h-8 mx-auto text-ink-muted mb-2" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
    </div>
  )
}

export default function ContributorsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        // Try to fetch from generated stats file
        const res = await fetch('/api/contributors')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else {
          // Fall back to static placeholder
          setError('Stats not yet generated. Run: pnpm stats:generate')
        }
      } catch {
        setError('Could not load contributor stats')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl tracking-tight">Contributors</h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            The people building Villa. Thank you for making privacy-first authentication a reality.
          </p>
        </div>

        {/* Call to action */}
        <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-8 text-center space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-accent-yellow" />
          <h2 className="font-serif text-2xl">Want to join?</h2>
          <p className="text-ink-muted max-w-md mx-auto">
            We welcome contributors of all skill levels. Start with a good first issue and earn your achievements.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/rockfridrich/villa/labels/good%20first%20issue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
            >
              Find an Issue
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/rockfridrich/villa/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              Read Guide
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full mx-auto" />
            <p className="text-ink-muted mt-4">Loading contributor stats...</p>
          </div>
        )}

        {error && (
          <div className="bg-ink/5 rounded-xl p-8 text-center">
            <p className="text-ink-muted">{error}</p>
            <a
              href="https://github.com/rockfridrich/villa/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent-yellow mt-4"
            >
              View on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {stats && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Contributors" value={stats.totals.contributors} />
              <StatCard icon={GitCommit} label="Commits" value={stats.totals.commits} />
              <StatCard icon={Star} label="Lines Added" value={`+${stats.totals.additions.toLocaleString()}`} />
              <StatCard icon={GitPullRequest} label="Lines Removed" value={`-${stats.totals.deletions.toLocaleString()}`} />
            </div>

            {/* Leaderboard */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-center">Leaderboard</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {stats.contributors.slice(0, 10).map((contributor, i) => (
                  <ContributorCard key={contributor.username} contributor={contributor} rank={i + 1} />
                ))}
              </div>
            </div>

            {/* New contributors */}
            {stats.newContributors.length > 0 && (
              <div className="bg-cream-50 border border-ink/5 rounded-xl p-8 text-center">
                <h3 className="font-serif text-xl mb-4">🆕 New Contributors</h3>
                <p className="text-ink-muted">
                  Welcome {stats.newContributors.map(name => `@${sanitizeUsername(name)}`).join(', ')}!
                </p>
              </div>
            )}

            {/* Achievements legend */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-center">Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ACHIEVEMENT_DISPLAY).map(([id, achievement]) => (
                  <div key={id} className="bg-cream-50 border border-ink/5 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-2xl">{achievement.emoji}</span>
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-xs text-ink-muted">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last updated */}
            <div className="text-center text-sm text-ink-muted">
              Last updated: {new Date(stats.generated).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
