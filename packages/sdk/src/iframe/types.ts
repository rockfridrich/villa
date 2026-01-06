/**
 * @villa/sdk - Iframe Message Types
 *
 * Type definitions for postMessage communication between
 * parent app and Villa auth iframe.
 */

import type { Identity } from '../types'

/**
 * Message types sent FROM Villa iframe TO parent app
 */
export type VillaMessage =
  | { type: 'VILLA_READY' }
  | { type: 'VILLA_AUTH_SUCCESS'; payload: { identity: Identity } }
  | { type: 'VILLA_AUTH_CANCEL' }
  | { type: 'VILLA_AUTH_ERROR'; payload: { error: string; code?: VillaErrorCode } }
  | { type: 'VILLA_CONSENT_GRANTED'; payload: { appId: string; scopes: string[] } }
  | { type: 'VILLA_CONSENT_DENIED'; payload: { appId: string } }

/**
 * Message types sent FROM parent app TO Villa iframe
 */
export type ParentMessage =
  | { type: 'PARENT_INIT'; payload: { appId: string; scopes?: string[]; origin: string } }
  | { type: 'PARENT_CLOSE' }

/**
 * All message types for the bridge
 */
export type BridgeMessage = VillaMessage | ParentMessage

/**
 * Error codes for auth failures
 */
export type VillaErrorCode =
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_ORIGIN'
  | 'INVALID_CONFIG'
  | 'AUTH_FAILED'
  | 'PASSKEY_ERROR'
  | 'CONSENT_REQUIRED'

/**
 * Bridge configuration
 */
export interface BridgeConfig {
  /** Your application ID */
  appId: string
  /** Override Villa auth origin (defaults to production) */
  origin?: string
  /** Network to use (affects default origin) */
  network?: 'base' | 'base-sepolia'
  /** Timeout for auth flow in ms (default: 5 minutes) */
  timeout?: number
  /** Enable debug logging */
  debug?: boolean
  /** Prefer popup over iframe (useful when iframes are blocked) */
  preferPopup?: boolean
  /** Timeout to detect iframe blocking in ms (default: 3 seconds) */
  iframeDetectionTimeout?: number
}

/**
 * Bridge event names
 */
export type BridgeEventName =
  | 'ready'
  | 'success'
  | 'cancel'
  | 'error'
  | 'consent_granted'
  | 'consent_denied'

/**
 * Event callback types
 */
export interface BridgeEventMap {
  ready: () => void
  success: (identity: Identity) => void
  cancel: () => void
  error: (error: string, code?: VillaErrorCode) => void
  consent_granted: (appId: string, scopes: string[]) => void
  consent_denied: (appId: string) => void
}

/**
 * Bridge state
 */
export type BridgeState = 'idle' | 'opening' | 'ready' | 'authenticating' | 'closing' | 'closed'
