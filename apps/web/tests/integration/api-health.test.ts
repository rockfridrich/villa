/**
 * Integration tests for API health endpoints
 *
 * Tests the health check endpoints with MSW mocked responses.
 * Verifies API contract and error handling.
 */

import { describe, test, expect } from 'vitest'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('API Health Check', () => {
  test('GET /api/health returns ok status', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      status: 'ok',
      version: '0.1.0',
    })
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
  })

  test('GET /api/health timestamp is valid ISO format', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()

    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
  })

  test('GET /api/health handles service unavailable', async () => {
    // Override handler to simulate error
    server.use(
      http.get('http://localhost:3000/api/health', () => {
        return HttpResponse.json(
          { status: 'error', message: 'Service unavailable' },
          { status: 503 }
        )
      })
    )

    const response = await fetch('http://localhost:3000/api/health')
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('error')
    expect(data.message).toBe('Service unavailable')
  })

  test('GET /api/health handles network error', async () => {
    // Override handler to simulate network error
    server.use(
      http.get('http://localhost:3000/api/health', () => {
        return HttpResponse.error()
      })
    )

    // Network errors throw in fetch
    await expect(fetch('http://localhost:3000/api/health')).rejects.toThrow()
  })
})

describe('API Database Health Check', () => {
  test('GET /api/health/db returns ok status', async () => {
    const response = await fetch('http://localhost:3000/api/health/db')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      status: 'ok',
      database: 'available',
    })
    expect(data.timestamp).toBeDefined()
  })

  test('GET /api/health/db handles database unavailable', async () => {
    // Override handler to simulate database error
    server.use(
      http.get('http://localhost:3000/api/health/db', () => {
        return HttpResponse.json(
          { status: 'error', database: 'unavailable' },
          { status: 503 }
        )
      })
    )

    const response = await fetch('http://localhost:3000/api/health/db')
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('error')
    expect(data.database).toBe('unavailable')
  })
})
