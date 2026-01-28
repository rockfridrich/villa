/**
 * Core identity types for Villa Identity System
 * WU-0: Shared types - read-only after commit
 */

/** Avatar style - DiceBear collection names */
export type AvatarStyle = "lorelei" | "adventurer" | "avataaars" | "web3";

/** User-facing avatar style selection */
export type AvatarStyleSelection = "male" | "female" | "other";

/** Legacy avatar configuration (kept for backward compatibility) */
export interface LegacyAvatarConfig {
  /** DiceBear style to use */
  style: "avataaars" | "bottts";
  /** User's style selection (maps to DiceBear style) */
  selection: AvatarStyleSelection;
  /** Variant number for deterministic generation */
  variant: number;
}

/** New avatar configuration with seed-based generation */
export interface NewAvatarConfig {
  /** DiceBear style to use */
  style: AvatarStyle;
  /** Random seed for generation */
  seed: string;
}

/** Avatar configuration stored in profile - union type for backward compatibility */
export type AvatarConfig = LegacyAvatarConfig | NewAvatarConfig;

/** Complete Villa identity */
export interface VillaIdentity {
  /** Porto wallet address (0x...) */
  walletAddress: string;
  /** User's chosen nickname (null if not set) */
  nickname: string | null;
  /** Avatar configuration (null if not set) */
  avatar: AvatarConfig | null;
  /** Whether this is a new user (just created) */
  isNewUser: boolean;
}

/** Public profile data (shareable with apps) */
export interface PublicProfile {
  nickname: string | null;
  avatar: AvatarConfig | null;
  walletAddress: string;
}

/** Device information for private profile */
export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
}

/** Private profile data (never shared with apps) */
export interface PrivateProfile {
  registeredAt: string;
  locale: string;
  timezone: string;
  device: DeviceInfo;
  deviceId: string;
  previousDeviceIds: string[];
}

/** Full user profile */
export interface UserProfile {
  public: PublicProfile;
  private: PrivateProfile;
}

/** Data scopes that apps can request */
export type DataScope = "nickname" | "avatar" | "wallet" | "appData";

/** Style mapping from user selection to legacy DiceBear style */
export const LEGACY_AVATAR_STYLE_MAP: Record<
  AvatarStyleSelection,
  "avataaars" | "bottts"
> = {
  male: "avataaars",
  female: "avataaars",
  other: "bottts",
} as const;

/** Legacy default avatar configuration */
export const LEGACY_DEFAULT_AVATAR: LegacyAvatarConfig = {
  style: "avataaars",
  selection: "female",
  variant: 0,
};

/** New default avatar configuration */
export const DEFAULT_AVATAR: NewAvatarConfig = {
  style: "lorelei",
  seed: "default-seed",
};
