/**
 * Contracts - Re-exports
 */

// Client functions
export {
  publicClient,
  anvilChain,
  ANVIL_ACCOUNTS,
  SUPPORTED_CHAINS,
  getWalletClient,
  getPublicClient,
  getChain,
  getCurrentChain,
  isChainConnected,
  isAnvilRunning, // deprecated
} from './client'

// Biometric functions
export {
  enrollFace,
  isEnrolled,
  getFaceKeyHash,
  waitForTransaction,
  getContractAddresses,
  LOCAL_ADDRESSES, // deprecated
} from './biometric'
