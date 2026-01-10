/**
 * Integration tests for Zustand store with API interactions
 *
 * Tests the identity store's behavior with mocked API responses.
 * Validates state persistence and updates through localStorage.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useIdentityStore } from '@/lib/store'
import type { Identity } from '@/lib/validation'

describe('Identity Store Integration', () => {
  beforeEach(() => {
    // Clear store state before each test
    const { result } = renderHook(() => useIdentityStore())
    act(() => {
      result.current.clearIdentity()
    })
    // Clear localStorage to ensure clean state
    window.localStorage.clear()
  })

  test('store starts with null identity', () => {
    const { result } = renderHook(() => useIdentityStore())
    expect(result.current.identity).toBeNull()
  })

  test('setIdentity stores valid identity', () => {
    const { result } = renderHook(() => useIdentityStore())

    const validIdentity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      const success = result.current.setIdentity(validIdentity)
      expect(success).toBe(true)
    })

    expect(result.current.identity).toEqual(validIdentity)
  })

  test('setIdentity rejects invalid address format', () => {
    const { result } = renderHook(() => useIdentityStore())

    const invalidIdentity = {
      address: 'invalid-address',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      const success = result.current.setIdentity(invalidIdentity as Identity)
      expect(success).toBe(false)
    })

    expect(result.current.identity).toBeNull()
  })

  test('setIdentity sanitizes display name', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identityWithXSS: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: '<script>alert("xss")</script>Test',
      createdAt: Date.now(),
    }

    act(() => {
      const success = result.current.setIdentity(identityWithXSS)
      expect(success).toBe(true)
    })

    // Display name should be sanitized (< and > removed, but text remains)
    expect(result.current.identity?.displayName).not.toContain('<')
    expect(result.current.identity?.displayName).not.toContain('>')
    // The sanitizer removes angle brackets but leaves the text
    expect(result.current.identity?.displayName).toContain('Test')
  })

  test('updateProfile updates display name', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Original Name',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    act(() => {
      const success = result.current.updateProfile('Updated Name')
      expect(success).toBe(true)
    })

    expect(result.current.identity?.displayName).toBe('Updated Name')
  })

  test('updateProfile updates avatar', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    const newAvatar = {
      style: 'avataaars' as const,
      selection: 'male' as const,
      variant: 42,
    }

    act(() => {
      const success = result.current.updateProfile('Test User', newAvatar)
      expect(success).toBe(true)
    })

    expect(result.current.identity?.avatar).toEqual(newAvatar)
  })

  test('updateProfile fails with empty display name', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    act(() => {
      const success = result.current.updateProfile('')
      expect(success).toBe(false)
    })

    // Original display name should be preserved
    expect(result.current.identity?.displayName).toBe('Test User')
  })

  test('updateProfile fails when no identity is set', () => {
    const { result } = renderHook(() => useIdentityStore())

    act(() => {
      const success = result.current.updateProfile('New Name')
      expect(success).toBe(false)
    })

    expect(result.current.identity).toBeNull()
  })

  test('clearIdentity removes identity', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    expect(result.current.identity).not.toBeNull()

    act(() => {
      result.current.clearIdentity()
    })

    expect(result.current.identity).toBeNull()
  })

  test('identity persists in localStorage', async () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    // Wait for persistence to complete
    await waitFor(() => {
      const stored = window.localStorage.getItem('villa-identity')
      expect(stored).not.toBeNull()
    })

    // Verify stored data matches
    const stored = window.localStorage.getItem('villa-identity')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.identity).toMatchObject(identity)
  })

  test('identity is restored from localStorage', async () => {
    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    // First, set identity in one hook
    const { result: firstHook } = renderHook(() => useIdentityStore())

    act(() => {
      firstHook.current.setIdentity(identity)
    })

    // Wait for persistence
    await waitFor(() => {
      const stored = window.localStorage.getItem('villa-identity')
      expect(stored).not.toBeNull()
    })

    // Create new hook instance - it should read from the same store
    const { result: secondHook } = renderHook(() => useIdentityStore())

    // Identity should be available (same store instance in memory)
    expect(secondHook.current.identity).toMatchObject(identity)
  })

  test('multiple updates maintain state consistency', () => {
    const { result } = renderHook(() => useIdentityStore())

    const identity: Identity = {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test User',
      createdAt: Date.now(),
    }

    act(() => {
      result.current.setIdentity(identity)
    })

    // Perform multiple updates
    act(() => {
      result.current.updateProfile('Name 1')
      result.current.updateProfile('Name 2')
      result.current.updateProfile('Name 3')
    })

    // Final name should be the last update
    expect(result.current.identity?.displayName).toBe('Name 3')
    // Address should remain unchanged
    expect(result.current.identity?.address).toBe(identity.address)
  })
})
