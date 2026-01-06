/**
 * @villa/sdk - Origin and Message Validation
 *
 * Security utilities for postMessage communication.
 * CRITICAL: Never trust postMessage without origin validation.
 */

import { z } from 'zod'
import type { VillaMessage, ParentMessage, VillaErrorCode } from './types'

/**
 * Allowed origins for Villa auth
 * HTTPS-only in production - passkeys require secure context
 */
export const ALLOWED_ORIGINS = [
  'https://villa.cash',
  'https://www.villa.cash',
  'https://beta.villa.cash',
  'https://dev-1.villa.cash',
  'https://dev-2.villa.cash',
] as const

/**
 * Development origins (only active when NODE_ENV === 'development')
 */
export const DEV_ORIGINS = [
  'https://localhost:3000',
  'https://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
] as const

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true
  }
  // Browser environment check
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }
  return false
}

/**
 * Get all valid origins based on environment
 */
export function getValidOrigins(): readonly string[] {
  if (isDevelopment()) {
    return [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
  }
  return ALLOWED_ORIGINS
}

/**
 * Validate if an origin is trusted
 *
 * @param origin - Origin to validate (e.g., 'https://villa.cash')
 * @returns true if origin is in allowlist
 */
export function validateOrigin(origin: string): boolean {
  const validOrigins = getValidOrigins()
  return validOrigins.includes(origin as typeof validOrigins[number])
}

/**
 * Identity schema for validation
 */
const IdentitySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nickname: z.string().min(1).max(50),
  avatar: z.object({
    style: z.enum(['adventurer', 'avataaars', 'bottts', 'thumbs']),
    seed: z.string(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }),
})

/**
 * Villa error codes
 */
const ErrorCodeSchema = z.enum([
  'CANCELLED',
  'TIMEOUT',
  'NETWORK_ERROR',
  'INVALID_ORIGIN',
  'INVALID_CONFIG',
  'AUTH_FAILED',
  'PASSKEY_ERROR',
  'CONSENT_REQUIRED',
])

/**
 * Villa message schemas
 */
const VillaMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('VILLA_READY') }),
  z.object({
    type: z.literal('VILLA_AUTH_SUCCESS'),
    payload: z.object({ identity: IdentitySchema }),
  }),
  z.object({ type: z.literal('VILLA_AUTH_CANCEL') }),
  z.object({
    type: z.literal('VILLA_AUTH_ERROR'),
    payload: z.object({
      error: z.string(),
      code: ErrorCodeSchema.optional(),
    }),
  }),
  z.object({
    type: z.literal('VILLA_CONSENT_GRANTED'),
    payload: z.object({
      appId: z.string(),
      scopes: z.array(z.string()),
    }),
  }),
  z.object({
    type: z.literal('VILLA_CONSENT_DENIED'),
    payload: z.object({ appId: z.string() }),
  }),
])

/**
 * Parent message schemas
 */
const ParentMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PARENT_INIT'),
    payload: z.object({
      appId: z.string(),
      scopes: z.array(z.string()).optional(),
      origin: z.string(),
    }),
  }),
  z.object({ type: z.literal('PARENT_CLOSE') }),
])

/**
 * Validate and parse a Villa message
 *
 * @param data - Raw message data from postMessage
 * @returns Parsed message or null if invalid
 */
export function parseVillaMessage(data: unknown): VillaMessage | null {
  try {
    const result = VillaMessageSchema.safeParse(data)
    if (!result.success) {
      return null
    }
    // Cast address to branded type after validation
    const message = result.data
    if (message.type === 'VILLA_AUTH_SUCCESS') {
      return {
        ...message,
        payload: {
          identity: {
            ...message.payload.identity,
            address: message.payload.identity.address as `0x${string}`,
          },
        },
      }
    }
    return message as VillaMessage
  } catch {
    return null
  }
}

/**
 * Validate and parse a Parent message
 *
 * @param data - Raw message data
 * @returns Parsed message or null if invalid
 */
export function parseParentMessage(data: unknown): ParentMessage | null {
  try {
    const result = ParentMessageSchema.safeParse(data)
    return result.success ? (result.data as ParentMessage) : null
  } catch {
    return null
  }
}

/**
 * Create a validated Villa error
 */
export function createVillaError(
  error: string,
  code?: string
): { error: string; code?: VillaErrorCode } {
  const validCode = ErrorCodeSchema.safeParse(code)
  return {
    error,
    code: validCode.success ? validCode.data : undefined,
  }
}
