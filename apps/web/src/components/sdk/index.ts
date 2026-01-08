/**
 * SDK Components - Public exports
 */

// Core auth flow (one-prompt integration)
export { VillaAuth } from './VillaAuth'
export type { VillaAuthResult, VillaAuthError, VillaAuthResponse } from './VillaAuth'

// Profile settings (post-auth editing)
export { ProfileSettings } from './ProfileSettings'
export type { ProfileSettingsProps, ProfileData, ProfileUpdate } from './ProfileSettings'

// Avatar components
export { AvatarPreview } from './AvatarPreview'
export { AvatarSelection } from './AvatarSelection'
export { AvatarUpload } from './AvatarUpload'
export { AvatarImage, AvatarImageWithFallback } from './AvatarImage'

// Individual components (for custom flows)
export { ConsentRequest } from './ConsentRequest'
export { FaceRecoverySetup } from './FaceRecoverySetup'
export { NicknameSelection } from './NicknameSelection'
export { PasskeyPrompt } from './PasskeyPrompt'
export type { PasskeyPromptProps } from './PasskeyPrompt'
export { SignInWelcome } from './SignInWelcome'
export { VillaAuthScreen } from './VillaAuthScreen'
export type { VillaAuthScreenProps } from './VillaAuthScreen'

// Profile sub-components
export { ProfileSection, EditableField } from './profile'
