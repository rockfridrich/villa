export {
  validateAvatarFile,
  getImageDimensions,
  cropAndResizeImage,
  blobToDataUrl,
  hashData,
  createCustomAvatar,
  AvatarStorage,
  avatarStorage,
  AVATAR_LIMITS,
} from './tinycloud'

export type {
  CustomAvatar,
  AvatarValidationResult,
  AllowedImageType,
} from './tinycloud'

// TinyCloud client for cross-device storage
export {
  getTinyCloud,
  isTinyCloudConnected,
  disconnectTinyCloud,
  VillaStorage,
  avatarStore,
  preferencesStore,
  sessionStore,
  syncToTinyCloud,
  updateSession,
  STORAGE_KEYS,
} from './tinycloud-client'

export type {
  VillaPreferences,
  VillaSession,
} from './tinycloud-client'
