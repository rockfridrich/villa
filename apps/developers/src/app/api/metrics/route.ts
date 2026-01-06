import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * METRICS API - ONLY VERIFIABLE DATA
 *
 * This API returns ONLY data that can be verified:
 * 1. Git metrics - directly from git log (provable)
 * 2. Cost data - ONLY from .claude/costs.json if manually entered
 *
 * NO ESTIMATES. NO GUESSES. If we don't have real data, we say so.
 */

// Session metrics - ONLY verifiable git data
interface SessionMetrics {
  id: string
  date: string
  commits: number
  corrections: number  // fix/revert commits
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  efficiency: number   // (1 - corrections/commits) * 100
}

// Cost data - MUST be manually entered
interface CostEntry {
  date: string
  amount: number
  description: string
  source: 'manual' | 'invoice' | 'api'
}

interface MetricsResponse {
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
    currency: string
    note: string
  }
  lastUpdated: string
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

// Get REAL git metrics - no estimation
function getGitMetrics(since: string, until: string = 'now'): SessionMetrics | null {
  try {
    const cwd = process.cwd()
    const root = existsSync(join(cwd, '..', '..', '.git'))
      ? join(cwd, '..', '..')
      : cwd

    const commits = parseInt(
      execSync(`git -C "${root}" log --oneline --since="${since}" --until="${until}" 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim()
    ) || 0

    if (commits === 0) return null

    const corrections = parseInt(
      execSync(`git -C "${root}" log --format='%s' --since="${since}" --until="${until}" 2>/dev/null | grep -ciE '^(fix|revert|oops)' || echo 0`, { encoding: 'utf-8' }).trim()
    ) || 0

    // Get diff stats
    const diffStat = execSync(
      `git -C "${root}" log --numstat --since="${since}" --until="${until}" 2>/dev/null | awk 'NF==3 {add+=$1; del+=$2} END {print add, del}'`,
      { encoding: 'utf-8' }
    ).trim().split(' ')

    const linesAdded = parseInt(diffStat[0]) || 0
    const linesDeleted = parseInt(diffStat[1]) || 0

    const filesChanged = parseInt(
      execSync(`git -C "${root}" log --name-only --format= --since="${since}" --until="${until}" 2>/dev/null | sort -u | wc -l`, { encoding: 'utf-8' }).trim()
    ) || 0

    return {
      id: `git-${since}`,
      date: since.split(' ')[0],
      commits,
      corrections,
      filesChanged,
      linesAdded,
      linesDeleted,
      efficiency: commits > 0 ? Math.round((1 - corrections / commits) * 100) : 100
    }
  } catch {
    return null
  }
}

// Get sessions for last N days
function getRecentSessions(days: number): SessionMetrics[] {
  const sessions: SessionMetrics[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const metrics = getGitMetrics(`${dateStr} 00:00`, `${dateStr} 23:59`)
    if (metrics && metrics.commits > 0) {
      sessions.push(metrics)
    }
  }

  return sessions
}

// Load REAL cost data from file (manually entered)
function loadCostData(): { entries: CostEntry[], total: number } {
  try {
    const cwd = process.cwd()
    const costPath = existsSync(join(cwd, '..', '..', '.claude', 'costs.json'))
      ? join(cwd, '..', '..', '.claude', 'costs.json')
      : join(cwd, '.claude', 'costs.json')

    if (!existsSync(costPath)) {
      return { entries: [], total: 0 }
    }

    const data = JSON.parse(readFileSync(costPath, 'utf-8'))
    const entries: CostEntry[] = Array.isArray(data.entries) ? data.entries : []
    const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0)

    return { entries, total }
  } catch {
    return { entries: [], total: 0 }
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Get REAL git data (last 30 days)
    const sessions = getRecentSessions(30)

    // Calculate totals from REAL data
    const totals = {
      totalCommits: sessions.reduce((sum, s) => sum + s.commits, 0),
      totalLinesAdded: sessions.reduce((sum, s) => sum + s.linesAdded, 0),
      avgEfficiency: sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.efficiency, 0) / sessions.length)
        : 0,
      firstCommit: sessions.length > 0 ? sessions[sessions.length - 1].date : 'N/A',
      lastCommit: sessions.length > 0 ? sessions[0].date : 'N/A'
    }

    // Load REAL cost data (only if manually entered)
    const costData = loadCostData()

    const response: MetricsResponse = {
      git: {
        sessions,
        totals
      },
      costs: {
        hasData: costData.entries.length > 0,
        entries: costData.entries,
        totalSpent: costData.total,
        currency: 'USD',
        note: costData.entries.length > 0
          ? 'From manually entered data in .claude/costs.json'
          : 'No cost data. Add entries to .claude/costs.json to track spending.'
      },
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    })
  } catch (error) {
    console.error('Error generating metrics:', error)
    return NextResponse.json(
      { error: 'Could not generate metrics' },
      { status: 500 }
    )
  }
}
