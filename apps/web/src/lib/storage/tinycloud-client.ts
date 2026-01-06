'use client'

/**
 * TinyCloud client integration for Villa
 * Provides cross-device storage using TinyCloud's decentralized storage protocol
 *
 * TinyCloud uses SIWE (Sign-In With Ethereum) for authentication.
 * The storage is user-controlled and decentralized.
 */

import { TinyCloudWeb } from '@tinycloudlabs/web-sdk'

// Storage keys
export const STORAGE_KEYS = {
  avatar: 'villa/avatar',
  preferences: 'villa/preferences',
  session: 'villa/session',
} as const

// Types
export interface VillaPreferences {
  theme?: 'light' | 'dark' | 'system'
  reducedMotion?: boolean
  lastUpdated: number
}

export interface VillaSession {
  address: string
  nickname?: string
  lastActive: number
  deviceId: string
}

// Client singleton
let tinyCloudInstance: TinyCloudWeb | null = null
let connectionPromise: Promise<TinyCloudWeb> | null = null

/**
 * Generate a unique device ID for session tracking
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  let deviceId = localStorage.getItem('villa-device-id')
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('villa-device-id', deviceId)
  }
  return deviceId
}

/**
 * Get or create TinyCloud client instance
 * Note: TinyCloud requires SIWE authentication via signIn()
 * For now, we create the instance but storage operations will
 * fail gracefully if not signed in.
 */
export async function getTinyCloud(): Promise<TinyCloudWeb> {
  // Return existing instance if connected
  if (tinyCloudInstance) {
    return tinyCloudInstance
  }

  // Return pending connection if in progress
  if (connectionPromise) {
    return connectionPromise
  }

  // Create new instance (doesn't connect automatically)
  connectionPromise = (async () => {
    try {
      const tc = new TinyCloudWeb()
      // Note: signIn() requires user interaction (wallet signature)
      // We'll attempt to use existing session or fail gracefully
      tinyCloudInstance = tc
      return tc
    } catch (error) {
      connectionPromise = null
      throw error
    }
  })()

  return connectionPromise
}

/**
 * Check if TinyCloud is available and connected
 */
export function isTinyCloudConnected(): boolean {
  return tinyCloudInstance !== null
}

/**
 * Disconnect TinyCloud and clear instance
 */
export function disconnectTinyCloud(): void {
  tinyCloudInstance = null
  connectionPromise = null
}

/**
 * Storage wrapper with localStorage fallback
 */
export class VillaStorage<T> {
  private key: string
  private localKey: string

  constructor(key: string) {
    this.key = key
    this.localKey = `villa-local-${key.replace(/\//g, '-')}`
  }

  /**
   * Save data to TinyCloud with localStorage fallback
   */
  async save(data: T): Promise<void> {
    // Always save to localStorage first (instant, works offline)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.localKey, JSON.stringify(data))
      } catch {
        // localStorage might be full
      }
    }

    // Try TinyCloud for cross-device sync
    try {
      const tc = await getTinyCloud()
      await tc.storage.put(this.key, data)
    } catch (error) {
      // TinyCloud unavailable - localStorage is still saved
      console.warn(`TinyCloud save failed for ${this.key}, using localStorage only:`, error)
    }
  }

  /**
   * Load data from TinyCloud with localStorage fallback
   * TinyCloud data takes precedence (newer) over localStorage
   */
  async load(): Promise<T | null> {
    // Try TinyCloud first for most recent data
    try {
      const tc = await getTinyCloud()
      const result = await tc.storage.get(this.key)
      if (result?.data) {
        // Update localStorage with TinyCloud data
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(this.localKey, JSON.stringify(result.data))
          } catch {
            // Ignore localStorage errors
          }
        }
        return result.data as T
      }
    } catch {
      // TinyCloud unavailable, fall through to localStorage
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(this.localKey)
        if (data) {
          return JSON.parse(data) as T
        }
      } catch {
        // Invalid JSON or localStorage unavailable
      }
    }

    return null
  }

  /**
   * Load from localStorage only (sync, fast)
   */
  loadLocal(): T | null {
    if (typeof window === 'undefined') return null

    try {
      const data = localStorage.getItem(this.localKey)
      if (data) {
        return JSON.parse(data) as T
      }
    } catch {
      // Invalid JSON
    }
    return null
  }

  /**
   * Delete data from both TinyCloud and localStorage
   */
  async delete(): Promise<void> {
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.localKey)
    }

    // Try TinyCloud
    try {
      const tc = await getTinyCloud()
      await tc.storage.delete(this.key)
    } catch {
      // TinyCloud unavailable
    }
  }
}

// Pre-configured storage instances
export const avatarStore = new VillaStorage<{
  type: 'custom'
  dataUrl: string
  hash: string
  uploadedAt: number
}>(STORAGE_KEYS.avatar)

export const preferencesStore = new VillaStorage<VillaPreferences>(STORAGE_KEYS.preferences)

export const sessionStore = new VillaStorage<VillaSession>(STORAGE_KEYS.session)

/**
 * Sync all local data to TinyCloud
 * Call after wallet connection to push offline changes
 */
export async function syncToTinyCloud(): Promise<void> {
  // Sync avatar
  const avatarData = avatarStore.loadLocal()
  if (avatarData) {
    try {
      await avatarStore.save(avatarData)
    } catch {
      // Continue
    }
  }

  // Sync preferences
  const prefsData = preferencesStore.loadLocal()
  if (prefsData) {
    try {
      await preferencesStore.save(prefsData)
    } catch {
      // Continue
    }
  }
}

/**
 * Update session data with current activity
 */
export async function updateSession(address: string, nickname?: string): Promise<void> {
  await sessionStore.save({
    address,
    nickname,
    lastActive: Date.now(),
    deviceId: getDeviceId(),
  })
}
