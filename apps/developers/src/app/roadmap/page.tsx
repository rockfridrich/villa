'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Circle, CheckCircle, Clock, AlertCircle, Layers } from 'lucide-react'

interface BeadsIssue {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'closed'
  priority: number
  type?: string
  parent?: string
  description?: string
  labels?: string[]
}

interface RoadmapData {
  issues: BeadsIssue[]
  epics: BeadsIssue[]
  stats: {
    total: number
    open: number
    inProgress: number
    closed: number
  }
  lastUpdated: string
}

const PRIORITY_DISPLAY: Record<number, { label: string; color: string }> = {
  0: { label: 'P0', color: 'bg-red-500/10 text-red-600' },
  1: { label: 'P1', color: 'bg-orange-500/10 text-orange-600' },
  2: { label: 'P2', color: 'bg-accent-yellow/10 text-accent-yellow' },
  3: { label: 'P3', color: 'bg-green-500/10 text-green-600' },
  4: { label: 'P4', color: 'bg-ink/10 text-ink-muted' },
}

const STATUS_CONFIG = {
  open: { icon: Circle, label: 'To Do', color: 'border-ink/20' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'border-accent-yellow' },
  closed: { icon: CheckCircle, label: 'Done', color: 'border-green-500' },
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = PRIORITY_DISPLAY[priority] || PRIORITY_DISPLAY[2]
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function IssueCard({ issue }: { issue: BeadsIssue }) {
  const statusConfig = STATUS_CONFIG[issue.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className={`bg-cream-50 border-l-4 ${statusConfig.color} rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className="w-4 h-4 text-ink-muted flex-shrink-0" />
            <code className="text-xs text-ink-muted">{issue.id}</code>
          </div>
          <h4 className="font-medium text-sm leading-tight">{issue.title}</h4>
          {issue.description && (
            <p className="text-xs text-ink-muted mt-1 line-clamp-2">{issue.description}</p>
          )}
        </div>
        <PriorityBadge priority={issue.priority} />
      </div>
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {issue.labels.slice(0, 3).map((label) => (
            <span key={label} className="px-1.5 py-0.5 bg-ink/5 rounded text-xs text-ink-muted">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ title, issues, icon: Icon, accentColor }: {
  title: string
  issues: BeadsIssue[]
  icon: typeof Circle
  accentColor: string
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${accentColor}`}>
        <Icon className="w-5 h-5" />
        <h3 className="font-medium">{title}</h3>
        <span className="ml-auto text-sm text-ink-muted bg-ink/5 px-2 py-0.5 rounded-full">
          {issues.length}
        </span>
      </div>
      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="text-center py-8 text-ink-muted text-sm">
            No tasks
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  )
}

function EpicCard({ epic, childIssues }: { epic: BeadsIssue; childIssues: BeadsIssue[] }) {
  const closed = childIssues.filter(i => i.status === 'closed').length
  const total = childIssues.length
  const progress = total > 0 ? Math.round((closed / total) * 100) : 0

  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-accent-yellow" />
            <code className="text-xs text-ink-muted">{epic.id}</code>
            <PriorityBadge priority={epic.priority} />
          </div>
          <h3 className="font-medium text-lg">{epic.title}</h3>
          {epic.description && (
            <p className="text-sm text-ink-muted mt-1">{epic.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{progress}%</div>
          <div className="text-xs text-ink-muted">{closed}/{total} tasks</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-yellow rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Circle }) {
  return (
    <div className="bg-cream-50 border border-ink/5 rounded-xl p-4 text-center">
      <Icon className="w-6 h-6 mx-auto text-ink-muted mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  )
}

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const res = await fetch('/api/roadmap')
        if (res.ok) {
          const roadmapData = await res.json()
          setData(roadmapData)
        } else {
          setError('Could not load roadmap')
        }
      } catch {
        setError('Could not load roadmap')
      } finally {
        setLoading(false)
      }
    }

    loadRoadmap()
  }, [])

  const openIssues = data?.issues.filter(i => i.status === 'open') || []
  const inProgressIssues = data?.issues.filter(i => i.status === 'in_progress') || []
  const closedIssues = data?.issues.filter(i => i.status === 'closed') || []

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl tracking-tight">Roadmap</h1>
          <p className="text-xl text-ink-muted max-w-xl mx-auto">
            Real-time view of what we&apos;re building. Powered by{' '}
            <a
              href="https://github.com/steveyegge/beads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-yellow hover:underline inline-flex items-center gap-1"
            >
              Beads
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full mx-auto" />
            <p className="text-ink-muted mt-4">Loading roadmap...</p>
          </div>
        )}

        {error && (
          <div className="bg-ink/5 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-ink-muted mb-4" />
            <p className="text-ink-muted">{error}</p>
            <a
              href="https://github.com/rockfridrich/villa/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent-yellow mt-4"
            >
              View Issues on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Layers} label="Total Tasks" value={data.stats.total} />
              <StatCard icon={Circle} label="To Do" value={data.stats.open} />
              <StatCard icon={Clock} label="In Progress" value={data.stats.inProgress} />
              <StatCard icon={CheckCircle} label="Done" value={data.stats.closed} />
            </div>

            {/* Epics */}
            {data.epics.length > 0 && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl text-center">Active Epics</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {data.epics.filter(e => e.status !== 'closed').map((epic) => (
                    <EpicCard
                      key={epic.id}
                      epic={epic}
                      childIssues={data.issues.filter(i => i.parent === epic.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Kanban Board */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-center">Task Board</h2>
              <div className="flex gap-6 overflow-x-auto pb-4">
                <KanbanColumn
                  title="To Do"
                  issues={openIssues}
                  icon={Circle}
                  accentColor="border-ink/30"
                />
                <KanbanColumn
                  title="In Progress"
                  issues={inProgressIssues}
                  icon={Clock}
                  accentColor="border-accent-yellow"
                />
                <KanbanColumn
                  title="Done"
                  issues={closedIssues.slice(0, 10)}
                  icon={CheckCircle}
                  accentColor="border-green-500"
                />
              </div>
            </div>

            {/* Contribute CTA */}
            <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-xl p-8 text-center space-y-4">
              <h2 className="font-serif text-2xl">Want to help?</h2>
              <p className="text-ink-muted max-w-md mx-auto">
                Pick a task from the board and submit a PR. We review quickly!
              </p>
              <a
                href="https://github.com/rockfridrich/villa/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors"
              >
                Contribution Guide
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Last updated */}
            <div className="text-center text-sm text-ink-muted">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
              <span className="mx-2">·</span>
              <span>Read-only view of development progress</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
