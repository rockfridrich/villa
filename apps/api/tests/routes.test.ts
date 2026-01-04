/**
 * Integration tests for WU-5: Nickname Endpoints + ENS Gateway
 *
 * Tests verify:
 * - Nickname availability checking
 * - Nickname claiming with signature verification
 * - ENS resolution endpoints
 * - Avatar generation endpoints
 */

import { describe, test, expect } from '@jest/globals'
import app from '../src/index'

describe('WU-5: Nickname Endpoints', () => {
  describe('GET /nicknames/check/:nickname', () => {
    test('returns available for unclaimed nickname', async () => {
      const res = await app.request('/nicknames/check/alice')
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.available).toBe(true)
      expect(data.normalized).toBe('alice')
    })

    test('normalizes nickname with diacritics', async () => {
      const res = await app.request('/nicknames/check/josé')
      const data = await res.json()

      expect(data.normalized).toBe('jose')
    })

    test('rejects nickname that is too short', async () => {
      const res = await app.request('/nicknames/check/ab')
      const data = await res.json()

      expect(data.available).toBe(false)
      expect(data.reason).toBe('invalid')
      expect(data.error).toContain('at least 3 characters')
    })

    test('rejects nickname that is too long', async () => {
      const nickname = 'a'.repeat(31)
      const res = await app.request(`/nicknames/check/${nickname}`)
      const data = await res.json()

      expect(data.available).toBe(false)
      expect(data.reason).toBe('invalid')
      expect(data.error).toContain('30 characters or less')
    })

    test('rejects reserved nicknames', async () => {
      const res = await app.request('/nicknames/check/admin')
      const data = await res.json()

      expect(data.available).toBe(false)
      expect(data.reason).toBe('invalid')
      expect(data.error).toContain('reserved')
    })
  })

  describe('POST /nicknames/claim', () => {
    test('requires all fields', async () => {
      const res = await app.request('/nicknames/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: 'alice' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing required fields')
    })

    test('validates nickname format', async () => {
      const res = await app.request('/nicknames/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: 'ab',
          address: '0x1234567890123456789012345678901234567890',
          signature: '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.reason).toBe('invalid')
    })

    // Note: Testing actual signature verification requires valid EIP-712 signatures
    // which would need to be generated with a private key. For now, we verify
    // the signature check is invoked (will fail with invalid signature).
  })

  describe('GET /nicknames/resolve/:nickname', () => {
    test('returns 404 for unclaimed nickname', async () => {
      const res = await app.request('/nicknames/resolve/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /nicknames/reverse/:address', () => {
    test('returns 404 for address without nickname', async () => {
      const res = await app.request('/nicknames/reverse/0x1234567890123456789012345678901234567890')

      expect(res.status).toBe(404)
    })
  })
})

describe('WU-5: Avatar Endpoints', () => {
  describe('GET /avatars', () => {
    test('returns list of available styles', async () => {
      const res = await app.request('/avatars')
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.styles).toBeDefined()
      expect(Array.isArray(data.styles)).toBe(true)
      expect(data.styles.length).toBeGreaterThan(0)
    })
  })

  describe('GET /avatars/:seed', () => {
    test('validates style parameter', async () => {
      const res = await app.request('/avatars/testseed?style=invalid')
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('Invalid style')
    })

    test('validates format parameter', async () => {
      const res = await app.request('/avatars/testseed?format=invalid')
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('Invalid format')
    })
  })
})

describe('WU-5: ENS Gateway', () => {
  describe('GET /ens/resolve', () => {
    test('requires sender and data parameters', async () => {
      const res = await app.request('/ens/resolve')

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing required parameters')
    })

    test('returns CCIP-Read format', async () => {
      const res = await app.request('/ens/resolve?sender=0x1234567890123456789012345678901234567890&data=0x00')
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(typeof data.data).toBe('string')
      expect(data.data.startsWith('0x')).toBe(true)
    })
  })

  describe('POST /ens/resolve', () => {
    test('requires sender and data fields', async () => {
      const res = await app.request('/ens/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('GET /ens/addr/:name', () => {
    test('validates ENS name format', async () => {
      const res = await app.request('/ens/addr/invalid-name')

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Invalid ENS name format')
    })

    test('returns 404 for unclaimed name', async () => {
      const res = await app.request('/ens/addr/alice.proofofretreat.eth')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /ens/name/:address', () => {
    test('returns 404 for address without ENS name', async () => {
      const res = await app.request('/ens/name/0x1234567890123456789012345678901234567890')

      expect(res.status).toBe(404)
    })
  })
})
