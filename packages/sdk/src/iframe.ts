/**
 * Iframe Management
 *
 * Creates and manages authentication iframe for Porto passkey flow.
 */

import type { Identity } from './types'

/**
 * Trusted origins for postMessage communication
 */
const TRUSTED_ORIGINS = [
  'https://villa.cash',
  'https://www.villa.cash',
  'https://beta.villa.cash',
  'https://dev-1.villa.cash',
  'https://dev-2.villa.cash',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3000',
] as const

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  )
}

/**
 * Validates if origin is trusted
 *
 * @param origin - Origin to validate
 * @returns True if origin is trusted
 */
function isOriginTrusted(origin: string): boolean {
  return TRUSTED_ORIGINS.includes(origin as any)
}

export interface IframeConfig {
  /** URL to Villa auth page */
  url: string
  /** Optional width (defaults to fullscreen) */
  width?: number
  /** Optional height (defaults to fullscreen) */
  height?: number
}

export type AuthMessage =
  | { type: 'AUTH_SUCCESS'; identity: Identity }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'AUTH_CLOSE' }

let currentIframe: HTMLIFrameElement | null = null
let messageHandler: ((event: MessageEvent) => void) | null = null

/**
 * Creates fullscreen auth iframe
 *
 * @param config - Iframe configuration
 * @returns Created iframe element
 */
export function createAuthIframe(config: IframeConfig): HTMLIFrameElement {
  // Remove existing iframe if present
  destroyAuthIframe()

  const iframe = document.createElement('iframe')

  // Set iframe attributes
  iframe.src = config.url
  iframe.id = 'villa-auth-iframe'
  iframe.allow = 'publickey-credentials-get *; publickey-credentials-create *'

  // Fullscreen styling
  iframe.style.position = 'fixed'
  iframe.style.top = '0'
  iframe.style.left = '0'
  iframe.style.width = config.width ? `${config.width}px` : '100vw'
  iframe.style.height = config.height ? `${config.height}px` : '100vh'
  iframe.style.border = 'none'
  iframe.style.zIndex = '9999'
  iframe.style.backgroundColor = 'white'

  // Append to body
  document.body.appendChild(iframe)

  currentIframe = iframe
  return iframe
}

/**
 * Removes auth iframe from DOM
 */
export function destroyAuthIframe(): void {
  if (currentIframe) {
    currentIframe.remove()
    currentIframe = null
  }

  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
    messageHandler = null
  }
}

/**
 * Posts a message to the auth iframe
 *
 * @param message - Message to send
 */
export function postMessage(message: AuthMessage): void {
  if (!currentIframe || !currentIframe.contentWindow) {
    console.warn('[Villa SDK] Cannot post message: iframe not ready')
    return
  }

  currentIframe.contentWindow.postMessage(message, '*')
}

/**
 * Listens for messages from auth iframe
 *
 * @param handler - Message handler function
 * @returns Cleanup function to remove listener
 */
export function onMessage(
  handler: (message: AuthMessage) => void
): () => void {
  // Clean up existing handler
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
  }

  // Create new handler that validates message origin
  messageHandler = (event: MessageEvent) => {
    // Validate origin is trusted
    if (!isOriginTrusted(event.origin)) {
      if (isDevelopment()) {
        console.warn(
          `[Villa SDK] Received message from untrusted origin: ${event.origin}`
        )
      }
      // Silently ignore in production
      return
    }

    const message = event.data as AuthMessage

    // Validate message structure
    if (!message || !message.type) {
      return
    }

    // Only handle Villa auth messages
    if (
      message.type === 'AUTH_SUCCESS' ||
      message.type === 'AUTH_ERROR' ||
      message.type === 'AUTH_CLOSE'
    ) {
      handler(message)
    }
  }

  window.addEventListener('message', messageHandler)

  // Return cleanup function
  return () => {
    if (messageHandler) {
      window.removeEventListener('message', messageHandler)
      messageHandler = null
    }
  }
}
