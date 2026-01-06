/**
 * Avatar Tests
 *
 * Tests for DiceBear avatar URL generation.
 */

import { describe, test, expect } from 'vitest'
import { getAvatarUrl, createAvatarConfig } from '../avatar'

describe('avatar', () => {
  describe('getAvatarUrl', () => {
    test('generates URL with default style', () => {
      const url = getAvatarUrl('alice')

      expect(url).toBe('https://api.dicebear.com/7.x/adventurer/svg?seed=alice')
    })

    test('generates URL with custom style', () => {
      const url = getAvatarUrl('bob', { style: 'bottts' })

      expect(url).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=bob')
    })

    test('includes gender parameter when provided', () => {
      const url = getAvatarUrl('charlie', { gender: 'male' })

      expect(url).toContain('seed=charlie')
      expect(url).toContain('gender=male')
    })

    test('handles all supported styles', () => {
      const styles = ['adventurer', 'avataaars', 'bottts', 'thumbs'] as const

      styles.forEach((style) => {
        const url = getAvatarUrl('test', { style })
        expect(url).toContain(`/${style}/svg`)
      })
    })

    test('handles empty seed string', () => {
      const url = getAvatarUrl('')

      expect(url).toBe('https://api.dicebear.com/7.x/adventurer/svg?seed=')
    })

    test('URL-encodes special characters in seed', () => {
      const url = getAvatarUrl('alice@example.com')

      expect(url).toContain('seed=alice%40example.com')
    })

    test('handles seeds with spaces', () => {
      const url = getAvatarUrl('alice bob')

      expect(url).toContain('seed=alice+bob')
    })

    test('handles unicode characters in seed', () => {
      const url = getAvatarUrl('アリス')

      expect(url).toContain('seed=')
      // Should be URL-encoded
      expect(decodeURIComponent(url)).toContain('アリス')
    })

    test('includes all gender options', () => {
      const genders = ['male', 'female', 'other'] as const

      genders.forEach((gender) => {
        const url = getAvatarUrl('test', { gender })
        expect(url).toContain(`gender=${gender}`)
      })
    })

    test('does not include gender when undefined', () => {
      const url = getAvatarUrl('test', { style: 'bottts' })

      expect(url).not.toContain('gender=')
    })

    test('handles ethereum addresses as seeds', () => {
      const address = '0x1234567890123456789012345678901234567890'
      const url = getAvatarUrl(address)

      expect(url).toContain(`seed=${address}`)
    })

    test('generates deterministic URLs for same seed', () => {
      const url1 = getAvatarUrl('alice')
      const url2 = getAvatarUrl('alice')

      expect(url1).toBe(url2)
    })

    test('generates different URLs for different seeds', () => {
      const url1 = getAvatarUrl('alice')
      const url2 = getAvatarUrl('bob')

      expect(url1).not.toBe(url2)
    })

    test('combines style and gender', () => {
      const url = getAvatarUrl('test', { style: 'avataaars', gender: 'female' })

      expect(url).toContain('/avataaars/svg')
      expect(url).toContain('gender=female')
      expect(url).toContain('seed=test')
    })
  })

  describe('createAvatarConfig', () => {
    test('creates config with default style', () => {
      const config = createAvatarConfig('alice')

      expect(config).toEqual({
        style: 'adventurer',
        seed: 'alice',
        gender: undefined,
      })
    })

    test('creates config with custom style', () => {
      const config = createAvatarConfig('bob', { style: 'bottts' })

      expect(config).toEqual({
        style: 'bottts',
        seed: 'bob',
        gender: undefined,
      })
    })

    test('creates config with gender', () => {
      const config = createAvatarConfig('charlie', { gender: 'male' })

      expect(config).toEqual({
        style: 'adventurer',
        seed: 'charlie',
        gender: 'male',
      })
    })

    test('creates config with both style and gender', () => {
      const config = createAvatarConfig('diana', {
        style: 'avataaars',
        gender: 'female',
      })

      expect(config).toEqual({
        style: 'avataaars',
        seed: 'diana',
        gender: 'female',
      })
    })

    test('handles empty seed', () => {
      const config = createAvatarConfig('')

      expect(config).toEqual({
        style: 'adventurer',
        seed: '',
        gender: undefined,
      })
    })

    test('preserves seed exactly as provided', () => {
      const seed = '0xABCDEF'
      const config = createAvatarConfig(seed)

      expect(config.seed).toBe(seed)
    })

    test('does not modify partial config object', () => {
      const partial = { style: 'bottts' as const }
      createAvatarConfig('test', partial)

      // Original object should not be mutated
      expect(partial).toEqual({ style: 'bottts' })
    })

    test('returns complete config without partial input', () => {
      const config = createAvatarConfig('test')

      expect(config).toHaveProperty('style')
      expect(config).toHaveProperty('seed')
      expect(config).toHaveProperty('gender')
    })
  })

  describe('integration: config to URL', () => {
    test('config can be used to generate URL', () => {
      const config = createAvatarConfig('alice', {
        style: 'bottts',
        gender: 'female',
      })

      const url = getAvatarUrl(config.seed, {
        style: config.style,
        gender: config.gender,
      })

      expect(url).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=alice&gender=female')
    })

    test('default config generates default URL', () => {
      const config = createAvatarConfig('test')
      const url = getAvatarUrl(config.seed, { style: config.style })

      expect(url).toBe('https://api.dicebear.com/7.x/adventurer/svg?seed=test')
    })
  })
})
