/**
 * Glide SDK Configuration and Theme
 *
 * Glide widget theming matched to Villa's Proof of Retreat design system.
 *
 * Design decisions:
 * - Primary action color: accent-yellow (#ffe047) for CTAs, matches Villa's primary button
 * - Background: cream-50 (#fffcf8) for consistency with Villa chrome
 * - Text: ink (#0d0d17) with ink-muted (#61616b) for hierarchy
 * - Border radius: 12px for cards, 8px for buttons (Villa's rounded-lg and rounded-md)
 * - Font: System UI fallback (Glide handles its own font loading)
 * - Success color: accent-green (#698f69) for positive states
 * - Error color: #dc2626 (error.text) for failures
 *
 * Villa controls:
 * - Entry point button placement
 * - Success/error messaging AFTER transaction
 * - Transaction history display (future)
 *
 * Glide widget controls (security-critical, cannot override):
 * - Wallet connection flow
 * - Token/chain selection UI
 * - Amount input and validation
 * - Fee calculation and display
 * - Transaction signing prompts
 * - Transaction status tracking
 * - Error handling during transaction
 */

// TODO: Install @paywithglide/glide-react and uncomment
// import type { GlideConfig } from '@paywithglide/glide-react'

// Temporary type definition until SDK is installed
export interface GlideConfig {
  projectId: string
  recipient: string
  destinationChainId: number
  theme?: {
    colors?: Record<string, string>
    borderRadius?: Record<string, string>
    fontFamily?: string
  }
}

export const GLIDE_PROJECT_ID = process.env.NEXT_PUBLIC_GLIDE_PROJECT_ID || ''

/**
 * Glide theme configuration matching Villa design tokens.
 * Colors reference: apps/web/tailwind.config.ts
 */
export const villaGlideTheme = {
  colors: {
    // Primary CTA: Villa's signature yellow
    primary: '#ffe047',        // accent-yellow
    primaryHover: '#f5d63d',   // villa-600 (slightly darker on hover)

    // Backgrounds
    background: '#fffcf8',     // cream-50 (main background)
    backgroundSecondary: '#fef9f0', // cream-100 (cards, secondary surfaces)

    // Text hierarchy
    text: '#0d0d17',           // ink (primary text)
    textSecondary: '#61616b',  // ink-muted (secondary text, labels)
    textMuted: '#45454f',      // ink-light (tertiary text)

    // Borders and dividers
    border: '#e0e0e6',         // neutral-100
    borderHover: '#c4c4cc',    // neutral-200

    // Status colors
    success: '#698f69',        // accent-green (success states)
    successBg: '#f0f9f0',      // success.bg (success backgrounds)
    error: '#dc2626',          // error.text (error states)
    errorBg: '#fef0f0',        // error.bg (error backgrounds)
    warning: '#382207',        // accent-brown (warning text)
    warningBg: '#fffbeb',      // warning.bg (warning backgrounds)
  },

  borderRadius: {
    button: '8px',    // rounded-md (Villa button style)
    card: '12px',     // rounded-lg (Villa card style)
    modal: '14px',    // rounded-lg (Villa modal style - matches dialog)
    input: '8px',     // rounded-md (consistent with buttons)
  },

  // Font will be inherited from Villa's system, but specify fallbacks
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
}

/**
 * Base Glide configuration for all deposit flows.
 * Pass user's Porto smart account address as `recipient`.
 */
export const getGlideConfig = (recipientAddress: string): GlideConfig => ({
  projectId: GLIDE_PROJECT_ID,
  recipient: recipientAddress,
  destinationChainId: 8453, // Base mainnet
  theme: villaGlideTheme,
})

/**
 * Language mapping for user-facing copy.
 * Glide uses technical terms, we translate to Villa's language.
 */
export const GLIDE_LANGUAGE_MAP = {
  // Internal/Tech → User-Facing
  'cross-chain bridge': 'Add Funds',
  'source chain': 'From',
  'destination': 'To Villa',
  'recipient address': '(hidden - auto-filled)',
  'relayer fee': 'Network fee',
  'payment session': '(internal)',
} as const

/**
 * Transaction state types that Villa handles.
 * Glide manages internal state, Villa tracks completion.
 */
export interface FundingTransaction {
  txHash: string
  amount: string
  token: string
  sourceChain: string
  timestamp: number
  status: 'pending' | 'success' | 'failed'
}

/**
 * Error messages mapped to user-friendly copy.
 * Glide returns technical errors, we display actionable messages.
 */
export const GLIDE_ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Network error': 'Connection lost. Please check your internet and try again.',
  'Timeout': 'Request timed out. Please try again.',

  // Transaction errors
  'Transaction rejected': 'Transaction cancelled. You can try again anytime.',
  'Insufficient funds': 'Insufficient balance on source wallet. Please add funds and try again.',
  'Transaction failed': 'Transaction failed. Please try again or contact support if this continues.',

  // SDK errors
  'Glide unavailable': 'Funding temporarily unavailable. Please try again in a few minutes.',
  'Invalid chain': 'This chain is not supported. Please select a different source chain.',
  'Invalid token': 'This token is not supported. Please select a different token.',

  // Generic fallback
  'default': 'Something went wrong. Please try again or contact support.',
} as const

/**
 * Get user-friendly error message from Glide error.
 */
export function getErrorMessage(error: Error | string): string {
  const errorStr = typeof error === 'string' ? error : error.message

  // Try to match known error patterns
  for (const [key, message] of Object.entries(GLIDE_ERROR_MESSAGES)) {
    if (errorStr.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }

  // Fallback to generic message
  return GLIDE_ERROR_MESSAGES.default
}

/**
 * Format chain name for user-facing display
 */
export function formatChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    8453: 'Base',
    10: 'Optimism',
    42161: 'Arbitrum',
    137: 'Polygon',
    56: 'BNB Chain',
    43114: 'Avalanche',
  }
  return chains[chainId] || `Chain ${chainId}`
}

/**
 * Get Base block explorer URL for transaction
 */
export function getExplorerUrl(txHash: string, chainId: number = 8453): string {
  const isMainnet = chainId === 8453
  const domain = isMainnet ? 'basescan.org' : 'sepolia.basescan.org'
  return `https://${domain}/tx/${txHash}`
}
