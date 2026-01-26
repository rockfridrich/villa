/**
 * @villa/sdk - Villa Identity SDK
 *
 * Privacy-first identity SDK for pop-up villages.
 * Wraps Porto passkey authentication with Villa theming.
 *
 * Network: Base (primary), Base Sepolia (testnet)
 */

// Simplified API (recommended)
export {
  villa,
  signInWithVilla,
  getVillaUser,
  signOutVilla,
  syncProfileToTinyCloud,
  loadProfileFromTinyCloud,
} from "./simple";
export type { VillaUser, SimpleProfile, SimpleSignInOptions, SettingsResult } from "./simple";

// Main SDK client (advanced)
export { Villa } from "./client";
export type {
  Scope,
  SignInOptions,
  SignInProgress,
  SignInErrorCode,
  SignInResult,
} from "./client";

// Core utilities
export { resolveEns, reverseEns } from "./ens";
export { getAvatarUrl, createAvatarConfig } from "./avatar";

// Auth utilities
export { signIn, signOut, isAuthenticated, getIdentity } from "./auth";
export type { AuthOptions } from "./auth";

// Session utilities
export { saveSession, loadSession, clearSession } from "./session";

// Iframe utilities (advanced usage)
export { createAuthIframe, destroyAuthIframe } from "./iframe";
export type { IframeConfig, AuthMessage } from "./iframe";

// Iframe bridge (new API)
export { VillaBridge } from "./iframe/bridge";
export type {
  BridgeConfig,
  BridgeState,
  BridgeEventName,
  BridgeEventMap,
  VillaMessage,
  ParentMessage,
  VillaErrorCode,
} from "./iframe/types";
export {
  validateOrigin,
  parseVillaMessage,
  parseParentMessage,
  ALLOWED_ORIGINS,
} from "./iframe/validation";

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
} from "./wallet";
export type {
  EncryptedWallet,
  WalletResult,
  EncryptionOptions,
  WalletStorage,
} from "./wallet";

// Contract addresses and utilities
export {
  getContracts,
  getContractsForChain,
  getNicknameResolverAddress,
  getRecoverySignerAddress,
  isDeployed,
  CONTRACTS,
  DEPLOYED_CHAINS,
} from "./contracts";
export type { ContractDeployment, ChainContracts } from "./contracts";

// Target configuration (static defaults)
export { TARGETS, getTargetConfig, deriveAppId } from "./config";
export type { Target } from "./config";

// Runtime config (dynamically loaded)
export { loadConfigManifest, getEndpoints, getChain, clearConfigCache, DEFAULT_CONFIG } from "./config-loader";
export { VillaConfigManifestSchema } from "./config-schema";
export type { VillaConfigManifest, VillaEndpoints, VillaTarget } from "./config-schema";

// Auth utilities - WebAuthn error handling & browser capabilities
export {
  PasskeyManagerType,
  WebAuthnErrorCode,
  parseWebAuthnError,
  detectBrowserCapabilities,
  isPasskeySupported,
  getPasskeyManagerName,
  getPortoHost,
  getChainConfig,
  validatePortoConfig,
  createVillaTheme,
} from "./auth-utils";
export type {
  BrowserCapabilities,
  WebAuthnError,
  PortoMode,
  PortoThemeConfig,
  PortoConfig,
} from "./auth-utils";

// Types - all shared types for the ecosystem
export type {
  Identity,
  AvatarStyle,
  AvatarConfig,
  Profile,
  NicknameCheckResult,
  VillaConfig,
  VillaSession,
  Result,
} from "./types";

// Domain types - Villa-native language hiding Web3 complexity
export {
  createAmount,
  defineConfig,
} from "./domain";
export type {
  Account,
  Amount,
  ActionType,
  ActionStatus,
  Action,
  Receipt,
  ApprovalRequest,
  AppInfo,
  Scope as DomainScope,
  SharedNamespace,
  Contact,
  Favorite,
  HistoryEntry,
  Achievement,
  Membership,
  SharedSchemas,
  NetworkConfig,
  AuthConfig,
  CloudConfig,
  ThemeConfig,
  AdvancedConfig,
  VillaSDKConfig,
  VillaCloudClient,
} from "./domain";

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
} from "./webauthn";
// Note: AuthMessage and AuthMessageType not exported to avoid conflict with iframe.ts

// TinyCloud integration - passkey-governed user data sync
export {
  VILLA_PREFIX,
  TINYCLOUD_KEYS,
  getTinyCloudClient,
  signInToTinyCloud,
  getTinyCloudSession,
  isTinyCloudSignedIn,
  signOutFromTinyCloud,
  saveProfile,
  getProfile,
  updateProfile,
  savePreferences,
  getPreferences,
  saveOnchainStatus,
  getOnchainStatus,
  recordNicknameMint,
  syncProfile,
} from "./tinycloud";
export type {
  VillaProfile,
  VillaPreferences,
  VillaOnchainStatus,
  TinyCloudConfig,
  TinyCloudSession,
} from "./tinycloud";

// Nickname generation
export {
  generateNickname,
  generateUniqueNickname,
  validateNickname,
  normalizeNickname,
  isReservedNickname,
  getAvailableAdjectives,
  getAvailableNouns,
  NICKNAME_RULES,
} from "./nickname-generator";
export type {
  NicknameValidationError,
  NicknameValidationResult,
} from "./nickname-generator";
