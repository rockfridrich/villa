/**
 * @villa/sdk - Villa Identity SDK
 *
 * Privacy-first identity SDK for pop-up villages.
 * Wraps Porto passkey authentication with Villa theming.
 *
 * Network: Base (primary), Base Sepolia (testnet)
 */

// Main SDK client
export { Villa } from './client'
export type {
  Scope,
  SignInOptions,
  SignInProgress,
  SignInErrorCode,
  SignInResult,
} from './client'

// Core utilities
export { resolveEns, reverseEns } from './ens'
export { getAvatarUrl, createAvatarConfig } from './avatar'

// Auth utilities
export { signIn, signOut, isAuthenticated, getIdentity } from './auth'
export type { AuthOptions } from './auth'

// Session utilities
export { saveSession, loadSession, clearSession } from './session'

// Iframe utilities (advanced usage)
export { createAuthIframe, destroyAuthIframe } from './iframe'
export type { IframeConfig, AuthMessage } from './iframe'

// Iframe bridge (new API)
export { VillaBridge } from './iframe/bridge'
export type {
  BridgeConfig,
  BridgeState,
  BridgeEventName,
  BridgeEventMap,
  VillaMessage,
  ParentMessage,
  VillaErrorCode,
} from './iframe/types'
export {
  validateOrigin,
  parseVillaMessage,
  parseParentMessage,
  ALLOWED_ORIGINS,
} from './iframe/validation'

// Wallet utilities (secure key generation & backup)
export {
  generateWallet,
  importWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  exportBackup,
  importBackup,
  isValidPrivateKey,
  createLocalStorage,
} from './wallet'
export type {
  EncryptedWallet,
  WalletResult,
  EncryptionOptions,
  WalletStorage,
} from './wallet'

// Contract addresses and utilities
export {
  getContracts,
  getContractsForChain,
  getNicknameResolverAddress,
  getRecoverySignerAddress,
  isDeployed,
  CONTRACTS,
  DEPLOYED_CHAINS,
} from './contracts'
export type { ContractDeployment, ChainContracts } from './contracts'

// Types - all shared types for the ecosystem
export type {
  Identity,
  AvatarConfig,
  Profile,
  NicknameCheckResult,
  VillaConfig,
  VillaSession,
  Result,
} from './types'

// WebAuthn types - authentication primitives
export type {
  WebAuthnCredential,
  AuthChallenge,
  VillaIdentity,
  RegistrationOptions,
  RegistrationResponse,
  AuthenticationOptions,
  AuthenticationResponse,
  VillaAuthConfig,
} from './webauthn'
// Note: AuthMessage and AuthMessageType not exported to avoid conflict with iframe.ts
