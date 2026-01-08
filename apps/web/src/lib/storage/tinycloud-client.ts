'use client'

/**
 * TinyCloud client integration for Villa
 * Provides cross-device storage using TinyCloud's decentralized storage protocol
 *
 * TinyCloud uses SIWE (Sign-In With Ethereum) for authentication.
 * The storage is user-controlled and decentralized.
 */

import { signMessageHeadless } from '@/lib/porto'

// TinyCloud SDK is dynamically imported to avoid SSR issues with HTMLElement
type TinyCloudWeb = {
  generateSiweMessage: (address: string, options: { statement: string }) => Promise<{
    prepareMessage: () => string
  }>
  signInWithSignature: (message: { prepareMessage: () => string }, signature: string) => Promise<void>
  storage: {
    put: (key: string, data: unknown) => Promise<void>
    get: (key: string) => Promise<{ data: unknown } | null>
    delete: (key: string) => Promise<void>
  }
}

// Storage keys
export const STORAGE_KEYS = {
  avatar: 'villa/avatar',
  preferences: 'villa/preferences',
  session: 'villa/session',
  recentApps: 'villa/recent-apps',
  tippingHistory: 'villa/tipping-history',
} as const

// TinyCloud authentication state
let tinyCloudAuthenticated = false
let currentAuthAddress: string | null = null

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

/**
 * Recent app tracking for ecosystem navigation
 */
export interface RecentApp {
  appId: string          // Unique identifier (e.g., 'residents', 'map')
  name: string           // Display name
  url: string            // App URL
  iconUrl?: string       // Optional icon
  lastUsed: number       // Timestamp
  usageCount: number     // Total visits
}

export interface RecentAppsData {
  apps: RecentApp[]
  lastSynced: number
}

/**
 * Tip transaction record for tipping history
 */
export interface TipRecord {
  id: string
  fromNickname: string
  fromAddress: string
  toNickname: string
  toAddress: string
  amount: string
  timestamp: number
  txHash?: string
}

export interface TippingHistoryData {
  tips: TipRecord[]
  lastSynced: number
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
 */
export async function getTinyCloud(): Promise<TinyCloudWeb> {
  // Prevent SSR execution
  if (typeof window === 'undefined') {
    throw new Error('TinyCloud can only be used in browser environment')
  }

  // Return existing instance if connected
  if (tinyCloudInstance) {
    return tinyCloudInstance
  }

  // Return pending connection if in progress
  if (connectionPromise) {
    return connectionPromise
  }

  // Create new instance with dynamic import to avoid SSR issues
  connectionPromise = (async () => {
    try {
      // Dynamic import to avoid SSR HTMLElement error
      const { TinyCloudWeb: TinyCloudClass } = await import('@tinycloudlabs/web-sdk')
      const tc = new TinyCloudClass() as unknown as TinyCloudWeb
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
 * Authenticate TinyCloud with a user's address using SIWE
 * Must be called after Porto authentication to enable cross-device storage
 * @param address The user's Ethereum address from Porto
 */
export async function authenticateTinyCloud(address: string): Promise<boolean> {
  // Already authenticated for this address
  if (tinyCloudAuthenticated && currentAuthAddress === address) {
    return true
  }

  try {
    const tc = await getTinyCloud()

    // Generate SIWE message using TinyCloud's method
    const siweMessage = await tc.generateSiweMessage(address, {
      statement: 'Sign in to Villa Storage for cross-device sync',
    })

    // Sign the message using Porto relay mode (no UI prompt)
    // This works in background because relay mode doesn't show dialogs
    const messageToSign = siweMessage.prepareMessage()
    const signature = await signMessageHeadless(messageToSign, address)

    // Authenticate with TinyCloud using the signed message
    await tc.signInWithSignature(siweMessage, signature)

    tinyCloudAuthenticated = true
    currentAuthAddress = address
    return true
  } catch (error) {
    // Detailed error logging for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.warn('TinyCloud authentication failed:', {
      message: errorMessage,
      stack: errorStack,
      address: address.slice(0, 10) + '...', // Truncate for privacy
      step: 'authenticateTinyCloud',
    })
    tinyCloudAuthenticated = false
    currentAuthAddress = null
    return false
  }
}

/**
 * Check if TinyCloud is available and authenticated
 */
export function isTinyCloudConnected(): boolean {
  return tinyCloudInstance !== null && tinyCloudAuthenticated
}

/**
 * Check if TinyCloud is authenticated for a specific address
 */
export function isTinyCloudAuthenticatedFor(address: string): boolean {
  return tinyCloudAuthenticated && currentAuthAddress?.toLowerCase() === address.toLowerCase()
}

/**
 * Disconnect TinyCloud and clear instance
 */
export function disconnectTinyCloud(): void {
  tinyCloudInstance = null
  connectionPromise = null
  tinyCloudAuthenticated = false
  currentAuthAddress = null
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

    // Only try TinyCloud if authenticated
    if (!isTinyCloudConnected()) {
      return
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
    // Try TinyCloud first for most recent data (only if authenticated)
    if (isTinyCloudConnected()) {
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

    // Try TinyCloud (only if authenticated)
    if (isTinyCloudConnected()) {
      try {
        const tc = await getTinyCloud()
        await tc.storage.delete(this.key)
      } catch {
        // TinyCloud unavailable
      }
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

export const recentAppsStore = new VillaStorage<RecentAppsData>(STORAGE_KEYS.recentApps)

export const tippingHistoryStore = new VillaStorage<TippingHistoryData>(STORAGE_KEYS.tippingHistory)

/**
 * Sync all local data to TinyCloud
 * Call after TinyCloud authentication to push offline changes
 * @returns true if sync was attempted (TinyCloud is connected)
 */
export async function syncToTinyCloud(): Promise<boolean> {
  // Don't attempt sync if not authenticated
  if (!isTinyCloudConnected()) {
    return false
  }

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

  // Sync recent apps
  const recentAppsData = recentAppsStore.loadLocal()
  if (recentAppsData) {
    try {
      await recentAppsStore.save(recentAppsData)
    } catch {
      // Continue
    }
  }

  // Sync tipping history
  const tippingData = tippingHistoryStore.loadLocal()
  if (tippingData) {
    try {
      await tippingHistoryStore.save(tippingData)
    } catch {
      // Continue
    }
  }

  return true
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

/**
 * Track app usage for Recent Apps feature
 * @param app The app being visited
 */
export async function trackAppUsage(app: Omit<RecentApp, 'lastUsed' | 'usageCount'>): Promise<void> {
  const MAX_RECENT_APPS = 10

  // Load current data
  let data = await recentAppsStore.load()
  if (!data) {
    data = { apps: [], lastSynced: Date.now() }
  }

  // Find existing app entry
  const existingIndex = data.apps.findIndex(a => a.appId === app.appId)

  if (existingIndex >= 0) {
    // Update existing
    const existing = data.apps[existingIndex]
    data.apps.splice(existingIndex, 1) // Remove from current position
    data.apps.unshift({
      ...existing,
      ...app, // Update with any new info
      lastUsed: Date.now(),
      usageCount: existing.usageCount + 1,
    })
  } else {
    // Add new app
    data.apps.unshift({
      ...app,
      lastUsed: Date.now(),
      usageCount: 1,
    })
  }

  // Keep only most recent
  if (data.apps.length > MAX_RECENT_APPS) {
    data.apps = data.apps.slice(0, MAX_RECENT_APPS)
  }

  data.lastSynced = Date.now()

  // Save
  await recentAppsStore.save(data)
}

/**
 * Get recent apps for display
 */
export async function getRecentApps(): Promise<RecentApp[]> {
  const data = await recentAppsStore.load()
  return data?.apps || []
}

/**
 * Add a tip to the history
 * Always writes to localStorage, syncs to TinyCloud if connected
 * @param tip The tip record to add
 */
export async function addTipToHistory(tip: TipRecord): Promise<void> {
  const MAX_TIPS = 50

  // Load current data
  let data = await tippingHistoryStore.load()
  if (!data) {
    data = { tips: [], lastSynced: Date.now() }
  }

  // Add new tip at the beginning
  data.tips.unshift(tip)

  // Keep only most recent
  if (data.tips.length > MAX_TIPS) {
    data.tips = data.tips.slice(0, MAX_TIPS)
  }

  data.lastSynced = Date.now()

  // Save (writes to localStorage always, TinyCloud if connected)
  await tippingHistoryStore.save(data)
}

/**
 * Get tipping history
 */
export async function getTippingHistory(): Promise<TipRecord[]> {
  const data = await tippingHistoryStore.load()
  return data?.tips || []
}

/**
 * Get tipping history from localStorage only (sync, fast)
 */
export function getTippingHistoryLocal(): TipRecord[] {
  const data = tippingHistoryStore.loadLocal()
  return data?.tips || []
}
