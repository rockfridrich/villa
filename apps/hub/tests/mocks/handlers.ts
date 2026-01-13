import { http, HttpResponse } from 'msw'

/**
 * MSW handlers for mocking API routes in integration tests
 *
 * Usage:
 * - Import in tests: `import { handlers } from '@/tests/mocks/handlers'`
 * - Override in tests: `server.use(http.get('/api/health', () => HttpResponse.json({ status: 'error' })))`
 */

// Base URL for API routes (relative paths)
const BASE_URL = 'http://localhost:3000'

export const handlers = [
  // Health check endpoint
  http.get(`${BASE_URL}/api/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    })
  }),

  // Profile creation endpoint
  http.post(`${BASE_URL}/api/profile`, async ({ request }) => {
    const body = await request.json() as { address: string; nickname: string; avatar?: { style: string; selection: string; variant: number } }

    // Validate address format
    if (!body.address || !/^0x[a-fA-F0-9]{40}$/i.test(body.address)) {
      return HttpResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Validate nickname format
    if (!body.nickname || body.nickname.length < 3) {
      return HttpResponse.json(
        { error: 'Nickname must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Mock successful profile creation
    return HttpResponse.json({
      address: body.address.toLowerCase(),
      nickname: body.nickname,
      nicknameNormalized: body.nickname.toLowerCase(),
      avatar: body.avatar || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nicknameChangeCount: 0,
      lastNicknameChange: null,
    }, { status: 201 })
  }),

  // Profile update endpoint (nickname change)
  http.patch(`${BASE_URL}/api/profile`, async ({ request }) => {
    const body = await request.json() as { address: string; newNickname: string }

    // Validate address format
    if (!body.address || !/^0x[a-fA-F0-9]{40}$/i.test(body.address)) {
      return HttpResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Validate nickname format
    if (!body.newNickname || body.newNickname.length < 3) {
      return HttpResponse.json(
        { error: 'Nickname must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Mock successful nickname update
    return HttpResponse.json({
      address: body.address.toLowerCase(),
      nickname: body.newNickname,
      nicknameNormalized: body.newNickname.toLowerCase(),
      avatar: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      nicknameChangeCount: 1,
      lastNicknameChange: new Date().toISOString(),
    })
  }),

  // Get profile by address
  http.get(`${BASE_URL}/api/profile/:address`, ({ params }) => {
    const { address } = params

    // Validate address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address as string)) {
      return HttpResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    // Mock profile not found
    return HttpResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    )
  }),

  // Check nickname availability
  http.get(`${BASE_URL}/api/nicknames/check/:nickname`, ({ params }) => {
    const { nickname } = params

    // Mock nickname availability check
    return HttpResponse.json({
      available: true,
      nickname: nickname as string,
    })
  }),

  // Reverse lookup (address by nickname)
  http.get(`${BASE_URL}/api/nicknames/reverse/:address`, () => {
    // Mock reverse lookup not found
    return HttpResponse.json(
      { error: 'Nickname not found' },
      { status: 404 }
    )
  }),

  // ENS resolution
  http.get(`${BASE_URL}/api/ens/resolve`, ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')

    if (!name) {
      return HttpResponse.json(
        { error: 'Name parameter required' },
        { status: 400 }
      )
    }

    // Mock ENS not found
    return HttpResponse.json(
      { address: null },
      { status: 404 }
    )
  }),

  // Database health check
  http.get(`${BASE_URL}/api/health/db`, () => {
    return HttpResponse.json({
      status: 'ok',
      database: 'available',
      timestamp: new Date().toISOString(),
    })
  }),

  // Database migration endpoint (admin)
  http.post(`${BASE_URL}/api/db/migrate`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Migrations completed',
    })
  }),
]

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers = {
  // Health check returns error
  healthError: http.get(`${BASE_URL}/api/health`, () => {
    return HttpResponse.json(
      { status: 'error', message: 'Service unavailable' },
      { status: 503 }
    )
  }),

  // Profile creation fails (duplicate nickname)
  profileDuplicate: http.post(`${BASE_URL}/api/profile`, () => {
    return HttpResponse.json(
      { error: 'Nickname is already taken' },
      { status: 409 }
    )
  }),

  // Database unavailable
  databaseUnavailable: http.post(`${BASE_URL}/api/profile`, () => {
    return HttpResponse.json(
      { error: 'Database not available', _noDb: true },
      { status: 503 }
    )
  }),

  // Network error (no response)
  networkError: http.get(`${BASE_URL}/api/health`, () => {
    return HttpResponse.error()
  }),
}
