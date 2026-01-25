/**
 * Villa SDK Domain Types
 * 
 * Domain-specific language that abstracts Web3 complexity.
 * Uses familiar web terminology instead of blockchain jargon.
 * 
 * Mapping:
 * - Account = Wallet/Address (familiar from every web service)
 * - Action = Transaction (what users DO, not technical mechanism)
 * - Balance = Token balance (formatted, never raw)
 * - Approval = Signature (users "approve" things)
 * - Receipt = Transaction receipt (familiar from e-commerce)
 * - Fee = Gas cost (always in readable currency, never "gwei")
 * 
 * Banned terms (never exposed in public API):
 * - wei, gwei, ether
 * - gas, gasLimit, gasPrice
 * - nonce, calldata, bytecode
 * - ABI, hex, 0x (in user-facing contexts)
 * - RPC, provider, mempool
 * - revert, EIP-, ERC-
 */

import type { AvatarConfig } from "./types";

// =============================================================================
// ACCOUNT (replaces Wallet/Address)
// =============================================================================

/**
 * Villa Account - A user's identity and funds container
 * Abstracts wallet/address complexity into familiar web concepts
 */
export interface Account {
  /** Unique identifier (the address, but we don't call it that) */
  id: string;
  
  /** User's chosen display name */
  nickname: string;
  
  /** Avatar URL (DiceBear generated) */
  avatar: string;
  
  /** Avatar configuration for regeneration */
  avatarConfig?: AvatarConfig;
  
  /** When the account was created */
  createdAt: Date;
  
  /** Optional ENS-style name (alice.villa.eth) */
  displayName?: string;
}

// =============================================================================
// AMOUNT (replaces wei/gwei/ether)
// =============================================================================

/**
 * Money amount - Always human-readable
 * Never exposes raw blockchain units to developers
 */
export interface Amount {
  /** Formatted value (e.g., "1.50", "0.001") */
  value: string;
  
  /** Currency code (e.g., "ETH", "USDC", "USD") */
  currency: string;
  
  /** Display string for UI (e.g., "$1.50", "0.001 ETH") */
  display: string;
}

/**
 * Create an Amount from a numeric value
 */
export function createAmount(
  value: number | string,
  currency: string,
  options?: { locale?: string }
): Amount {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const formatted = numValue.toLocaleString(options?.locale ?? "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
  
  const symbol = currency === "USD" ? "$" : "";
  const suffix = currency !== "USD" ? ` ${currency}` : "";
  
  return {
    value: formatted,
    currency,
    display: `${symbol}${formatted}${suffix}`,
  };
}

// =============================================================================
// ACTION (replaces Transaction)
// =============================================================================

/**
 * Action types - What users DO
 */
export type ActionType =
  | "send"      // Transfer funds to someone
  | "receive"   // Incoming transfer
  | "approve"   // Grant permission to an app
  | "revoke"    // Remove permission from an app
  | "mint"      // Create something (NFT, name)
  | "claim"     // Claim rewards/airdrops
  | "swap"      // Exchange currencies
  | "custom";   // App-specific action

/**
 * Action status - Clear outcome states
 */
export type ActionStatus =
  | "preparing"         // Building the action
  | "awaiting_approval" // Waiting for user to approve
  | "pending"           // Submitted, waiting for confirmation
  | "confirmed"         // Successfully completed
  | "failed";           // Action failed

/**
 * Action - Something a user does that may cost money
 * Replaces "transaction" terminology
 */
export interface Action<T = unknown> {
  /** Unique action identifier */
  id: string;
  
  /** What kind of action */
  type: ActionType;
  
  /** Current status */
  status: ActionStatus;
  
  /** Human-readable description */
  description: string;
  
  /** Estimated or actual fee */
  fee?: Amount;
  
  /** When the action was initiated */
  createdAt: Date;
  
  /** When the action completed (if finished) */
  completedAt?: Date;
  
  /** Action-specific data */
  data?: T;
  
  /** Receipt (available after confirmation) */
  receipt?: Receipt;
}

/**
 * Receipt - Proof that an action completed
 */
export interface Receipt {
  /** Action ID this receipt belongs to */
  actionId: string;
  
  /** Unique receipt identifier */
  id: string;
  
  /** Link to view details */
  detailsUrl: string;
  
  /** When confirmed */
  confirmedAt: Date;
  
  /** Actual fee paid */
  fee: Amount;
}

// =============================================================================
// APPROVAL (replaces Signature)
// =============================================================================

/**
 * Approval request - When an app needs user permission
 */
export interface ApprovalRequest {
  /** What's being requested */
  type: "action" | "data_access" | "connection";
  
  /** Human-readable explanation */
  message: string;
  
  /** App requesting approval */
  app: AppInfo;
  
  /** What happens if approved */
  consequence: string;
  
  /** Optional: estimated cost */
  estimatedFee?: Amount;
}

/**
 * App info - Third-party application details
 */
export interface AppInfo {
  /** App identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** App icon URL */
  icon?: string;
  
  /** App website */
  url?: string;
  
  /** Verification status */
  verified: boolean;
}

// =============================================================================
// CLOUD DATA (TinyCloud integration)
// =============================================================================

/**
 * Data scopes that apps can request
 */
export type Scope =
  | "profile:read"      // Read nickname, avatar
  | "profile:write"     // Update profile (rare)
  | "preferences:read"  // Read user preferences
  | "balance:read"      // See account balance
  | "actions:read"      // See action history
  | "actions:write"     // Initiate actions (requires per-action approval)
  | "data:read"         // Read app-specific data
  | "data:write"        // Write app-specific data
  | "shared:read"       // Read shared data namespaces
  | "shared:write";     // Write to shared data namespaces

/**
 * Pre-defined shared data namespaces
 * Apps can create custom namespaces with user approval
 */
export type SharedNamespace =
  | "contacts"      // Address book
  | "favorites"     // Saved items
  | "history"       // Cross-app activity
  | "achievements"  // Badges, accomplishments
  | "memberships";  // Community memberships

/**
 * Contact entry in shared namespace
 */
export interface Contact {
  id: string;
  nickname: string;
  accountId: string;
  avatar?: string;
  addedAt: string;
  addedBy: string;  // App that added this
  notes?: string;
}

/**
 * Favorite entry in shared namespace
 */
export interface Favorite {
  id: string;
  type: "app" | "token" | "nft" | "link";
  name: string;
  reference: string;
  addedAt: string;
  addedBy: string;
}

/**
 * History entry in shared namespace
 */
export interface HistoryEntry {
  id: string;
  type: string;
  description: string;
  appId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Achievement entry in shared namespace
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  earnedAt: string;
  issuedBy: string;
  proof?: string;  // Verification data
}

/**
 * Membership entry in shared namespace
 */
export interface Membership {
  id: string;
  community: string;
  role?: string;
  joinedAt: string;
  verifiedAt?: string;
  proof?: string;  // ZK proof or signature
}

/**
 * Type-safe shared data schemas
 */
export interface SharedSchemas {
  contacts: Contact[];
  favorites: Favorite[];
  history: HistoryEntry[];
  achievements: Achievement[];
  memberships: Membership[];
}

// =============================================================================
// SDK CONFIGURATION
// =============================================================================

/**
 * Network configuration
 */
export type NetworkConfig =
  | "mainnet"   // Production (Base mainnet)
  | "testnet";  // Testing (Base Sepolia)

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /**
   * Session duration in milliseconds
   * @default 7 * 24 * 60 * 60 * 1000 (7 days)
   */
  sessionDuration?: number;
  
  /**
   * Auto-refresh session before expiry
   * @default true
   */
  autoRefresh?: boolean;
  
  /**
   * Persist session across browser restarts
   * @default true
   */
  persistSession?: boolean;
  
  /**
   * Storage key prefix
   * @default "villa"
   */
  storagePrefix?: string;
}

/**
 * Cloud sync configuration
 */
export interface CloudConfig {
  /**
   * Enable cloud sync
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Sync on sign-in
   * @default true
   */
  syncOnSignIn?: boolean;
  
  /**
   * Sync interval in milliseconds (0 = manual only)
   * @default 60000 (1 minute)
   */
  syncInterval?: number;
  
  /**
   * Conflict resolution strategy
   * @default "server-wins"
   */
  conflictResolution?: "server-wins" | "client-wins" | "manual";
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /**
   * Color mode
   * @default "system"
   */
  mode?: "light" | "dark" | "system";
  
  /**
   * Primary accent color (hex)
   * @default Villa brand color
   */
  accentColor?: string;
  
  /**
   * Border radius scale
   * @default "default"
   */
  borderRadius?: "none" | "small" | "default" | "large";
  
  /**
   * Custom CSS variables
   */
  variables?: Record<string, string>;
}

/**
 * Advanced configuration (escape hatches)
 */
export interface AdvancedConfig {
  /**
   * Override API endpoint
   * @internal
   */
  apiUrl?: string;
  
  /**
   * Override auth endpoint
   * @internal
   */
  authUrl?: string;
  
  /**
   * Custom RPC URL for blockchain operations
   * @example "https://mainnet.base.org" or "https://sepolia.base.org"
   */
  rpcUrl?: string;
  
  /**
   * Chain ID override (auto-detected from network if not set)
   * @example 8453 for Base mainnet, 84532 for Base Sepolia
   */
  chainId?: number;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
  
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * Villa SDK Configuration
 * 
 * Design principles:
 * 1. Zero-config works for 90% of cases
 * 2. Progressive disclosure of advanced options
 * 3. Type-safe with excellent autocomplete
 * 4. Sensible, secure defaults
 */
export interface VillaSDKConfig {
  /**
   * Your application identifier
   * Used for analytics, consent tracking, and app-specific data
   * 
   * @example "my-awesome-app"
   */
  appId: string;
  
  /**
   * Application display name (shown in consent dialogs)
   * @default Derived from appId
   */
  appName?: string;
  
  /**
   * Application icon URL (shown in consent dialogs)
   */
  appIcon?: string;
  
  /**
   * Network environment
   * @default "mainnet"
   */
  network?: NetworkConfig;
  
  /**
   * Data scopes to request on sign-in
   * @default ["profile:read"]
   */
  scopes?: Scope[];
  
  /**
   * Authentication options
   */
  auth?: AuthConfig;
  
  /**
   * Cloud sync options
   */
  cloud?: CloudConfig;
  
  /**
   * UI customization
   */
  theme?: ThemeConfig;
  
  /**
   * Advanced options (most apps won't need these)
   */
  advanced?: AdvancedConfig;
}

/**
 * Create SDK configuration with sensible defaults
 */
export function defineConfig(config: VillaSDKConfig): VillaSDKConfig {
  return {
    appId: config.appId,
    appName: config.appName ?? config.appId,
    appIcon: config.appIcon,
    network: config.network ?? "mainnet",
    scopes: config.scopes ?? ["profile:read"],
    auth: {
      sessionDuration: 7 * 24 * 60 * 60 * 1000,
      autoRefresh: true,
      persistSession: true,
      storagePrefix: "villa",
      ...config.auth,
    },
    cloud: {
      enabled: true,
      syncOnSignIn: true,
      syncInterval: 60000,
      conflictResolution: "server-wins",
      ...config.cloud,
    },
    theme: {
      mode: "system",
      borderRadius: "default",
      ...config.theme,
    },
    advanced: {
      debug: false,
      timeout: 30000,
      ...config.advanced,
    },
  };
}

// =============================================================================
// CLOUD CLIENT INTERFACE
// =============================================================================

/**
 * Villa Cloud client interface - Type-safe cloud data access
 * Will be implemented with TinyCloud backend
 */
export interface VillaCloudClient {
  /**
   * Profile operations
   */
  profile: {
    get(): Promise<Account | null>;
    update(data: Partial<Pick<Account, "nickname" | "avatarConfig">>): Promise<Account>;
  };
  
  /**
   * App-specific data (isolated per app)
   */
  data: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
  };
  
  /**
   * Shared data (cross-app, user-controlled)
   */
  shared: {
    /**
     * Read from a shared namespace
     * Requires 'shared:read' scope
     */
    get<K extends keyof SharedSchemas>(
      namespace: K
    ): Promise<SharedSchemas[K]>;
    
    /**
     * Add to a shared namespace
     * Requires 'shared:write' scope
     */
    add<K extends keyof SharedSchemas>(
      namespace: K,
      item: SharedSchemas[K][number]
    ): Promise<void>;
    
    /**
     * Remove from a shared namespace
     */
    remove<K extends keyof SharedSchemas>(
      namespace: K,
      itemId: string
    ): Promise<void>;
  };
}
