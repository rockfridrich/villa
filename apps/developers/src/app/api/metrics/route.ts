import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Session metrics from git and beads
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

interface MetricsResponse {
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

// Estimate tokens from git activity
function estimateTokens(commits: number, linesChanged: number): number {
  // Rough estimation: each commit = ~500 tokens context + response
  // Each line changed = ~10 tokens to process
  const basePerCommit = 500
  const perLine = 10
  return commits * basePerCommit + linesChanged * perLine
}

// Get git metrics for date range
function getGitMetrics(since: string, until: string = 'now'): Partial<SessionMetrics> {
  try {
    const cwd = process.cwd()
    const root = existsSync(join(cwd, '..', '..', '.git'))
      ? join(cwd, '..', '..')
      : cwd

    const commits = parseInt(
      execSync(`git -C "${root}" log --oneline --since="${since}" --until="${until}" | wc -l`, { encoding: 'utf-8' }).trim()
    ) || 0

    const corrections = parseInt(
      execSync(`git -C "${root}" log --format='%s' --since="${since}" --until="${until}" | grep -cE '^(fix|revert|oops)' || echo 0`, { encoding: 'utf-8' }).trim()
    ) || 0

    // Get diff stats
    const diffStat = execSync(
      `git -C "${root}" log --numstat --since="${since}" --until="${until}" | awk 'NF==3 {add+=$1; del+=$2} END {print add, del}'`,
      { encoding: 'utf-8' }
    ).trim().split(' ')

    const linesAdded = parseInt(diffStat[0]) || 0
    const linesDeleted = parseInt(diffStat[1]) || 0

    // Get files changed
    const filesChanged = parseInt(
      execSync(`git -C "${root}" log --name-only --format= --since="${since}" --until="${until}" | sort -u | wc -l`, { encoding: 'utf-8' }).trim()
    ) || 0

    return {
      commits,
      corrections,
      filesChanged,
      linesAdded,
      linesDeleted,
      efficiency: commits > 0 ? Math.round((1 - corrections / commits) * 100) : 100,
      tokenEstimate: estimateTokens(commits, linesAdded + linesDeleted)
    }
  } catch {
    return {
      commits: 0,
      corrections: 0,
      filesChanged: 0,
      linesAdded: 0,
      linesDeleted: 0,
      efficiency: 100,
      tokenEstimate: 0
    }
  }
}

// Get session data from reflection files
function getSessionsFromReflections(): SessionMetrics[] {
  const sessions: SessionMetrics[] = []

  try {
    const cwd = process.cwd()
    const reflectionsPath = existsSync(join(cwd, '..', '..', '.claude', 'reflections'))
      ? join(cwd, '..', '..', '.claude', 'reflections')
      : join(cwd, '.claude', 'reflections')

    if (!existsSync(reflectionsPath)) return sessions

    // Read reflection files and extract metrics
    const files = execSync(`ls "${reflectionsPath}"/*.md 2>/dev/null || echo ""`, { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.endsWith('.md') && !f.includes('INDEX'))

    for (const file of files) {
      const content = readFileSync(file, 'utf-8')

      // Extract date from filename (2026-01-06-*.md)
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : 'unknown'

      // Extract metrics from content
      const commitsMatch = content.match(/Commits:\s*(\d+)/i)
      const prsMatch = content.match(/PRs.*?(\d+)/i)
      const efficiencyMatch = content.match(/(\d+)%.*efficiency/i) || content.match(/efficiency.*?(\d+)%/i)
      const durationMatch = content.match(/Duration:\s*([^\n]+)/i)

      const commits = commitsMatch ? parseInt(commitsMatch[1]) : 0
      const gitMetrics = getGitMetrics(`${date} 00:00`, `${date} 23:59`)

      sessions.push({
        id: file.split('/').pop()?.replace('.md', '') || date,
        date,
        branch: 'main',
        commits: commits || gitMetrics.commits || 0,
        corrections: gitMetrics.corrections || 0,
        filesChanged: gitMetrics.filesChanged || 0,
        linesAdded: gitMetrics.linesAdded || 0,
        linesDeleted: gitMetrics.linesDeleted || 0,
        prsCreated: prsMatch ? parseInt(prsMatch[1]) : 0,
        prsMerged: prsMatch ? parseInt(prsMatch[1]) : 0,
        tasksCompleted: 0,
        duration: durationMatch ? durationMatch[1].trim() : '4 hours',
        efficiency: efficiencyMatch ? parseInt(efficiencyMatch[1]) : gitMetrics.efficiency || 85,
        tokenEstimate: gitMetrics.tokenEstimate || 0
      })
    }
  } catch {
    // Return empty if can't read reflections
  }

  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

// Get recent sessions from git log
function getRecentSessions(): SessionMetrics[] {
  const sessions: SessionMetrics[] = []

  // Get last 7 days of activity
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const metrics = getGitMetrics(`${dateStr} 00:00`, `${dateStr} 23:59`)

    if (metrics.commits && metrics.commits > 0) {
      sessions.push({
        id: `session-${dateStr}`,
        date: dateStr,
        branch: 'main',
        commits: metrics.commits || 0,
        corrections: metrics.corrections || 0,
        filesChanged: metrics.filesChanged || 0,
        linesAdded: metrics.linesAdded || 0,
        linesDeleted: metrics.linesDeleted || 0,
        prsCreated: 0,
        prsMerged: 0,
        tasksCompleted: 0,
        duration: 'N/A',
        efficiency: metrics.efficiency || 100,
        tokenEstimate: metrics.tokenEstimate || 0
      })
    }
  }

  return sessions
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
    // Combine reflection-based and git-based sessions
    const reflectionSessions = getSessionsFromReflections()
    const recentSessions = getRecentSessions()

    // Merge and dedupe by date
    const sessionMap = new Map<string, SessionMetrics>()
    for (const session of [...reflectionSessions, ...recentSessions]) {
      if (!sessionMap.has(session.date) || session.efficiency > 0) {
        sessionMap.set(session.date, session)
      }
    }

    const sessions = Array.from(sessionMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30) // Last 30 sessions

    // Calculate totals
    const totals = {
      totalCommits: sessions.reduce((sum, s) => sum + s.commits, 0),
      totalPRs: sessions.reduce((sum, s) => sum + s.prsMerged, 0),
      totalTasksCompleted: sessions.reduce((sum, s) => sum + s.tasksCompleted, 0),
      avgEfficiency: Math.round(
        sessions.reduce((sum, s) => sum + s.efficiency, 0) / Math.max(sessions.length, 1)
      ),
      totalTokenEstimate: sessions.reduce((sum, s) => sum + s.tokenEstimate, 0),
      totalLinesAdded: sessions.reduce((sum, s) => sum + s.linesAdded, 0)
    }

    // Claude pricing (as of 2025)
    const tokenPricing = {
      inputPer1k: 0.015,  // $15/1M input tokens for Opus
      outputPer1k: 0.075, // $75/1M output tokens for Opus
      avgSessionCost: Math.round(totals.totalTokenEstimate / 1000 * 0.045 * 100) / 100 // Blended rate
    }

    const response: MetricsResponse = {
      sessions,
      totals,
      tokenPricing,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=300' } // 5 min cache
    })
  } catch (error) {
    console.error('Error generating metrics:', error)
    return NextResponse.json(
      { error: 'Could not generate metrics' },
      { status: 500 }
    )
  }
}
