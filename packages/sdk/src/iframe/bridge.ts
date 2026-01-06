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
  private config: Required<BridgeConfig>
  private iframe: HTMLIFrameElement | null = null
  private container: HTMLDivElement | null = null
  private listeners: Map<BridgeEventName, Set<Function>> = new Map()
  private messageHandler: ((event: MessageEvent) => void) | null = null
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private state: BridgeState = 'idle'
  private readonly authUrl: string

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
   * Open the auth iframe
   *
   * Creates a fullscreen iframe and begins listening for messages.
   * Resolves when iframe signals VILLA_READY.
   *
   * @param scopes - Optional scopes to request (default: ['profile'])
   * @returns Promise that resolves when iframe is ready
   * @throws {Error} If bridge is already open or DOM is unavailable
   */
  async open(scopes: string[] = ['profile']): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'closed') {
      throw new Error(`[VillaBridge] Cannot open: current state is ${this.state}`)
    }

    if (typeof document === 'undefined') {
      throw new Error('[VillaBridge] Cannot open: document is not available (SSR?)')
    }

    this.state = 'opening'
    this.log('Opening auth iframe...')

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

        // Set up timeout
        this.timeoutId = setTimeout(() => {
          this.log('Timeout waiting for VILLA_READY')
          this.emit('error', 'Connection timeout', 'TIMEOUT')
          this.close()
          reject(new Error('[VillaBridge] Timeout waiting for iframe to be ready'))
        }, this.config.timeout)
      } catch (error) {
        this.state = 'idle'
        reject(error)
      }
    })
  }

  /**
   * Close the auth iframe
   *
   * Removes iframe from DOM and cleans up all listeners.
   */
  close(): void {
    if (this.state === 'closed' || this.state === 'idle') {
      return
    }

    this.state = 'closing'
    this.log('Closing auth iframe...')

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // Remove message listener
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler)
      this.messageHandler = null
    }

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

    this.state = 'closed'
    this.log('Auth iframe closed')
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
   * Post a message to the iframe
   *
   * @param message - Message to send
   */
  postMessage(message: object): void {
    if (!this.iframe?.contentWindow) {
      this.log('Cannot post message: iframe not ready')
      return
    }

    // Get target origin from iframe URL
    const iframeUrl = new URL(this.authUrl)
    const targetOrigin = iframeUrl.origin

    this.log('Posting message:', message)
    this.iframe.contentWindow.postMessage(message, targetOrigin)
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
