export {
  generateAvatarFromSelection,
  generateAvatarDataUrl,
  generateAvatarPng,
  svgToPng,
  createAvatarConfig,
} from "./generator";

export {
  generateAvatarSvgFromSeed,
  generateAvatarDataUrlFromSeed,
  generateRandomSeed,
  isValidAvatarStyle,
} from "./dicebear";

export {
  isNewAvatarConfig,
  generateAvatarFromConfig,
  generateAvatarDataUrlFromConfig,
} from "./utils";

export {
  type Avatar,
  type GeneratedAvatar,
  type AvatarFormat,
  type AvatarUrlOptions,
  type ResolvedAvatar,
  isCustomAvatar,
  isGeneratedAvatar,
  isLegacyAvatarConfig,
  toUnifiedAvatar,
  normalizeAvatar,
  getAvatarUrl,
  getAvatarUrlSync,
  getDefaultAvatarUrl,
  getAvatarSvg,
  resolveAvatar,
} from "./unified";

export {
  type EmojiAvatarConfig,
  getEmojiForAddress,
  getEmojiAvatarUrl,
  isEmojiAvatar,
  createEmojiAvatarConfig,
} from "./emoji";
