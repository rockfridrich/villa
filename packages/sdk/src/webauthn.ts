/**
 * @villa/sdk - WebAuthn Types
 *
 * Shared WebAuthn credential and authentication types for Villa auth system.
 * Used by both the auth server and client SDK.
 */

/** WebAuthn credential stored in Villa backend */
export interface WebAuthnCredential {
  /** Credential ID (base64url encoded) */
  id: string
  /** Public key for verification */
  publicKey: Uint8Array
  /** Signature counter for replay protection */
  counter: number
  /** Available authenticator transports */
  transports?: AuthenticatorTransport[]
  /** Credential creation timestamp */
  createdAt: number
}

/** Challenge for WebAuthn ceremony */
export interface AuthChallenge {
  /** Random challenge string (base64url encoded) */
  challenge: string
  /** User identifier */
  userId: string
  /** Challenge expiry timestamp */
  expiresAt: number
}

/** Authenticated session token */
export interface VillaSession {
  /** JWT or session token */
  token: string
  /** Authenticated user identity */
  identity: VillaIdentity
  /** Session expiry timestamp */
  expiresAt: number
}

/** User identity from WebAuthn authentication */
export interface VillaIdentity {
  /** Ethereum address derived from passkey */
  address: string
  /** User's chosen nickname */
  nickname?: string
  /** Display name for UI */
  displayName?: string
  /** Avatar URL or config */
  avatar?: string
  /** Credential ID used for this session */
  credentialId: string
}

// Registration flow types

/** Options for WebAuthn registration (create credential) */
export interface RegistrationOptions {
  /** Random challenge */
  challenge: string
  /** Relying Party information */
  rp: { name: string; id: string }
  /** User information */
  user: { id: string; name: string; displayName: string }
  /** Supported public key algorithms */
  pubKeyCredParams: PublicKeyCredentialParameters[]
  /** Timeout in milliseconds */
  timeout: number
  /** Attestation conveyance preference */
  attestation: AttestationConveyancePreference
  /** Authenticator selection criteria */
  authenticatorSelection: AuthenticatorSelectionCriteria
}

/** Response from navigator.credentials.create() */
export interface RegistrationResponse {
  /** Credential ID (base64url) */
  id: string
  /** Credential ID (raw) */
  rawId: string
  /** Attestation response */
  response: {
    /** Client data JSON */
    clientDataJSON: string
    /** Attestation object */
    attestationObject: string
  }
  /** Credential type */
  type: 'public-key'
}

// Authentication flow types

/** Options for WebAuthn authentication (get assertion) */
export interface AuthenticationOptions {
  /** Random challenge */
  challenge: string
  /** Relying Party ID */
  rpId: string
  /** Timeout in milliseconds */
  timeout: number
  /** Allowed credentials (empty = any registered credential) */
  allowCredentials?: PublicKeyCredentialDescriptor[]
  /** User verification requirement */
  userVerification: UserVerificationRequirement
}

/** Response from navigator.credentials.get() */
export interface AuthenticationResponse {
  /** Credential ID (base64url) */
  id: string
  /** Credential ID (raw) */
  rawId: string
  /** Assertion response */
  response: {
    /** Client data JSON */
    clientDataJSON: string
    /** Authenticator data */
    authenticatorData: string
    /** Signature */
    signature: string
    /** User handle (optional) */
    userHandle?: string
  }
  /** Credential type */
  type: 'public-key'
}

// PostMessage communication types

/** Message types for iframe<->parent communication */
export type AuthMessageType =
  | 'VILLA_AUTH_READY'
  | 'VILLA_AUTH_SUCCESS'
  | 'VILLA_AUTH_ERROR'
  | 'VILLA_AUTH_CANCEL'
  | 'VILLA_AUTH_REQUEST'

/** Message structure for auth communication */
export interface AuthMessage {
  /** Message type */
  type: AuthMessageType
  /** Optional payload (identity, error, or request data) */
  payload?: VillaIdentity | { error: string } | { appId: string }
}

// SDK configuration

/** Configuration for Villa Auth SDK */
export interface VillaAuthConfig {
  /** Application identifier for consent tracking */
  appId: string
  /** Auth server URL (defaults to https://key.villa.cash) */
  authUrl?: string
  /** API server URL (defaults to https://api.villa.cash or same-origin) */
  apiUrl?: string
  /** Relying Party ID (defaults to villa.cash) */
  rpId?: string
}
