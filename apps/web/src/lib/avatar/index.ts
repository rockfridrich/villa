/**
 * Avatar System - Public API
 * WU-4: Re-exports avatar generation functions
 */

// Generator functions (low-level)
export {
  generateAvatarFromSelection,
  generateAvatarDataUrl,
  generateAvatarPng,
  svgToPng,
  createAvatarConfig,
} from './generator'

// Unified API (recommended for SDK consumers)
export {
  // Types
  type Avatar,
  type GeneratedAvatar,
  type AvatarFormat,
  type AvatarUrlOptions,
  type ResolvedAvatar,
  // Type guards
  isCustomAvatar,
  isGeneratedAvatar,
  isLegacyAvatarConfig,
  // Conversion
  toUnifiedAvatar,
  normalizeAvatar,
  // Core API
  getAvatarUrl,
  getAvatarUrlSync,
  getDefaultAvatarUrl,
  getAvatarSvg,
  resolveAvatar,
} from './unified'
