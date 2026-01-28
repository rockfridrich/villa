/**
 * @villa/sdk - Shared Types
 *
 * Types used across Villa SDK and apps.
 * These types are read-only after WU-1 (to prevent conflicts in parallel development).
 */

/** User identity from Porto passkey */
export interface Identity {
  /** Ethereum address derived from passkey */
  address: `0x${string}`;
  /** User's chosen nickname (optional during initial auth, set in onboarding) */
  nickname?: string;
  /** Avatar configuration (optional during initial auth) */
  avatar?: AvatarConfig;
}

// Preserve backwards compatibility with old type
export type VillaUser = Identity & {
  avatar?: string | AvatarConfig;
};

/** Supported avatar styles (DiceBear collection names) */
export type AvatarStyle =
  | "lorelei"
  | "adventurer"
  | "avataaars"
  | "bottts"
  | "thumbs";

/** Avatar configuration for deterministic generation */
export interface AvatarConfig {
  /** DiceBear style name */
  style: AvatarStyle;
  /** Seed for deterministic generation (usually address or nickname) */
  seed: string;
  /** Optional gender preference for gendered styles */
  gender?: "male" | "female" | "other";
}

/** Full profile with optional metadata */
export interface Profile extends Identity {
  /** ENS name if registered (e.g., alice.villa.eth) */
  ens?: string;
  /** Account creation timestamp */
  createdAt?: number;
}

/** Result from nickname availability check */
export interface NicknameCheckResult {
  /** Whether the nickname is available */
  available: boolean;
  /** Normalized version of the nickname */
  normalized: string;
  /** Suggested alternative if unavailable */
  suggestion?: string;
}

/** Villa SDK configuration */
export interface VillaConfig {
  /** Application identifier for consent tracking (optional - auto-derived from origin if not provided) */
  appId?: string;
  /** Target environment: "beta" (construction.villa.cash), "production" (villa.cash), or "local" */
  target?: "beta" | "production" | "local";
  /** Enable debug logging */
  debug?: boolean;
  /** Network: "base" (mainnet) or "base-sepolia" (testnet, default for alpha) */
  network?: "base" | "base-sepolia";
  /** Override API URL (defaults to api.villa.cash) */
  apiUrl?: string;
  /** Custom RPC URL for blockchain operations */
  rpcUrl?: string;
}

/** Session state for authenticated users */
export interface VillaSession {
  /** Current identity */
  identity: Identity;
  /** Session expiry timestamp */
  expiresAt: number;
  /** Whether the session is still valid */
  isValid: boolean;
}

/** Result type for SDK operations */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
