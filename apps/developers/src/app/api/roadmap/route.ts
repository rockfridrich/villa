import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Types for Beads issues
interface BeadsIssue {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'closed'
  priority: number
  type?: string
  parent?: string
  description?: string
  created_at?: string
  updated_at?: string
  assignee?: string
  labels?: string[]
}

interface RoadmapResponse {
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

// Security: Sanitize strings to prevent XSS
function sanitizeString(str: string | undefined): string {
  if (!str || typeof str !== 'string') return ''
  // Remove any HTML tags and limit length
  return str.replace(/<[^>]*>/g, '').slice(0, 500)
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60
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

// Parse JSONL file (each line is a JSON object)
function parseJSONL(content: string): BeadsIssue[] {
  const issues: BeadsIssue[] = []
  const lines = content.split('\n').filter(line => line.trim())

  for (const line of lines) {
    try {
      const issue = JSON.parse(line)
      // Only include issues with required fields
      if (issue.id && issue.title) {
        issues.push({
          id: sanitizeString(issue.id),
          title: sanitizeString(issue.title),
          status: ['open', 'in_progress', 'closed'].includes(issue.status)
            ? issue.status
            : 'open',
          priority: typeof issue.priority === 'number' ? issue.priority : 2,
          type: sanitizeString(issue.type),
          parent: sanitizeString(issue.parent),
          description: sanitizeString(issue.description)?.slice(0, 200),
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          labels: Array.isArray(issue.labels)
            ? issue.labels.map(sanitizeString).slice(0, 10)
            : [],
        })
      }
    } catch {
      // Skip malformed lines
    }
  }

  return issues
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
    // Try multiple possible locations for the JSONL file
    const possiblePaths = [
      join(process.cwd(), '.beads', 'issues.jsonl'),
      join(process.cwd(), '..', '..', '.beads', 'issues.jsonl'),
    ]

    let issues: BeadsIssue[] = []
    let foundPath = ''

    for (const beadsPath of possiblePaths) {
      if (existsSync(beadsPath)) {
        const content = readFileSync(beadsPath, 'utf-8')
        issues = parseJSONL(content)
        foundPath = beadsPath
        break
      }
    }

    if (!foundPath) {
      // Return empty roadmap if no issues yet
      return NextResponse.json({
        issues: [],
        epics: [],
        stats: { total: 0, open: 0, inProgress: 0, closed: 0 },
        lastUpdated: new Date().toISOString(),
      } as RoadmapResponse, {
        headers: { 'Cache-Control': 'public, max-age=60' }
      })
    }

    // Separate epics (issues with children) from regular issues
    const parentIds = new Set(issues.filter(i => i.parent).map(i => i.parent))
    const epics = issues.filter(i => parentIds.has(i.id) || i.id.includes('.') === false && issues.some(child => child.parent === i.id))
    const regularIssues = issues.filter(i => !epics.includes(i))

    // Calculate stats
    const stats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      closed: issues.filter(i => i.status === 'closed').length,
    }

    const response: RoadmapResponse = {
      issues: regularIssues,
      epics,
      stats,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=60' }
    })
  } catch (error) {
    console.error('Error reading roadmap:', error)
    return NextResponse.json(
      { error: 'Could not load roadmap' },
      { status: 500 }
    )
  }
}
