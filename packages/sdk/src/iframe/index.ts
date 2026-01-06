/**
 * @villa/sdk - Iframe Module
 *
 * PostMessage bridge and utilities for iframe-based authentication.
 */

// Main bridge class
export { VillaBridge } from './bridge'

// Types
export type {
  BridgeConfig,
  BridgeState,
  BridgeEventName,
  BridgeEventMap,
  VillaMessage,
  ParentMessage,
  BridgeMessage,
  VillaErrorCode,
} from './types'

// Validation utilities
export {
  validateOrigin,
  parseVillaMessage,
  parseParentMessage,
  isDevelopment,
  getValidOrigins,
  ALLOWED_ORIGINS,
  DEV_ORIGINS,
} from './validation'
