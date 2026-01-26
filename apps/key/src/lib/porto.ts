import { Porto, Mode } from "porto";
import { Porto as RemotePorto, Actions, Events } from "porto/remote";
import * as Chains from "porto/core/Chains";

/**
 * Porto Relay Mode for Villa
 *
 * Uses relay mode so Villa controls all UI - no Porto dialog appears.
 * Passkeys are bound to villa.cash domain (not id.porto.sh).
 *
 * Flow:
 * 1. Villa UI shows branded passkey prompt
 * 2. Porto relay mode handles WebAuthn under the hood
 * 3. Browser shows native passkey dialog (1Password, iCloud, etc)
 * 4. Villa UI shows success/error state
 */

function getPortoChains():
  | readonly [typeof Chains.base]
  | readonly [typeof Chains.baseSepolia] {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === "84532") {
    return [Chains.baseSepolia] as const;
  }
  return [Chains.base] as const;
}

/**
 * Villa Passkey Domain Configuration
 *
 * keystoreHost determines the WebAuthn Relying Party ID (rpId).
 * Passkeys are permanently bound to this domain - users see "villa.cash"
 * in browser/OS passkey prompts instead of "porto.sh".
 * 
 * For LAN testing: WebAuthn requires rpId to match the origin's hostname.
 * IP-based origins cannot use domain suffix matching.
 */
function getKeystoreHost(): string {
  if (typeof window === "undefined") return "villa.cash";
  
  const hostname = window.location.hostname;
  
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "localhost";
  }
  
  const isLanIp = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/.test(hostname);
  if (isLanIp && process.env.NODE_ENV === "development") {
    return hostname;
  }
  
  return "villa.cash";
}

const VILLA_KEYSTORE_HOST = getKeystoreHost();

/**
 * WebAuthn event handlers for Villa UI feedback
 */
export interface WebAuthnHandlers {
  onPasskeyCreate?: () => void;
  onPasskeyGet?: () => void;
  onComplete?: (result: { address: string }) => void;
  onError?: (error: Error) => void;
}

let webAuthnHandlers: WebAuthnHandlers = {};

/**
 * Set WebAuthn handlers for UI feedback
 * Call this before createAccount/signIn to get UI callbacks
 */
export function setWebAuthnHandlers(handlers: WebAuthnHandlers): void {
  webAuthnHandlers = handlers;
}

let portoInstance: ReturnType<typeof Porto.create> | null = null;

/**
 * Get Porto instance in relay mode
 * Villa controls all UI, Porto handles passkey infrastructure
 */
export function getPorto(): ReturnType<typeof Porto.create> {
  if (!portoInstance) {
    portoInstance = Porto.create({
      chains: getPortoChains(),
      mode: Mode.relay({
        keystoreHost: VILLA_KEYSTORE_HOST,
        webAuthn: {
          createFn: async (options) => {
            if (!options) {
              throw new Error("WebAuthn creation options are required");
            }
            const createOptions = options as CredentialCreationOptions;
            // Override rp.name to show "Villa" in passkey managers
            if (createOptions.publicKey?.rp) {
              createOptions.publicKey.rp.name = "Villa";
            }
            // Set displayName for better identification in password managers
            if (createOptions.publicKey?.user) {
              createOptions.publicKey.user.displayName = "Your Villa Key";
            }
            // Notify Villa UI that passkey creation is starting
            webAuthnHandlers.onPasskeyCreate?.();
            // Browser shows biometric prompt
            const credential =
              await navigator.credentials.create(createOptions);
            return credential as PublicKeyCredential;
          },
          getFn: async (options) => {
            if (!options) {
              throw new Error("WebAuthn request options are required");
            }
            // Notify Villa UI that passkey selection is starting
            webAuthnHandlers.onPasskeyGet?.();
            // Browser shows biometric prompt
            const assertion = await navigator.credentials.get(
              options as CredentialRequestOptions,
            );
            return assertion as PublicKeyCredential;
          },
        },
      }),
    });
  }
  return portoInstance;
}

export function resetPorto(): void {
  portoInstance = null;
}

export interface ConnectResult {
  success: true;
  address: string;
}

export interface ConnectError {
  success: false;
  error: Error;
}

export type PortoConnectResult = ConnectResult | ConnectError;

/**
 * Create a new Villa account with passkey
 * Villa UI controls the flow, no Porto dialog shown
 */
export async function createAccount(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto();

    const result = await porto.provider.request({
      method: "wallet_connect",
      params: [
        {
          capabilities: {
            createAccount: true,
            email: false,
          },
        },
      ],
    });

    const response = result as unknown as {
      accounts: readonly { address: string }[];
    };

    if (response.accounts && response.accounts.length > 0) {
      const address = response.accounts[0].address;
      webAuthnHandlers.onComplete?.({ address });
      return {
        success: true,
        address,
      };
    }

    return {
      success: false,
      error: new Error("No account returned from Porto"),
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    webAuthnHandlers.onError?.(error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Sign in with existing Villa passkey
 * Villa UI controls the flow, no Porto dialog shown
 */
export async function signIn(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto();

    const accounts = await porto.provider.request({
      method: "eth_requestAccounts",
    });

    if (accounts && accounts.length > 0) {
      const address = accounts[0];
      webAuthnHandlers.onComplete?.({ address });
      return {
        success: true,
        address,
      };
    }

    return {
      success: false,
      error: new Error("No account selected"),
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    webAuthnHandlers.onError?.(error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Check if Porto/WebAuthn is supported in this browser
 */
export function isPortoSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/**
 * Check if user has existing accounts (without triggering WebAuthn)
 * Returns true if accounts exist, false otherwise
 */
export async function hasExistingAccounts(): Promise<boolean> {
  try {
    const porto = getPorto();
    const accounts = await porto.provider.request({
      method: "wallet_getAccounts",
    });
    return Array.isArray(accounts) && accounts.length > 0;
  } catch {
    return false;
  }
}

let remotePortoInstance: ReturnType<typeof RemotePorto.create> | null = null;

/**
 * Get Remote Porto instance for receiving RPC requests from parent
 * This is used when key.villa.cash/auth is opened as an iframe/popup by
 * an SDK using Mode.dialog({ host: 'key.villa.cash/auth' })
 */
export function getRemotePorto(): ReturnType<typeof RemotePorto.create> {
  if (!remotePortoInstance) {
    remotePortoInstance = RemotePorto.create({
      chains: getPortoChains(),
      mode: Mode.relay({
        keystoreHost: VILLA_KEYSTORE_HOST,
        webAuthn: {
          createFn: async (options) => {
            if (!options) {
              throw new Error("WebAuthn creation options are required");
            }
            const createOptions = options as CredentialCreationOptions;
            if (createOptions.publicKey?.rp) {
              createOptions.publicKey.rp.name = "Villa";
            }
            // Set displayName for better identification in password managers
            if (createOptions.publicKey?.user) {
              createOptions.publicKey.user.displayName = "Your Villa Key";
            }
            webAuthnHandlers.onPasskeyCreate?.();
            const credential = await navigator.credentials.create(createOptions);
            return credential as PublicKeyCredential;
          },
          getFn: async (options) => {
            if (!options) {
              throw new Error("WebAuthn request options are required");
            }
            webAuthnHandlers.onPasskeyGet?.();
            const assertion = await navigator.credentials.get(
              options as CredentialRequestOptions
            );
            return assertion as PublicKeyCredential;
          },
        },
      }),
    });
  }
  return remotePortoInstance;
}

/**
 * Initialize the remote Porto bridge for receiving RPC requests
 * Call this when the auth page loads in iframe/popup mode
 */
export async function initRemoteBridge(): Promise<void> {
  const porto = getRemotePorto();
  await porto.ready();
}

export { Actions as RemoteActions, Events as RemoteEvents };
