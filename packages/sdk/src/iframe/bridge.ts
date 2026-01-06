/**
 * @villa/sdk - VillaBridge
 *
 * PostMessage bridge for SDK <-> iframe communication.
 * Handles secure message passing with origin validation.
 *
 * @example
 * ```typescript
 * const bridge = new VillaBridge({ appId: 'my-app' })
 *
 * bridge.on('success', (identity) => {
 *   console.log('Authenticated:', identity.nickname)
 * })
 *
 * bridge.on('error', (error, code) => {
 *   console.error('Auth failed:', error, code)
 * })
 *
 * await bridge.open()
 * ```
 */

import type { Identity } from '../types'
import type {
  BridgeConfig,
  BridgeState,
  BridgeEventName,
  BridgeEventMap,
  VillaMessage,
  VillaErrorCode,
} from './types'
import { validateOrigin, parseVillaMessage, isDevelopment, ALLOWED_ORIGINS } from './validation'

/** Default timeout: 5 minutes */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

/** Default iframe detection timeout: 3 seconds */
const DEFAULT_IFRAME_DETECTION_TIMEOUT_MS = 3 * 1000

/** Villa auth URLs by network */
const AUTH_URLS = {
  base: 'https://villa.cash/auth',
  'base-sepolia': 'https://beta.villa.cash/auth',
} as const

/**
 * VillaBridge - Secure postMessage bridge for Villa SDK
 *
 * Features:
 * - Origin validation (never trusts untrusted sources)
 * - Message schema validation via Zod
 * - Event-based API for clean integration
 * - Automatic cleanup on close
 * - Timeout handling
 * - Debug logging (opt-in)
 */
export class VillaBridge {
  private config: Required<BridgeConfig> & { iframeDetectionTimeout: number }
  private iframe: HTMLIFrameElement | null = null
  private popup: Window | null = null
  private container: HTMLDivElement | null = null
  private listeners: Map<BridgeEventName, Set<Function>> = new Map()
  private messageHandler: ((event: MessageEvent) => void) | null = null
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private iframeDetectionTimeoutId: ReturnType<typeof setTimeout> | null = null
  private state: BridgeState = 'idle'
  private readonly authUrl: string
  private mode: 'iframe' | 'popup' = 'iframe'

  /**
   * Create a new VillaBridge instance
   *
   * @param config - Bridge configuration
   * @throws {Error} If appId is missing or invalid
   */
  constructor(config: BridgeConfig) {
    // Validate required fields
    if (!config.appId || typeof config.appId !== 'string') {
      throw new Error('[VillaBridge] appId is required')
    }

    if (config.appId.trim().length === 0) {
      throw new Error('[VillaBridge] appId cannot be empty')
    }

    // Set defaults
    this.config = {
      appId: config.appId.trim(),
      origin: config.origin || '',
      network: config.network || 'base',
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      debug: config.debug || false,
      preferPopup: config.preferPopup || false,
      iframeDetectionTimeout: config.iframeDetectionTimeout || DEFAULT_IFRAME_DETECTION_TIMEOUT_MS,
    }

    // Determine auth URL
    if (this.config.origin) {
      // Custom origin provided - validate it
      if (!this.isOriginAllowed(this.config.origin)) {
        throw new Error(
          `[VillaBridge] Origin not in allowlist: ${this.config.origin}. ` +
            `Allowed: ${ALLOWED_ORIGINS.join(', ')}`
        )
      }
      this.authUrl = `${this.config.origin}/auth`
    } else {
      this.authUrl = AUTH_URLS[this.config.network]
    }

    this.log('Initialized with config:', {
      appId: this.config.appId,
      network: this.config.network,
      authUrl: this.authUrl,
    })
  }

  /**
   * Get current bridge state
   */
  getState(): BridgeState {
    return this.state
  }

  /**
   * Check if bridge is currently open
   */
  isOpen(): boolean {
    return this.state === 'ready' || this.state === 'authenticating'
  }

  /**
   * Open the auth iframe or popup
   *
   * Creates a fullscreen iframe (or popup window) and begins listening for messages.
   * Automatically falls back to popup if iframe is blocked.
   * Resolves when iframe/popup signals VILLA_READY.
   *
   * @param scopes - Optional scopes to request (default: ['profile'])
   * @returns Promise that resolves when ready
   * @throws {Error} If bridge is already open or DOM is unavailable
   */
  async open(scopes: string[] = ['profile']): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'closed') {
      throw new Error(`[VillaBridge] Cannot open: current state is ${this.state}`)
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('[VillaBridge] Cannot open: window/document not available (SSR?)')
    }

    this.state = 'opening'

    // If preferPopup is set, go straight to popup mode
    if (this.config.preferPopup) {
      this.log('Opening auth popup (preferPopup=true)...')
      return this.openPopup(scopes)
    }

    // Otherwise, try iframe with fallback to popup
    this.log('Opening auth iframe (with popup fallback)...')
    return this.openIframeWithFallback(scopes)
  }

  /**
   * Open iframe with automatic fallback to popup if blocked
   */
  private async openIframeWithFallback(scopes: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create container with fullscreen styles
        this.container = this.createContainer()

        // Create iframe
        this.iframe = this.createIframe(scopes)

        // Append iframe to container, container to body
        this.container.appendChild(this.iframe)
        document.body.appendChild(this.container)

        // Block body scroll
        document.body.style.overflow = 'hidden'

        // Set up message listener
        this.setupMessageListener(resolve)

        // Set up iframe detection timeout - if we don't get VILLA_READY within X seconds,
        // assume iframe is blocked and fall back to popup
        this.iframeDetectionTimeoutId = setTimeout(() => {
          this.log('Iframe appears to be blocked, falling back to popup...')
          this.cleanupIframe()
          this.openPopup(scopes)
            .then(resolve)
            .catch(reject)
        }, this.config.iframeDetectionTimeout)

        // Set up overall timeout
        this.timeoutId = setTimeout(() => {
          this.log('Timeout waiting for VILLA_READY')
          this.emit('error', 'Connection timeout', 'TIMEOUT')
          this.close()
          reject(new Error('[VillaBridge] Timeout waiting for auth to be ready'))
        }, this.config.timeout)
      } catch (error) {
        this.state = 'idle'
        reject(error)
      }
    })
  }

  /**
   * Open popup window for auth
   */
  private async openPopup(scopes: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.mode = 'popup'

        // Build URL with params
        const url = new URL(this.authUrl)
        url.searchParams.set('appId', this.config.appId)
        url.searchParams.set('scopes', scopes.join(','))
        url.searchParams.set('origin', window.location.origin)
        url.searchParams.set('mode', 'popup') // Signal to auth page it's in popup mode

        // Open popup window
        const width = 480
        const height = 720
        const left = Math.max(0, (window.screen.width - width) / 2)
        const top = Math.max(0, (window.screen.height - height) / 2)

        this.popup = window.open(
          url.toString(),
          'villa-auth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
        )

        if (!this.popup) {
          // Popup was blocked
          this.log('Popup blocked by browser')
          this.emit('error', 'Popup blocked. Please allow popups for this site.', 'NETWORK_ERROR')
          this.state = 'idle'
          reject(new Error('[VillaBridge] Popup blocked by browser'))
          return
        }

        // Set up message listener (works for both iframe and popup)
        this.setupMessageListener(resolve)

        // Check if popup was closed by user
        const popupCheckInterval = setInterval(() => {
          if (this.popup && this.popup.closed) {
            clearInterval(popupCheckInterval)
            if (this.state !== 'closed') {
              this.log('Popup was closed by user')
              this.emit('cancel')
              this.close()
            }
          }
        }, 500)

        // Set up overall timeout
        this.timeoutId = setTimeout(() => {
          clearInterval(popupCheckInterval)
          this.log('Timeout waiting for VILLA_READY')
          this.emit('error', 'Connection timeout', 'TIMEOUT')
          this.close()
          reject(new Error('[VillaBridge] Timeout waiting for popup to be ready'))
        }, this.config.timeout)
      } catch (error) {
        this.state = 'idle'
        reject(error)
      }
    })
  }

  /**
   * Close the auth iframe or popup
   *
   * Removes iframe/popup and cleans up all listeners.
   */
  close(): void {
    if (this.state === 'closed' || this.state === 'idle') {
      return
    }

    this.state = 'closing'
    this.log(`Closing auth ${this.mode}...`)

    // Clear all timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.iframeDetectionTimeoutId) {
      clearTimeout(this.iframeDetectionTimeoutId)
      this.iframeDetectionTimeoutId = null
    }

    // Remove message listener
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler)
      this.messageHandler = null
    }

    // Clean up iframe
    this.cleanupIframe()

    // Clean up popup
    if (this.popup && !this.popup.closed) {
      this.popup.close()
      this.popup = null
    }

    this.state = 'closed'
    this.log(`Auth ${this.mode} closed`)
  }

  /**
   * Clean up iframe-specific resources
   */
  private cleanupIframe(): void {
    // Remove iframe and container
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    this.iframe = null

    // Restore body scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }

  /**
   * Subscribe to bridge events
   *
   * @param event - Event name
   * @param callback - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = bridge.on('success', (identity) => {
   *   console.log('Welcome', identity.nickname)
   * })
   *
   * // Later...
   * unsubscribe()
   * ```
   */
  on<E extends BridgeEventName>(event: E, callback: BridgeEventMap[E]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  /**
   * Unsubscribe from bridge events
   *
   * @param event - Event name
   * @param callback - Callback to remove
   */
  off<E extends BridgeEventName>(event: E, callback: BridgeEventMap[E]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * Remove all listeners for an event (or all events)
   *
   * @param event - Optional event name (removes all if not specified)
   */
  removeAllListeners(event?: BridgeEventName): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Post a message to the iframe or popup
   *
   * @param message - Message to send
   */
  postMessage(message: object): void {
    const target = this.mode === 'popup' ? this.popup : this.iframe?.contentWindow

    if (!target) {
      this.log(`Cannot post message: ${this.mode} not ready`)
      return
    }

    // Get target origin from auth URL
    const url = new URL(this.authUrl)
    const targetOrigin = url.origin

    this.log('Posting message:', message)
    target.postMessage(message, targetOrigin)
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Create fullscreen container element
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'villa-bridge-container'
    container.setAttribute('role', 'dialog')
    container.setAttribute('aria-modal', 'true')
    container.setAttribute('aria-label', 'Villa Authentication')

    // Fullscreen fixed positioning
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999999',
      backgroundColor: '#FFFDF8', // Villa cream
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    })

    return container
  }

  /**
   * Create iframe element
   */
  private createIframe(scopes: string[]): HTMLIFrameElement {
    const iframe = document.createElement('iframe')

    // Build URL with params
    const url = new URL(this.authUrl)
    url.searchParams.set('appId', this.config.appId)
    url.searchParams.set('scopes', scopes.join(','))
    url.searchParams.set('origin', window.location.origin)

    iframe.src = url.toString()
    iframe.id = 'villa-auth-iframe'
    iframe.title = 'Villa Authentication'

    // Allow passkey credentials
    iframe.allow = 'publickey-credentials-get *; publickey-credentials-create *'

    // Sandbox with necessary permissions
    iframe.sandbox.add('allow-same-origin')
    iframe.sandbox.add('allow-scripts')
    iframe.sandbox.add('allow-forms')
    iframe.sandbox.add('allow-popups')
    iframe.sandbox.add('allow-popups-to-escape-sandbox')

    // Fullscreen styles
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      backgroundColor: 'transparent',
    })

    // Handle load errors
    iframe.onerror = () => {
      this.log('Iframe load error')
      this.emit('error', 'Failed to load authentication page', 'NETWORK_ERROR')
      this.close()
    }

    return iframe
  }

  /**
   * Set up postMessage listener with validation
   */
  private setupMessageListener(onReady: () => void): void {
    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event, onReady)
    }
    window.addEventListener('message', this.messageHandler)
  }

  /**
   * Handle incoming postMessage
   */
  private handleMessage(event: MessageEvent, onReady: () => void): void {
    // CRITICAL: Validate origin first
    if (!this.isOriginAllowed(event.origin)) {
      this.log(`Ignoring message from untrusted origin: ${event.origin}`)
      return
    }

    // Validate message structure
    const message = parseVillaMessage(event.data)
    if (!message) {
      this.log('Ignoring invalid message:', event.data)
      return
    }

    this.log('Received message:', message.type)

    // Process message
    switch (message.type) {
      case 'VILLA_READY':
        this.state = 'ready'
        // Clear iframe detection timeout since we got VILLA_READY
        if (this.iframeDetectionTimeoutId) {
          clearTimeout(this.iframeDetectionTimeoutId)
          this.iframeDetectionTimeoutId = null
        }
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
          this.timeoutId = null
        }
        this.emit('ready')
        onReady()
        break

      case 'VILLA_AUTH_SUCCESS':
        this.state = 'authenticating'
        this.emit('success', message.payload.identity)
        this.close()
        break

      case 'VILLA_AUTH_CANCEL':
        this.emit('cancel')
        this.close()
        break

      case 'VILLA_AUTH_ERROR':
        this.emit('error', message.payload.error, message.payload.code)
        this.close()
        break

      case 'VILLA_CONSENT_GRANTED':
        this.emit('consent_granted', message.payload.appId, message.payload.scopes)
        break

      case 'VILLA_CONSENT_DENIED':
        this.emit('consent_denied', message.payload.appId)
        this.close()
        break
    }
  }

  /**
   * Check if origin is in allowlist
   */
  private isOriginAllowed(origin: string): boolean {
    return validateOrigin(origin)
  }

  /**
   * Emit an event to all listeners
   */
  private emit<E extends BridgeEventName>(
    event: E,
    ...args: Parameters<BridgeEventMap[E]>
  ): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          ;(callback as Function)(...args)
        } catch (error) {
          console.error(`[VillaBridge] Error in ${event} handler:`, error)
        }
      })
    }
  }

  /**
   * Log debug message if debug mode enabled
   */
  private log(...args: unknown[]): void {
    if (this.config.debug || isDevelopment()) {
      console.log('[VillaBridge]', ...args)
    }
  }
}
