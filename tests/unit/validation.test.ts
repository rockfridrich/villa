import { describe, it, expect } from 'vitest'
import { displayNameSchema, identitySchema } from '@/lib/validation'

describe('displayNameSchema', () => {
  describe('valid names', () => {
    it('accepts simple names', () => {
      const result = displayNameSchema.safeParse('Alice')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice')
      }
    })

    it('accepts names with spaces', () => {
      const result = displayNameSchema.safeParse('Alice Smith')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice Smith')
      }
    })

    it('accepts names with numbers', () => {
      const result = displayNameSchema.safeParse('Alice123')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice123')
      }
    })

    it('accepts names with special characters', () => {
      // Note: Single quotes are removed by sanitization (XSS prevention)
      const result = displayNameSchema.safeParse("O'Brien-Smith")
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("OBrien-Smith")
      }
    })

    it('accepts unicode characters', () => {
      const result = displayNameSchema.safeParse('陳小明')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('陳小明')
      }
    })

    it('accepts emoji', () => {
      const result = displayNameSchema.safeParse('Alice 👋')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice 👋')
      }
    })

    it('trims whitespace', () => {
      const result = displayNameSchema.safeParse('  Alice  ')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice')
      }
    })

    it('accepts name at max length (50 chars)', () => {
      const longName = 'A'.repeat(50)
      const result = displayNameSchema.safeParse(longName)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(longName)
      }
    })
  })

  describe('invalid names', () => {
    it('rejects empty string', () => {
      const result = displayNameSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required')
      }
    })

    it('rejects whitespace-only string', () => {
      const result = displayNameSchema.safeParse('   ')
      expect(result.success).toBe(false)
      if (!result.success) {
        // After sanitization (trim), empty string fails the refine check
        expect(result.error.issues[0].message).toBe('Name cannot be empty after sanitization')
      }
    })

    it('rejects name longer than 50 characters', () => {
      const tooLong = 'A'.repeat(51)
      const result = displayNameSchema.safeParse(tooLong)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be 50 characters or less')
      }
    })

    it('rejects name way over length limit', () => {
      const tooLong = 'A'.repeat(100)
      const result = displayNameSchema.safeParse(tooLong)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be 50 characters or less')
      }
    })
  })

  describe('XSS prevention', () => {
    it('removes script tags', () => {
      const result = displayNameSchema.safeParse('<script>alert("xss")</script>Alice')
      expect(result.success).toBe(true)
      if (result.success) {
        // Angle brackets and quotes are removed, leaving the text content
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
        expect(result.data).toContain('script')
        expect(result.data).toContain('Alice')
      }
    })

    it('removes angle brackets', () => {
      const result = displayNameSchema.safeParse('<div>Alice</div>')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('divAlice/div')
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
      }
    })

    it('removes onclick event handlers', () => {
      const result = displayNameSchema.safeParse('Alice<img src=x onerror=alert(1)>')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
        expect(result.data).toContain('Alice')
      }
    })

    it('escapes ampersands', () => {
      const result = displayNameSchema.safeParse('Alice & Bob')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Alice &amp; Bob')
      }
    })

    it('handles multiple XSS attempts', () => {
      const result = displayNameSchema.safeParse('<script>alert("xss")</script>&<img src=x>')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
        expect(result.data).toContain('&amp;')
      }
    })

    it('handles javascript: protocol', () => {
      const result = displayNameSchema.safeParse('Alice<a href="javascript:alert(1)">click</a>')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
        expect(result.data).toContain('Alice')
      }
    })
  })

  describe('edge cases', () => {
    it('handles names with only special characters', () => {
      const result = displayNameSchema.safeParse('!@#$%^&*()')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('!@#$%^&amp;*()')
      }
    })

    it('handles names with newlines', () => {
      const result = displayNameSchema.safeParse('Alice\nBob')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain('Alice')
        expect(result.data).toContain('Bob')
      }
    })

    it('handles names with tabs', () => {
      const result = displayNameSchema.safeParse('Alice\tBob')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain('Alice')
        expect(result.data).toContain('Bob')
      }
    })
  })
})

describe('identitySchema', () => {
  const validIdentity = {
    address: '0x1234567890123456789012345678901234567890',
    displayName: 'Alice',
    createdAt: Date.now(),
  }

  describe('valid identities', () => {
    it('accepts valid identity without avatar', () => {
      const result = identitySchema.safeParse(validIdentity)
      expect(result.success).toBe(true)
    })

    it('accepts valid identity with avatar', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        avatar: 'https://example.com/avatar.png',
      })
      expect(result.success).toBe(true)
    })

    it('accepts identity with uppercase address', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        address: '0xABCDEF1234567890123456789012345678901234',
      })
      expect(result.success).toBe(true)
    })

    it('sanitizes display name in identity', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        displayName: '<script>alert("xss")</script>Alice',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.displayName).not.toContain('<')
        expect(result.data.displayName).not.toContain('>')
      }
    })
  })

  describe('invalid identities', () => {
    it('rejects invalid address format', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        address: 'not-an-address',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid address')
      }
    })

    it('rejects address without 0x prefix', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        address: '1234567890123456789012345678901234567890',
      })
      expect(result.success).toBe(false)
    })

    it('rejects short address', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        address: '0x1234',
      })
      expect(result.success).toBe(false)
    })

    it('rejects long address', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        address: '0x12345678901234567890123456789012345678901234',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing displayName', () => {
      const result = identitySchema.safeParse({
        address: validIdentity.address,
        createdAt: validIdentity.createdAt,
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing address', () => {
      const result = identitySchema.safeParse({
        displayName: validIdentity.displayName,
        createdAt: validIdentity.createdAt,
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing createdAt', () => {
      const result = identitySchema.safeParse({
        address: validIdentity.address,
        displayName: validIdentity.displayName,
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid displayName', () => {
      const result = identitySchema.safeParse({
        ...validIdentity,
        displayName: '', // empty string
      })
      expect(result.success).toBe(false)
    })
  })
})
