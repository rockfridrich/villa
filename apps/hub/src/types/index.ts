/**
 * Villa Identity System - Shared Types
 * WU-0: Re-exports all types for convenient importing
 */

// Identity types
export type {
  AvatarStyle,
  AvatarStyleSelection,
  LegacyAvatarConfig,
  NewAvatarConfig,
  AvatarConfig,
  VillaIdentity,
  PublicProfile,
  PrivateProfile,
  DeviceInfo,
  UserProfile,
  DataScope,
} from "./identity";

export {
  LEGACY_AVATAR_STYLE_MAP,
  LEGACY_DEFAULT_AVATAR,
  DEFAULT_AVATAR,
} from "./identity";
