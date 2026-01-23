/**
 * @rockfridrich/villa-sdk-react
 *
 * React bindings for Villa SDK
 * Privacy-first passkey authentication for Base network
 */

// Simple API (recommended)
export { useVilla } from "./useVilla";
export { VillaButton } from "./VillaButton";
export type { VillaButtonProps } from "./VillaButton";

// Context & Provider (advanced)
export { VillaProvider, useVillaContext } from "./context";
export type {
  VillaAuthResult,
  VillaAuthError,
  VillaAuthResponse,
} from "./context";

// Hooks (advanced)
export { useIdentity, useAuth, useVillaConfig } from "./hooks";

// Components
export { VillaAuth, Avatar, AvatarPreview, Web3Avatar } from "./components";

// Re-export types from core SDK
export type {
  Identity,
  AvatarConfig,
  VillaConfig,
  SignInResult,
  SignInErrorCode,
} from "@rockfridrich/villa-sdk";
