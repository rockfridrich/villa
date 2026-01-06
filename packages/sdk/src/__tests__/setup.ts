/**
 * Test setup for @villa/sdk
 *
 * Configures global test environment with mocks for browser APIs.
 */

import { beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

// Mock console.error to avoid noise in tests
globalThis.console.error = vi.fn()
