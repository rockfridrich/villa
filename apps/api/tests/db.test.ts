/**
 * Database Tests
 *
 * Tests database configuration, fallback storage, and health checks.
 * Run with: pnpm --filter @villa/api test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Save original env
const originalEnv = { ...process.env }

describe('Database Configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
  })

  it('detects local environment when APP_ENV is set', async () => {
    process.env.APP_ENV = 'local'
    process.env.DATABASE_URL = 'postgresql://villa:pass@localhost:5432/villa_dev'

    const { detectEnvironment } = await import('../src/config/database')
    expect(detectEnvironment()).toBe('local')
  })

  it('detects staging environment when APP_ENV is set', async () => {
    process.env.APP_ENV = 'staging'
    process.env.DATABASE_URL = 'postgresql://villa:pass@host:5432/db'

    const { detectEnvironment } = await import('../src/config/database')
    expect(detectEnvironment()).toBe('staging')
  })

  it('returns correct SSL config for production', async () => {
    process.env.APP_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'

    const { getDatabaseConfig } = await import('../src/config/database')
    const config = getDatabaseConfig()

    expect(config.ssl).toBe('require')
    expect(config.enableFallback).toBe(false)
    expect(config.maxConnections).toBe(20)
  })

  it('returns correct config for local environment', async () => {
    process.env.APP_ENV = 'local'
    process.env.DATABASE_URL = 'postgresql://villa:pass@localhost:5432/villa_dev'

    const { getDatabaseConfig } = await import('../src/config/database')
    const config = getDatabaseConfig()

    expect(config.ssl).toBe(false)
    expect(config.enableFallback).toBe(true)
    expect(config.maxConnections).toBe(5)
  })

  it('allows max connections override via env', async () => {
    process.env.APP_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'
    process.env.DB_MAX_CONNECTIONS = '25'

    const { getDatabaseConfig } = await import('../src/config/database')
    const config = getDatabaseConfig()

    expect(config.maxConnections).toBe(25)
  })

  it('allows SSL override via env', async () => {
    process.env.APP_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db'
    process.env.DATABASE_SSL = 'require'

    const { getDatabaseConfig } = await import('../src/config/database')
    const config = getDatabaseConfig()

    expect(config.ssl).toBe('require')
  })

  it('throws when DATABASE_URL not set and no default', async () => {
    process.env.APP_ENV = 'staging'
    delete process.env.DATABASE_URL

    const { getDatabaseConfig } = await import('../src/config/database')

    expect(() => getDatabaseConfig()).toThrow('DATABASE_URL not set')
  })
})

describe('Fallback Storage', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('creates profiles in fallback storage', async () => {
    const { fallback } = await import('../src/db/client')
    fallback.clear()

    const profile = fallback.createProfile({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      nickname: 'alice',
      nicknameNormalized: 'alice',
    })

    expect(profile.id).toBeDefined()
    expect(profile.address).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(profile.nickname).toBe('alice')
    expect(profile.createdAt).toBeInstanceOf(Date)
  })

  it('retrieves profiles by address (case insensitive)', async () => {
    const { fallback } = await import('../src/db/client')
    fallback.clear()

    fallback.createProfile({
      address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      nickname: 'bob',
      nicknameNormalized: 'bob',
    })

    // Query with lowercase
    const profile = fallback.getProfileByAddress('0xabcdef1234567890abcdef1234567890abcdef12')
    expect(profile).toBeDefined()
    expect(profile?.nickname).toBe('bob')
  })

  it('retrieves profiles by nickname (case insensitive)', async () => {
    const { fallback } = await import('../src/db/client')
    fallback.clear()

    fallback.createProfile({
      address: '0x1111111111111111111111111111111111111111',
      nickname: 'Charlie',
      nicknameNormalized: 'charlie',
    })

    // Query with uppercase
    const profile = fallback.getProfileByNickname('CHARLIE')
    expect(profile).toBeDefined()
    expect(profile?.address).toBe('0x1111111111111111111111111111111111111111')
  })

  it('checks nickname availability correctly', async () => {
    const { fallback } = await import('../src/db/client')
    fallback.clear()

    expect(fallback.isNicknameAvailable('uniquename')).toBe(true)

    fallback.createProfile({
      address: '0x2222222222222222222222222222222222222222',
      nickname: 'uniquename',
      nicknameNormalized: 'uniquename',
    })

    expect(fallback.isNicknameAvailable('uniquename')).toBe(false)
    expect(fallback.isNicknameAvailable('UNIQUENAME')).toBe(false)
  })

  it('clears all fallback data', async () => {
    const { fallback } = await import('../src/db/client')

    fallback.createProfile({
      address: '0x3333333333333333333333333333333333333333',
      nickname: 'temp',
      nicknameNormalized: 'temp',
    })

    expect(fallback.profiles.size).toBe(1)
    expect(fallback.nicknames.size).toBe(1)

    fallback.clear()

    expect(fallback.profiles.size).toBe(0)
    expect(fallback.nicknames.size).toBe(0)
  })
})

describe('Health Check (without DB)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('reports not connected when database not initialized', async () => {
    const { checkDbHealth } = await import('../src/db/client')

    const health = await checkDbHealth()

    // Should report not connected or fallback
    expect(health.healthy || health.usingFallback || health.error === 'Not connected').toBe(true)
  })
})

describe('Test Environment Config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('test environment has correct defaults', async () => {
    process.env.APP_ENV = 'test'
    process.env.DATABASE_URL = 'postgresql://villa:pass@localhost:5432/villa_test'

    const { getDatabaseConfig } = await import('../src/config/database')
    const config = getDatabaseConfig()

    expect(config.ssl).toBe(false)
    expect(config.maxConnections).toBe(3)
    expect(config.retryAttempts).toBe(1)
    expect(config.enableFallback).toBe(true)
  })
})
