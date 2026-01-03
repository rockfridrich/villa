import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useIdentityStore } from '@/lib/store'
import type { Identity } from '@/lib/validation'

describe('useIdentityStore', () => {
  // Clear store and localStorage before each test
  beforeEach(() => {
    useIdentityStore.setState({ identity: null })
    localStorage.clear()
  })

  describe('setIdentity', () => {
    it('sets valid identity', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)

      const stored = useIdentityStore.getState().identity
      expect(stored).toEqual(identity)
      expect(stored?.address).toBe(identity.address)
      expect(stored?.displayName).toBe(identity.displayName)
      expect(stored?.createdAt).toBe(identity.createdAt)
    })

    it('sets identity with avatar', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        avatar: 'https://example.com/avatar.png',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)

      const stored = useIdentityStore.getState().identity
      expect(stored).toEqual(identity)
      expect(stored?.avatar).toBe(identity.avatar)
    })

    it('sanitizes display name when setting identity', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: '<script>alert("xss")</script>Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).not.toContain('<')
      expect(stored?.displayName).not.toContain('>')
      expect(stored?.displayName).toContain('Alice')
    })

    it('rejects invalid identity - bad address format', () => {
      const identity = {
        address: 'not-an-address',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      // Store console.error to verify it was called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      useIdentityStore.getState().setIdentity(identity as Identity)

      const stored = useIdentityStore.getState().identity
      expect(stored).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('rejects invalid identity - missing required fields', () => {
      const identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        // missing createdAt
      }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      useIdentityStore.getState().setIdentity(identity as Identity)

      const stored = useIdentityStore.getState().identity
      expect(stored).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('rejects invalid identity - empty display name', () => {
      const identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: '',
        createdAt: Date.now(),
      }

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      useIdentityStore.getState().setIdentity(identity as Identity)

      const stored = useIdentityStore.getState().identity
      expect(stored).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('overwrites existing identity', () => {
      const identity1: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      const identity2: Identity = {
        address: '0x0987654321098765432109876543210987654321',
        displayName: 'Bob',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity1)
      expect(useIdentityStore.getState().identity?.displayName).toBe('Alice')

      useIdentityStore.getState().setIdentity(identity2)
      expect(useIdentityStore.getState().identity?.displayName).toBe('Bob')
      expect(useIdentityStore.getState().identity?.address).toBe(identity2.address)
    })
  })

  describe('updateProfile', () => {
    beforeEach(() => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }
      useIdentityStore.getState().setIdentity(identity)
    })

    it('updates display name', () => {
      useIdentityStore.getState().updateProfile('Alice Smith')

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).toBe('Alice Smith')
    })

    it('updates display name and avatar', () => {
      useIdentityStore.getState().updateProfile('Alice Smith', 'https://example.com/avatar.png')

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).toBe('Alice Smith')
      expect(stored?.avatar).toBe('https://example.com/avatar.png')
    })

    it('updates only avatar when display name unchanged', () => {
      const originalName = useIdentityStore.getState().identity?.displayName

      useIdentityStore.getState().updateProfile('Alice', 'https://example.com/avatar.png')

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).toBe(originalName)
      expect(stored?.avatar).toBe('https://example.com/avatar.png')
    })

    it('preserves existing avatar when not provided', () => {
      useIdentityStore.getState().updateProfile('Alice', 'https://example.com/avatar1.png')
      useIdentityStore.getState().updateProfile('Alice Smith')

      const stored = useIdentityStore.getState().identity
      expect(stored?.avatar).toBe('https://example.com/avatar1.png')
    })

    it('preserves address and createdAt', () => {
      const original = useIdentityStore.getState().identity

      useIdentityStore.getState().updateProfile('Alice Smith')

      const stored = useIdentityStore.getState().identity
      expect(stored?.address).toBe(original?.address)
      expect(stored?.createdAt).toBe(original?.createdAt)
    })

    it('sanitizes display name on update', () => {
      useIdentityStore.getState().updateProfile('<script>alert("xss")</script>Bob')

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).not.toContain('<')
      expect(stored?.displayName).not.toContain('>')
      expect(stored?.displayName).toContain('Bob')
    })

    it('does nothing when no identity exists', () => {
      useIdentityStore.setState({ identity: null })

      useIdentityStore.getState().updateProfile('Alice')

      const stored = useIdentityStore.getState().identity
      expect(stored).toBeNull()
    })

    it('rejects invalid display name', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const original = useIdentityStore.getState().identity

      useIdentityStore.getState().updateProfile('') // empty string

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).toBe(original?.displayName) // unchanged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('rejects display name that is too long', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const original = useIdentityStore.getState().identity

      useIdentityStore.getState().updateProfile('A'.repeat(51))

      const stored = useIdentityStore.getState().identity
      expect(stored?.displayName).toBe(original?.displayName) // unchanged
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('clearIdentity', () => {
    it('clears identity', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)
      expect(useIdentityStore.getState().identity).not.toBeNull()

      useIdentityStore.getState().clearIdentity()

      expect(useIdentityStore.getState().identity).toBeNull()
    })

    it('is safe to call when no identity exists', () => {
      expect(useIdentityStore.getState().identity).toBeNull()

      useIdentityStore.getState().clearIdentity()

      expect(useIdentityStore.getState().identity).toBeNull()
    })

    it('can set new identity after clearing', () => {
      const identity1: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      const identity2: Identity = {
        address: '0x0987654321098765432109876543210987654321',
        displayName: 'Bob',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity1)
      useIdentityStore.getState().clearIdentity()
      useIdentityStore.getState().setIdentity(identity2)

      expect(useIdentityStore.getState().identity?.displayName).toBe('Bob')
      expect(useIdentityStore.getState().identity?.address).toBe(identity2.address)
    })
  })

  describe('persistence', () => {
    it('persists identity to localStorage', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)

      // Check localStorage
      const stored = localStorage.getItem('villa-identity')
      expect(stored).not.toBeNull()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.identity.displayName).toBe('Alice')
        expect(parsed.state.identity.address).toBe(identity.address)
      }
    })

    it('removes identity from localStorage when cleared', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)
      expect(localStorage.getItem('villa-identity')).not.toBeNull()

      useIdentityStore.getState().clearIdentity()

      const stored = localStorage.getItem('villa-identity')
      expect(stored).not.toBeNull() // key exists but identity is null

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.identity).toBeNull()
      }
    })

    it('persists profile updates', () => {
      const identity: Identity = {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alice',
        createdAt: Date.now(),
      }

      useIdentityStore.getState().setIdentity(identity)
      useIdentityStore.getState().updateProfile('Alice Smith', 'https://example.com/avatar.png')

      const stored = localStorage.getItem('villa-identity')
      expect(stored).not.toBeNull()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.identity.displayName).toBe('Alice Smith')
        expect(parsed.state.identity.avatar).toBe('https://example.com/avatar.png')
      }
    })
  })
})
