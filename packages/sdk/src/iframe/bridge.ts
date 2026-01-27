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

import type { Identity } from "../types";
import type {
  BridgeConfig,
  BridgeState,
  BridgeEventName,
  BridgeEventMap,
  VillaMessage,
  VillaErrorCode,
} from "./types";
import {
  validateOrigin,
  parseVillaMessage,
  isDevelopment,
  ALLOWED_ORIGINS,
} from "./validation";
import { deriveAppId } from "../config";

/** Default timeout: 5 minutes */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

/** Default iframe detection timeout: 3 seconds */
const DEFAULT_IFRAME_DETECTION_TIMEOUT_MS = 3 * 1000;

const AUTH_URLS = {
  base: "https://key.villa.cash/auth",
  "base-sepolia": "https://fake-key.villa.cash/auth",
} as const;

function getAuthUrl(network: "base" | "base-sepolia"): string {
  if (isDevelopment() && typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "local.villa.cash") {
      return "https://local-key.villa.cash/auth";
    }
    if (
      hostname === "local-docs.villa.cash" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return "http://localhost:3001/auth";
    }
  }
  return AUTH_URLS[network];
}

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
  private config: Required<BridgeConfig> & { iframeDetectionTimeout: number };
  private iframe: HTMLIFrameElement | null = null;
  private popup: Window | null = null;
  private container: HTMLDivElement | null = null;
  private listeners: Map<BridgeEventName, Set<Function>> = new Map();
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private iframeDetectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private state: BridgeState = "idle";
  private readonly authUrl: string;
  private readonly settingsUrl: string;
  private mode: "iframe" | "popup" = "iframe";

  constructor(config: BridgeConfig = {}) {
    const appId = config.appId?.trim() || deriveAppId();

    this.config = {
      appId,
      origin: config.origin || "",
      network: config.network || "base",
      timeout: config.timeout || DEFAULT_TIMEOUT_MS,
      debug: config.debug || false,
      preferPopup: config.preferPopup === true,
      iframeDetectionTimeout:
        config.iframeDetectionTimeout || DEFAULT_IFRAME_DETECTION_TIMEOUT_MS,
    };

    // Determine auth URL
    if (this.config.origin) {
      // Custom origin provided - validate it
      if (!this.isOriginAllowed(this.config.origin)) {
        throw new Error(
          `[VillaBridge] Origin not in allowlist: ${this.config.origin}. ` +
            `Allowed: ${ALLOWED_ORIGINS.join(", ")}`,
        );
      }
      this.authUrl = `${this.config.origin}/auth`;
    } else {
      this.authUrl = getAuthUrl(this.config.network);
    }

    this.settingsUrl = this.authUrl.replace("/auth", "/settings");

    this.log("Initialized with config:", {
      appId: this.config.appId,
      network: this.config.network,
      authUrl: this.authUrl,
      settingsUrl: this.settingsUrl,
    });
  }

  /**
   * Get current bridge state
   */
  getState(): BridgeState {
    return this.state;
  }

  /**
   * Check if bridge is currently open
   */
  isOpen(): boolean {
    return this.state === "ready" || this.state === "authenticating";
  }

  /**
   * Open the auth iframe or popup
   *
   * Creates a fullscreen iframe (or popup window) and begins listening for messages.
   * Automatically falls back to popup if iframe is blocked.
   * Resolves when iframe/popup signals VILLA_READY.
   *
   * @param scopes - Optional scopes to request (default: ['profile'])
   * @param params - Optional additional query parameters
   * @returns Promise that resolves when ready
   * @throws {Error} If bridge is already open or DOM is unavailable
   */
  async open(
    scopes: string[] = ["profile"],
    params?: Record<string, string>,
  ): Promise<void> {
    if (this.state !== "idle" && this.state !== "closed") {
      throw new Error(
        `[VillaBridge] Cannot open: current state is ${this.state}`,
      );
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error(
        "[VillaBridge] Cannot open: window/document not available (SSR?)",
      );
    }

    this.state = "opening";

    // If preferPopup is set, go straight to popup mode
    if (this.config.preferPopup) {
      this.log("Opening auth popup (preferPopup=true)...");
      return this.openPopup(scopes, params);
    }

    // Otherwise, try iframe with fallback to popup
    this.log("Opening auth iframe (with popup fallback)...");
    return this.openIframeWithFallback(scopes, params);
  }

  /**
   * Open iframe with automatic fallback to popup if blocked
   */
  private async openIframeWithFallback(
    scopes: string[],
    params?: Record<string, string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create container with fullscreen styles
        this.container = this.createContainer();

        // Create iframe
        this.iframe = this.createIframe(scopes, params);

        // Append iframe to container, container to body
        this.container.appendChild(this.iframe);
        document.body.appendChild(this.container);

        // Block body scroll
        document.body.style.overflow = "hidden";

        // Set up message listener
        this.setupMessageListener(resolve);

        // Set up iframe detection timeout - if we don't get VILLA_READY within X seconds,
        // assume iframe is blocked and fall back to popup
        this.iframeDetectionTimeoutId = setTimeout(() => {
          this.log("Iframe appears to be blocked, falling back to popup...");
          this.cleanupIframe();
          this.openPopup(scopes, params).then(resolve).catch(reject);
        }, this.config.iframeDetectionTimeout);

        // Set up overall timeout
        this.timeoutId = setTimeout(() => {
          this.log("Timeout waiting for VILLA_READY");
          this.emit("error", "Connection timeout", "TIMEOUT");
          this.close();
          reject(
            new Error("[VillaBridge] Timeout waiting for auth to be ready"),
          );
        }, this.config.timeout);
      } catch (error) {
        this.state = "idle";
        reject(error);
      }
    });
  }

  /**
   * Open popup window for auth
   */
  private async openPopup(
    scopes: string[],
    params?: Record<string, string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.mode = "popup";

        const baseUrl = scopes.includes("settings")
          ? this.settingsUrl
          : this.authUrl;
        const url = new URL(baseUrl);
        url.searchParams.set("appId", this.config.appId);
        url.searchParams.set("scopes", scopes.join(","));
        url.searchParams.set("origin", window.location.origin);
        url.searchParams.set("mode", "popup");
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
        }

        // Open popup window (Porto-identical size)
        const width = 380;
        const height = 520;
        const left = Math.max(0, (window.screen.width - width) / 2);
        const top = Math.max(0, (window.screen.height - height) / 2);

        this.popup = window.open(
          url.toString(),
          "villa-auth",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`,
        );

        if (!this.popup) {
          // Popup was blocked
          this.log("Popup blocked by browser");
          this.emit(
            "error",
            "Popup blocked. Please allow popups for this site.",
            "NETWORK_ERROR",
          );
          this.state = "idle";
          reject(new Error("[VillaBridge] Popup blocked by browser"));
          return;
        }

        // Set up message listener (works for both iframe and popup)
        this.setupMessageListener(resolve);

        // Check if popup was closed by user
        const popupCheckInterval = setInterval(() => {
          if (this.popup && this.popup.closed) {
            clearInterval(popupCheckInterval);
            if (this.state !== "closed") {
              this.log("Popup was closed by user");
              this.emit("cancel");
              this.close();
            }
          }
        }, 500);

        // Set up overall timeout
        this.timeoutId = setTimeout(() => {
          clearInterval(popupCheckInterval);
          this.log("Timeout waiting for VILLA_READY");
          this.emit("error", "Connection timeout", "TIMEOUT");
          this.close();
          reject(
            new Error("[VillaBridge] Timeout waiting for popup to be ready"),
          );
        }, this.config.timeout);
      } catch (error) {
        this.state = "idle";
        reject(error);
      }
    });
  }

  close(): void {
    if (this.state === "closed" || this.state === "idle") {
      return;
    }

    this.state = "closing";
    this.log(`Closing auth ${this.mode}...`);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.iframeDetectionTimeoutId) {
      clearTimeout(this.iframeDetectionTimeoutId);
      this.iframeDetectionTimeoutId = null;
    }

    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }

    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

    if (this.container && !isMobile) {
      this.container.style.backgroundColor = "rgba(255, 253, 248, 0)";
      this.container.style.backdropFilter = "blur(0px) saturate(100%)";
      (
        this.container.style as CSSStyleDeclaration & {
          WebkitBackdropFilter: string;
        }
      ).WebkitBackdropFilter = "blur(0px) saturate(100%)";

      if (this.iframe) {
        this.iframe.style.animation =
          "villa-scale-out 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards";
      }

      setTimeout(() => {
        this.cleanupIframe();
        this.finalizeClose();
      }, 200);
    } else {
      this.cleanupIframe();
      this.finalizeClose();
    }
  }

  private finalizeClose(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close();
      this.popup = null;
    }

    this.state = "closed";
    this.log(`Auth ${this.mode} closed`);
  }

  /**
   * Clean up iframe-specific resources
   */
  private cleanupIframe(): void {
    // Remove iframe and container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.iframe = null;

    // Restore body scroll
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
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
  on<E extends BridgeEventName>(
    event: E,
    callback: BridgeEventMap[E],
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from bridge events
   *
   * @param event - Event name
   * @param callback - Callback to remove
   */
  off<E extends BridgeEventName>(event: E, callback: BridgeEventMap[E]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Remove all listeners for an event (or all events)
   *
   * @param event - Optional event name (removes all if not specified)
   */
  removeAllListeners(event?: BridgeEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Post a message to the iframe or popup
   *
   * @param message - Message to send
   */
  postMessage(message: object): void {
    const target =
      this.mode === "popup" ? this.popup : this.iframe?.contentWindow;

    if (!target) {
      this.log(`Cannot post message: ${this.mode} not ready`);
      return;
    }

    // Get target origin from auth URL
    const url = new URL(this.authUrl);
    const targetOrigin = url.origin;

    this.log("Posting message:", message);
    target.postMessage(message, targetOrigin);
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Create container element - modal on desktop, fullscreen on mobile
   * Includes instant loading UI that shows before iframe loads
   * Features smooth animations for native feel
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "villa-bridge-container";
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-modal", "true");
    container.setAttribute("aria-label", "Villa Authentication");

    // Responsive: modal on desktop (>768px), fullscreen on mobile
    const isMobile = window.innerWidth <= 768;

    // Add animation styles
    this.injectAnimationStyles();

    if (isMobile) {
      // Mobile: fullscreen with slide-up animation
      Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "999999",
        backgroundColor: "#FFFDF8", // Villa cream
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "villa-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      });
    } else {
      // Desktop: modal with backdrop - fade in backdrop
      Object.assign(container.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "999999",
        backgroundColor: "rgba(0, 0, 0, 0)",
        backdropFilter: "blur(0px)",
        WebkitBackdropFilter: "blur(0px)", // Safari support
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        transition:
          "background-color 0.3s ease, backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease",
      });

      requestAnimationFrame(() => {
        container.style.backgroundColor = "rgba(255, 253, 248, 0.72)";
        container.style.backdropFilter = "blur(20px) saturate(180%)";
        (
          container.style as CSSStyleDeclaration & {
            WebkitBackdropFilter: string;
          }
        ).WebkitBackdropFilter = "blur(20px) saturate(180%)";
      });

      // Click backdrop to close (cancel)
      container.addEventListener("click", (e) => {
        if (e.target === container) {
          this.log("Backdrop clicked, cancelling");
          this.emit("cancel");
          this.close();
        }
      });

      // Escape key to close
      this.setupEscapeKeyHandler();
    }

    // Add instant loading UI (shows before iframe loads)
    const loadingOverlay = this.createLoadingOverlay(isMobile);
    container.appendChild(loadingOverlay);

    return container;
  }

  /**
   * Set up escape key handler for closing modal
   */
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  private setupEscapeKeyHandler(): void {
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.log("Escape key pressed, cancelling");
        this.emit("cancel");
        this.close();
      }
    };
    document.addEventListener("keydown", this.escapeHandler);
  }

  /**
   * Inject animation keyframes into document
   */
  private injectAnimationStyles(): void {
    if (document.getElementById("villa-animation-styles")) return;

    const style = document.createElement("style");
    style.id = "villa-animation-styles";
    style.textContent = `
      @keyframes villa-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes villa-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      @keyframes villa-scale-in {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes villa-scale-out {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
      }
      @keyframes villa-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes villa-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private createLoadingOverlay(isMobile: boolean): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.id = "villa-loading-overlay";

    // Loading overlay matches container size (380×520 on desktop)
    Object.assign(overlay.style, {
      position: "absolute",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 253, 248, 0.85)",
      borderRadius: isMobile ? "0" : "14px",
      zIndex: "1",
      transition: "opacity 0.25s ease-out, transform 0.25s ease-out",
      animation: isMobile
        ? "villa-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        : "villa-scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: isMobile
        ? "none"
        : "0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)",
    });

    const logo = document.createElement("div");
    Object.assign(logo.style, {
      width: "72px",
      height: "72px",
      borderRadius: "18px",
      background: "linear-gradient(145deg, #FFE047 0%, #F5D030 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "28px",
      boxShadow:
        "0 4px 16px rgba(245, 208, 48, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      animation: "villa-pulse 2s ease-in-out infinite",
    });

    const logoText = document.createElement("span");
    logoText.textContent = "V";
    Object.assign(logoText.style, {
      fontSize: "36px",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#5C4813",
      fontWeight: "600",
      textShadow: "0 1px 0 rgba(255, 255, 255, 0.3)",
    });
    logo.appendChild(logoText);
    overlay.appendChild(logo);

    const progressContainer = document.createElement("div");
    Object.assign(progressContainer.style, {
      width: "120px",
      height: "4px",
      backgroundColor: "rgba(0, 0, 0, 0.06)",
      borderRadius: "2px",
      overflow: "hidden",
      marginBottom: "16px",
    });

    const progressBar = document.createElement("div");
    Object.assign(progressBar.style, {
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, #FFE047, transparent)",
      backgroundSize: "200% 100%",
      animation: "villa-shimmer 1.5s ease-in-out infinite",
    });
    progressContainer.appendChild(progressBar);
    overlay.appendChild(progressContainer);

    const text = document.createElement("p");
    text.textContent = "Preparing secure login...";
    Object.assign(text.style, {
      marginTop: "4px",
      fontSize: "14px",
      color: "#888",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      fontWeight: "500",
      letterSpacing: "-0.01em",
    });
    overlay.appendChild(text);

    return overlay;
  }

  /**
   * Hide loading overlay when iframe is ready
   */
  private hideLoadingOverlay(): void {
    const overlay = document.getElementById("villa-loading-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 200);
    }
  }

  /**
   * Create iframe element - modal card on desktop, fullscreen on mobile
   */
  private createIframe(
    scopes: string[],
    params?: Record<string, string>,
  ): HTMLIFrameElement {
    const iframe = document.createElement("iframe");

    const baseUrl = scopes.includes("settings")
      ? this.settingsUrl
      : this.authUrl;
    const url = new URL(baseUrl);
    url.searchParams.set("appId", this.config.appId);
    url.searchParams.set("scopes", scopes.join(","));
    url.searchParams.set("origin", window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    iframe.src = url.toString();
    iframe.id = "villa-auth-iframe";
    iframe.title = "Villa Authentication";

    // Allow passkey credentials
    iframe.allow =
      "publickey-credentials-get *; publickey-credentials-create *";

    // Sandbox with necessary permissions
    iframe.sandbox.add("allow-same-origin");
    iframe.sandbox.add("allow-scripts");
    iframe.sandbox.add("allow-forms");
    iframe.sandbox.add("allow-popups");
    iframe.sandbox.add("allow-popups-to-escape-sandbox");

    // Responsive: modal card on desktop, fullscreen on mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      Object.assign(iframe.style, {
        width: "100%",
        height: "100%",
        border: "none",
        backgroundColor: "transparent",
      });
    } else {
      Object.assign(iframe.style, {
        width: "380px",
        height: "520px",
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "calc(100vh - 48px)",
        border: "none",
        borderRadius: "14px",
        backgroundColor: "#FFFDF8",
        boxShadow:
          "0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        animation: "villa-scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      });
    }

    // Handle load errors
    iframe.onerror = () => {
      this.log("Iframe load error");
      this.emit("error", "Failed to load authentication page", "NETWORK_ERROR");
      this.close();
    };

    return iframe;
  }

  /**
   * Set up postMessage listener with validation
   */
  private setupMessageListener(onReady: () => void): void {
    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event, onReady);
    };
    window.addEventListener("message", this.messageHandler);
  }

  /**
   * Handle incoming postMessage
   */
  private handleMessage(event: MessageEvent, onReady: () => void): void {
    // CRITICAL: Validate origin first
    if (!this.isOriginAllowed(event.origin)) {
      this.log(`Ignoring message from untrusted origin: ${event.origin}`);
      return;
    }

    // Validate message structure
    const message = parseVillaMessage(event.data);
    if (!message) {
      this.log("Ignoring invalid message:", event.data);
      return;
    }

    this.log("Received message:", message.type);

    // Process message
    switch (message.type) {
      case "VILLA_READY":
        this.state = "ready";
        // Clear iframe detection timeout since we got VILLA_READY
        if (this.iframeDetectionTimeoutId) {
          clearTimeout(this.iframeDetectionTimeoutId);
          this.iframeDetectionTimeoutId = null;
        }
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        // Hide loading overlay - iframe content is now visible
        this.hideLoadingOverlay();
        this.emit("ready");
        onReady();
        break;

      case "VILLA_AUTH_SUCCESS":
        this.state = "authenticating";
        this.emit("success", message.payload.identity);
        this.close();
        break;

      case "VILLA_AUTH_CANCEL":
        this.emit("cancel");
        this.close();
        break;

      case "VILLA_AUTH_ERROR":
        this.emit("error", message.payload.error, message.payload.code);
        this.close();
        break;

      case "VILLA_CONSENT_GRANTED":
        this.emit(
          "consent_granted",
          message.payload.appId,
          message.payload.scopes,
        );
        break;

      case "VILLA_CONSENT_DENIED":
        this.emit("consent_denied", message.payload.appId);
        this.close();
        break;
    }
  }

  /**
   * Check if origin is in allowlist
   */
  private isOriginAllowed(origin: string): boolean {
    return validateOrigin(origin);
  }

  /**
   * Emit an event to all listeners
   */
  private emit<E extends BridgeEventName>(
    event: E,
    ...args: Parameters<BridgeEventMap[E]>
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          (callback as Function)(...args);
        } catch (error) {
          console.error(`[VillaBridge] Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Log debug message if debug mode enabled
   */
  private log(...args: unknown[]): void {
    if (this.config.debug || isDevelopment()) {
      console.log("[VillaBridge]", ...args);
    }
  }
}
