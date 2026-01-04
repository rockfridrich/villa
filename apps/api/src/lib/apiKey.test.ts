import { describe, it, expect } from 'vitest'
import {
  generateApiKey,
  generateAppId,
  isValidApiKey,
  isValidAppId,
  maskApiKey,
} from './apiKey'

describe('API Key Generation', () => {
  it('generates API key with correct format', () => {
    const apiKey = generateApiKey()
    expect(apiKey).toMatch(/^vk_live_[a-f0-9]{64}$/)
    expect(isValidApiKey(apiKey)).toBe(true)
  })

  it('generates unique API keys', () => {
    const key1 = generateApiKey()
    const key2 = generateApiKey()
    expect(key1).not.toBe(key2)
  })

  it('generates API keys with correct length', () => {
    const apiKey = generateApiKey()
    expect(apiKey.length).toBe(72) // vk_live_ (8) + 64 hex chars
  })
})

describe('App ID Generation', () => {
  it('generates app ID with correct format', () => {
    const appId = generateAppId()
    expect(appId).toMatch(/^app_[a-f0-9]{32}$/)
    expect(isValidAppId(appId)).toBe(true)
  })

  it('generates unique app IDs', () => {
    const id1 = generateAppId()
    const id2 = generateAppId()
    expect(id1).not.toBe(id2)
  })

  it('generates app IDs with correct length', () => {
    const appId = generateAppId()
    expect(appId.length).toBe(36) // app_ (4) + 32 hex chars
  })
})

describe('API Key Validation', () => {
  it('validates correct API keys', () => {
    const validKey = 'vk_live_' + 'a'.repeat(64)
    expect(isValidApiKey(validKey)).toBe(true)
  })

  it('rejects API keys without prefix', () => {
    const invalidKey = 'a'.repeat(64)
    expect(isValidApiKey(invalidKey)).toBe(false)
  })

  it('rejects API keys with wrong prefix', () => {
    const invalidKey = 'vk_test_' + 'a'.repeat(64)
    expect(isValidApiKey(invalidKey)).toBe(false)
  })

  it('rejects API keys with wrong length', () => {
    const invalidKey = 'vk_live_' + 'a'.repeat(32)
    expect(isValidApiKey(invalidKey)).toBe(false)
  })

  it('rejects API keys with non-hex characters', () => {
    const invalidKey = 'vk_live_' + 'g'.repeat(64)
    expect(isValidApiKey(invalidKey)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidApiKey('')).toBe(false)
  })

  it('rejects uppercase hex', () => {
    const invalidKey = 'vk_live_' + 'A'.repeat(64)
    expect(isValidApiKey(invalidKey)).toBe(false)
  })
})

describe('App ID Validation', () => {
  it('validates correct app IDs', () => {
    const validId = 'app_' + 'a'.repeat(32)
    expect(isValidAppId(validId)).toBe(true)
  })

  it('rejects app IDs without prefix', () => {
    const invalidId = 'a'.repeat(32)
    expect(isValidAppId(invalidId)).toBe(false)
  })

  it('rejects app IDs with wrong prefix', () => {
    const invalidId = 'application_' + 'a'.repeat(32)
    expect(isValidAppId(invalidId)).toBe(false)
  })

  it('rejects app IDs with wrong length', () => {
    const invalidId = 'app_' + 'a'.repeat(16)
    expect(isValidAppId(invalidId)).toBe(false)
  })

  it('rejects app IDs with non-hex characters', () => {
    const invalidId = 'app_' + 'g'.repeat(32)
    expect(isValidAppId(invalidId)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidAppId('')).toBe(false)
  })
})

describe('API Key Masking', () => {
  it('masks valid API keys', () => {
    const apiKey = 'vk_live_' + 'a'.repeat(56) + 'b'.repeat(8)
    const masked = maskApiKey(apiKey)
    expect(masked).toBe('vk_live_aaaa...bbbb')
  })

  it('returns *** for invalid API keys', () => {
    expect(maskApiKey('invalid')).toBe('***')
  })

  it('returns *** for empty string', () => {
    expect(maskApiKey('')).toBe('***')
  })

  it('preserves prefix and suffix correctly', () => {
    const apiKey = 'vk_live_1234567890abcdef' + 'f'.repeat(48)
    const masked = maskApiKey(apiKey)
    expect(masked).toMatch(/^vk_live_1234\.\.\./)
    expect(masked).toMatch(/\.\.\.ffff$/)
  })
})
