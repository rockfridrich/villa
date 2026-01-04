import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { signMessage, generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import developers from './developers'
import { isValidApiKey, isValidAppId } from '../lib/apiKey'

/**
 * Test suite for developer app registration API
 *
 * Tests cover:
 * - App registration with signature verification
 * - Input validation (name, description, origins)
 * - Rate limiting by wallet
 * - App listing and detail retrieval
 * - Ownership verification
 */

// Test wallet setup
const testPrivateKey = generatePrivateKey()
const testAddress = privateKeyToAddress(testPrivateKey)

async function signTestMessage(message: string): Promise<string> {
  return await signMessage({
    message,
    privateKey: testPrivateKey,
  })
}

describe('POST /developers/apps - App Registration', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/developers', developers)
  })

  it('registers a new app with valid inputs', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        description: 'A test application',
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(200)

    const data = await response.json() as any
    expect(data.id).toMatch(/^app_[a-f0-9]{32}$/)
    expect(data.name).toBe('Test App')
    expect(data.description).toBe('A test application')
    expect(data.apiKey).toMatch(/^vk_live_[a-f0-9]{64}$/)
    expect(data.allowedOrigins).toEqual(['https://example.com'])
    expect(data.rateLimit).toBe(100)
    expect(data.createdAt).toBeDefined()

    // Validate generated keys
    expect(isValidApiKey(data.apiKey)).toBe(true)
    expect(isValidAppId(data.id)).toBe(true)
  })

  it('rejects registration without signature', async () => {
    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com'],
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('Missing required fields')
  })

  it('rejects registration with invalid signature', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com'],
        message,
        signature: '0x' + '0'.repeat(130), // Invalid signature
        address: testAddress,
      }),
    })

    expect(response.status).toBe(401)
    const data = await response.json() as any
    expect(data.error).toBe('Invalid signature')
  })

  it('rejects app name that is too short', async () => {
    const message = `Register app: AB\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AB',
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toContain('at least 3 characters')
    expect(data.field).toBe('name')
  })

  it('rejects app name that is too long', async () => {
    const longName = 'A'.repeat(101)
    const message = `Register app: ${longName}\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: longName,
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toContain('100 characters or less')
    expect(data.field).toBe('name')
  })

  it('rejects app name with invalid characters', async () => {
    const message = `Register app: Test@App!\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test@App!',
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toContain('letters, numbers, spaces, hyphens, and underscores')
    expect(data.field).toBe('name')
  })

  it('rejects description that is too long', async () => {
    const longDesc = 'A'.repeat(501)
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        description: longDesc,
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toContain('500 characters or less')
    expect(data.field).toBe('description')
  })

  it('rejects empty origins array', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: [],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('At least one origin is required')
    expect(data.field).toBe('allowedOrigins')
  })

  it('rejects HTTP origins (except localhost)', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['http://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('HTTP only allowed for localhost')
    expect(data.field).toBe('allowedOrigins')
  })

  it('accepts localhost HTTP origins', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['http://localhost:3000'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json() as any
    expect(data.allowedOrigins).toContain('http://localhost:3000')
  })

  it('rejects wildcard origins', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://*.example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('Wildcards not allowed in origin')
    expect(data.field).toBe('allowedOrigins')
  })

  it('rejects origins with paths', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com/path'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toContain('protocol + domain only')
    expect(data.field).toBe('allowedOrigins')
  })

  it('rejects too many origins', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const manyOrigins = Array.from({ length: 11 }, (_, i) => `https://example${i}.com`)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: manyOrigins,
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('Maximum 10 origins allowed')
    expect(data.field).toBe('allowedOrigins')
  })

  it('rejects duplicate origins', async () => {
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com', 'https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('Duplicate origins not allowed')
    expect(data.field).toBe('allowedOrigins')
  })
})

describe('GET /developers/apps - List Apps', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/developers', developers)
  })

  it('requires authentication', async () => {
    const response = await app.request('/developers/apps', {
      method: 'GET',
    })

    expect(response.status).toBe(400)
  })

  it('lists apps for authenticated wallet', async () => {
    // First register an app
    const registerMessage = `Register app: Test App\nTimestamp: ${Date.now()}`
    const registerSignature = await signTestMessage(registerMessage)

    await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com'],
        message: registerMessage,
        signature: registerSignature,
        address: testAddress,
      }),
    })

    // Then list apps
    const listMessage = `List apps\nTimestamp: ${Date.now()}`
    const listSignature = await signTestMessage(listMessage)

    const response = await app.request('/developers/apps', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: listMessage,
        signature: listSignature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(200)

    const data = await response.json() as any
    expect(data.apps).toBeInstanceOf(Array)
    expect(data.apps.length).toBeGreaterThan(0)
    expect(data.total).toBe(data.apps.length)

    const firstApp = data.apps[0]
    expect(firstApp.id).toMatch(/^app_[a-f0-9]{32}$/)
    expect(firstApp.name).toBe('Test App')
    // API key should be masked in list
    expect(firstApp.apiKey).toMatch(/^vk_live_[a-f0-9]{4}\.\.\./)
  })
})

describe('GET /developers/apps/:id - Get App Details', () => {
  let app: Hono
  let registeredAppId: string

  beforeEach(async () => {
    app = new Hono()
    app.route('/developers', developers)

    // Register an app
    const message = `Register app: Test App\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test App',
        allowedOrigins: ['https://example.com'],
        message,
        signature,
        address: testAddress,
      }),
    })

    const data = await response.json() as any
    registeredAppId = data.id
  })

  it('returns full app details for owner', async () => {
    const message = `Get app\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request(`/developers/apps/${registeredAppId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(200)

    const data = await response.json() as any
    expect(data.id).toBe(registeredAppId)
    expect(data.name).toBe('Test App')
    // Full API key should be shown for owner
    expect(data.apiKey).toMatch(/^vk_live_[a-f0-9]{64}$/)
    expect(isValidApiKey(data.apiKey)).toBe(true)
  })

  it('rejects access by non-owner', async () => {
    const otherPrivateKey = generatePrivateKey()
    const otherAddress = privateKeyToAddress(otherPrivateKey)

    const message = `Get app\nTimestamp: ${Date.now()}`
    const signature = await signMessage({
      message,
      privateKey: otherPrivateKey,
    })

    const response = await app.request(`/developers/apps/${registeredAppId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address: otherAddress,
      }),
    })

    expect(response.status).toBe(403)
    const data = await response.json() as any
    expect(data.error).toBe('Forbidden')
  })

  it('returns 404 for non-existent app', async () => {
    const message = `Get app\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps/app_nonexistent123', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(404)
    const data = await response.json() as any
    expect(data.error).toBe('App not found')
  })

  it('rejects invalid app ID format', async () => {
    const message = `Get app\nTimestamp: ${Date.now()}`
    const signature = await signTestMessage(message)

    const response = await app.request('/developers/apps/invalid-id', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature,
        address: testAddress,
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json() as any
    expect(data.error).toBe('Invalid app ID format')
  })
})
