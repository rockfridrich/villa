/**
 * Core identity types for Villa Identity System
 * WU-0: Shared types - read-only after commit
 */

/** Avatar style - avataaars for gendered, bottts for neutral */
export type AvatarStyle = 'avataaars' | 'bottts'

/** User-facing avatar style selection */
export type AvatarStyleSelection = 'male' | 'female' | 'other'

/** Avatar configuration stored in profile */
export interface AvatarConfig {
  /** DiceBear style to use */
  style: AvatarStyle
  /** User's style selection (maps to DiceBear style) */
  selection: AvatarStyleSelection
  /** Variant number for deterministic generation */
  variant: number
}

/** Complete Villa identity */
export interface VillaIdentity {
  /** Porto wallet address (0x...) */
  walletAddress: string
  /** User's chosen nickname (null if not set) */
  nickname: string | null
  /** Avatar configuration (null if not set) */
  avatar: AvatarConfig | null
  /** Whether this is a new user (just created) */
  isNewUser: boolean
}

/** Public profile data (shareable with apps) */
export interface PublicProfile {
  nickname: string | null
  avatar: AvatarConfig | null
  walletAddress: string
}

/** Device information for private profile */
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  os: string
  browser: string
  screenWidth: number
  screenHeight: number
}

/** Private profile data (never shared with apps) */
export interface PrivateProfile {
  registeredAt: string
  locale: string
  timezone: string
  device: DeviceInfo
  deviceId: string
  previousDeviceIds: string[]
}

/** Full user profile */
export interface UserProfile {
  public: PublicProfile
  private: PrivateProfile
}

/** Data scopes that apps can request */
export type DataScope = 'nickname' | 'avatar' | 'wallet' | 'appData'

/** Style mapping from user selection to DiceBear style */
export const AVATAR_STYLE_MAP: Record<AvatarStyleSelection, AvatarStyle> = {
  male: 'avataaars',
  female: 'avataaars',
  other: 'bottts',
} as const

/** Default avatar configuration */
export const DEFAULT_AVATAR: AvatarConfig = {
  style: 'avataaars',
  selection: 'female',
  variant: 0,
}
