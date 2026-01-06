import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Security: Sanitize username to only allow GitHub-valid characters
function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return 'unknown'
  return username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39)
}

// Rate limiting: Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function GET(request: Request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Try multiple possible locations for the stats file
    const possiblePaths = [
      join(process.cwd(), '.github', 'stats', 'contributors.json'),
      join(process.cwd(), '..', '..', '.github', 'stats', 'contributors.json'),
    ]

    let statsData = null
    for (const statsPath of possiblePaths) {
      if (existsSync(statsPath)) {
        const rawData = readFileSync(statsPath, 'utf-8')
        statsData = JSON.parse(rawData)
        break
      }
    }

    if (!statsData) {
      return NextResponse.json(
        { error: 'Stats not yet generated. Run: pnpm stats:generate' },
        { status: 404 }
      )
    }

    // Security: Sanitize all usernames before serving
    const sanitizedStats = {
      ...statsData,
      contributors: statsData.contributors?.map((c: Record<string, unknown>) => ({
        ...c,
        username: sanitizeUsername(c.username as string)
      })) || [],
      newContributors: statsData.newContributors?.map(sanitizeUsername) || []
    }

    return NextResponse.json(sanitizedStats, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Error reading contributor stats:', error)
    return NextResponse.json(
      { error: 'Could not load contributor stats' },
      { status: 500 }
    )
  }
}
