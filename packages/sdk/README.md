# @rockfridrich/villa-sdk

Privacy-first passkey authentication for Base network. No wallets. No passwords. Just Face ID.

[![npm version](https://img.shields.io/npm/v/@rockfridrich/villa-sdk.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@rockfridrich/villa-sdk.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Security & Trust

| Guarantee                       | Implementation                      |
| ------------------------------- | ----------------------------------- |
| **Passkeys never leave device** | WebAuthn hardware-bound keys        |
| **Zero knowledge**              | Villa never sees your private key   |
| **Trustless deploys**           | npm provenance attestation via OIDC |
| **Minimal dependencies**        | Only `viem` + `zod` (peer deps)     |
| **Origin validation**           | Strict postMessage origin checks    |
| **Input validation**            | Zod schemas for all external data   |

```
Dependencies: 2 peer (viem, zod)
Bundle size: ~22KB minified
```

## Quick Start

```bash
npm install @rockfridrich/villa-sdk viem zod
```

### Simple API (Recommended)

```typescript
import { villa } from "@rockfridrich/villa-sdk";

// One-liner sign in
const user = await villa.signIn();
console.log(user.address, user.nickname, user.avatar);

// Check auth state anywhere
if (villa.user) {
  console.log("Logged in as", villa.user.nickname);
}

// Sign out
villa.signOut();

// Listen to auth changes
villa.onAuthChange((user) => {
  console.log("Auth changed:", user?.nickname || "signed out");
});
```

### Advanced API

```typescript
import { Villa } from "@rockfridrich/villa-sdk";

const client = new Villa({
  appId: "your-app-id",
  network: "base", // or 'base-sepolia' for testnet
});

const result = await client.signIn();

if (result.success) {
  console.log("Welcome", result.identity.nickname);
} else {
  console.error("Auth failed:", result.error, result.code);
}
```

## API Reference

### Villa Client

Main entry point for SDK usage.

#### Constructor

```typescript
const villa = new Villa(config);
```

**Parameters:**

- `config.appId` (string, required) - Your application identifier
- `config.network` (string, optional) - 'base' (default) or 'base-sepolia'
- `config.apiUrl` (string, optional) - Override API endpoint

**Throws:**

- `Error` if appId is missing or empty

#### Methods

##### `signIn(options?)`

Opens fullscreen auth iframe and authenticates user.

```typescript
const result = await villa.signIn({
  scopes: ["profile", "wallet"], // Optional: data to request
  onProgress: (step) => {
    // Optional: track progress
    console.log(step.message);
  },
  timeout: 5 * 60 * 1000, // Optional: timeout in ms
});

if (result.success) {
  // User authenticated
  const { address, nickname, avatar } = result.identity;
} else {
  // Authentication failed
  console.error(result.error); // Error message
  console.error(result.code); // Error code
}
```

**Progress Tracking:**

```typescript
onProgress((step) => {
  switch (step.step) {
    case "opening_auth":
      console.log("Showing auth UI...");
      break;
    case "waiting_for_user":
      console.log("User is authenticating...");
      break;
    case "processing":
      console.log("Processing response...");
      break;
    case "complete":
      console.log("Auth complete!");
      break;
  }
});
```

**Error Codes:**

- `CANCELLED` - User closed auth flow
- `TIMEOUT` - Auth took too long (default: 5 minutes)
- `NETWORK_ERROR` - Failed to load auth page
- `INVALID_CONFIG` - Invalid scopes or configuration
- `AUTH_ERROR` - General authentication error

##### `signOut()`

Clears session and signs out user.

```typescript
await villa.signOut();
console.log("Signed out");
```

##### `isAuthenticated()`

Check if user has a valid session.

```typescript
if (villa.isAuthenticated()) {
  console.log("User is authenticated");
}
```

##### `getIdentity()`

Get current user's identity (if authenticated).

```typescript
const identity = villa.getIdentity();
if (identity) {
  console.log("Address:", identity.address);
  console.log("Nickname:", identity.nickname);
} else {
  console.log("Not authenticated");
}
```

##### `resolveEns(name: string)`

Resolve Villa ENS name to address.

```typescript
const address = await villa.resolveEns("alice");
// => '0x...'
```

##### `reverseEns(address: string)`

Resolve address to Villa ENS name.

```typescript
const name = await villa.reverseEns("0x...");
// => 'alice'
```

##### `getAvatarUrl(seed: string, config?)`

Generate avatar URL for a seed.

```typescript
const url = villa.getAvatarUrl(address, {
  style: 'avataaars',
  seed: address
})

// Use in <img> tag
<img src={url} alt="Avatar" />
```

##### `getNetwork()`

Get configured network.

```typescript
const network = villa.getNetwork();
// => 'base' | 'base-sepolia'
```

##### `getApiUrl()`

Get API endpoint URL.

```typescript
const url = villa.getApiUrl();
// => 'https://api.villa.cash'
```

### Types

#### Identity

User identity returned on successful authentication.

```typescript
interface Identity {
  /** Ethereum address derived from passkey */
  address: `0x${string}`;

  /** User's chosen nickname */
  nickname: string;

  /** Avatar configuration */
  avatar: AvatarConfig;
}
```

#### AvatarConfig

Avatar configuration for deterministic generation.

```typescript
interface AvatarConfig {
  /** DiceBear style: 'adventurer' | 'avataaars' | 'bottts' | 'thumbs' */
  style: string;

  /** Seed for generation (address, nickname, etc) */
  seed: string;

  /** Optional gender preference */
  gender?: "male" | "female" | "other";
}
```

#### SignInResult

Result from authentication.

```typescript
type SignInResult =
  | {
      success: true;
      identity: Identity;
    }
  | {
      success: false;
      error: string;
      code: SignInErrorCode;
    };

type SignInErrorCode =
  | "CANCELLED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INVALID_CONFIG"
  | "AUTH_ERROR";
```

#### VillaConfig

SDK configuration.

```typescript
interface VillaConfig {
  /** Your application ID */
  appId: string;

  /** Network: 'base' (production) or 'base-sepolia' (testnet) */
  network?: "base" | "base-sepolia";

  /** Override API URL */
  apiUrl?: string;
}
```

## Advanced: VillaBridge

For fine-grained control over the auth flow, use `VillaBridge` directly.

### Basic Example

```typescript
import { VillaBridge } from "@rockfridrich/villa-sdk";

const bridge = new VillaBridge({
  appId: "your-app",
  network: "base",
  timeout: 5 * 60 * 1000,
  debug: false,
});

// Subscribe to events
bridge.on("ready", () => {
  console.log("Auth UI ready");
});

bridge.on("success", (identity) => {
  console.log("Authenticated:", identity.nickname);
});

bridge.on("cancel", () => {
  console.log("User cancelled");
});

bridge.on("error", (error, code) => {
  console.error("Auth error:", error, code);
});

// Open auth flow
await bridge.open(["profile"]);

// Later...
bridge.close();
```

### Event Handling

#### `ready`

Fired when iframe is loaded and ready.

```typescript
bridge.on("ready", () => {
  // UI is ready, user can authenticate
});
```

#### `success`

Fired when user successfully authenticates.

```typescript
bridge.on("success", (identity) => {
  const { address, nickname, avatar } = identity;
  // Save identity, redirect, etc.
});
```

#### `cancel`

Fired when user closes auth flow.

```typescript
bridge.on("cancel", () => {
  // User cancelled authentication
  // Bridge is automatically closed
});
```

#### `error`

Fired when authentication fails.

```typescript
bridge.on("error", (error, code) => {
  // error: error message (string)
  // code: error code (VillaErrorCode)

  if (code === "TIMEOUT") {
    console.error("Auth took too long");
  } else if (code === "NETWORK_ERROR") {
    console.error("Network error:", error);
  }
});
```

#### `consent_granted`

Fired when user grants consent to access their data.

```typescript
bridge.on("consent_granted", (appId, scopes) => {
  console.log(`Consent granted for ${appId} with scopes:`, scopes);
});
```

#### `consent_denied`

Fired when user denies consent.

```typescript
bridge.on("consent_denied", (appId) => {
  console.log(`Consent denied for ${appId}`);
});
```

### VillaBridge Configuration

```typescript
interface BridgeConfig {
  /** Your application ID (required) */
  appId: string;

  /** Override Villa auth origin (defaults to production) */
  origin?: string;

  /** Network: 'base' or 'base-sepolia' (default: 'base') */
  network?: "base" | "base-sepolia";

  /** Timeout in milliseconds (default: 5 minutes) */
  timeout?: number;

  /** Enable debug logging (default: false) */
  debug?: boolean;

  /** Prefer popup over iframe (default: false) */
  preferPopup?: boolean;

  /** Timeout to detect iframe blocking in ms (default: 3 seconds) */
  iframeDetectionTimeout?: number;
}
```

### VillaBridge Methods

#### `open(scopes?)`

Open auth iframe.

```typescript
await bridge.open(["profile", "wallet"]);
```

#### `close()`

Close auth iframe and clean up.

```typescript
bridge.close();
```

#### `on(event, callback)`

Subscribe to event.

```typescript
const unsubscribe = bridge.on("success", (identity) => {
  console.log("Success!");
});

// Later...
unsubscribe();
```

#### `off(event, callback)`

Unsubscribe from event.

```typescript
const handler = (identity) => {
  /* ... */
};
bridge.on("success", handler);
// Later...
bridge.off("success", handler);
```

#### `removeAllListeners(event?)`

Remove all listeners for an event (or all events).

```typescript
bridge.removeAllListeners("success");
bridge.removeAllListeners(); // Remove all
```

#### `getState()`

Get current bridge state.

```typescript
const state = bridge.getState();
// => 'idle' | 'opening' | 'ready' | 'authenticating' | 'closing' | 'closed'
```

#### `isOpen()`

Check if bridge is open.

```typescript
if (bridge.isOpen()) {
  // Bridge is ready or authenticating
}
```

#### `postMessage(message)`

Send custom message to iframe (advanced).

```typescript
bridge.postMessage({ type: "CUSTOM_MESSAGE", payload: {} });
```

## Authentication Flow

### How It Works

1. **App calls `villa.signIn()`**
   - SDK creates fullscreen iframe with Villa auth UI

2. **User creates or uses passkey**
   - WebAuthn handles passkey generation/authentication
   - Passkey never leaves user's device

3. **User chooses nickname and avatar**
   - Customizes their Villa identity

4. **Villa signs message with passkey**
   - Creates signature proving ownership of passkey

5. **Address derived from signature**
   - Deterministic Ethereum address calculated
   - No wallet, no seed phrase

6. **Identity sent back via postMessage**
   - Secure channel between iframe and parent
   - Origin validation on both sides

7. **Session stored in localStorage**
   - 7-day expiry
   - Automatically cleared on signOut()

### Popup vs Iframe

**Iframe (default)**

- Opens in fullscreen modal
- No popup blockers
- Seamless UX
- Recommended for all apps

**Automatic Popup Fallback**

- If iframe is blocked, SDK automatically falls back to popup
- Detection timeout: 3 seconds (configurable)
- Popup automatically closes after auth completes

**Force Popup Mode**

```typescript
const bridge = new VillaBridge({
  appId: "your-app",
  preferPopup: true, // Skip iframe, go straight to popup
});
```

**Handle Popup Blocked**

```typescript
bridge.on("error", (error, code) => {
  if (code === "NETWORK_ERROR" && error.includes("Popup blocked")) {
    alert("Please allow popups for this site to authenticate");
  }
});
```

## Error Handling

### Common Errors & Solutions

| Error                | Cause                | Solution                                |
| -------------------- | -------------------- | --------------------------------------- |
| `appId is required`  | Missing config.appId | Pass appId to constructor               |
| `Connection timeout` | User taking too long | Increase timeout option                 |
| `NETWORK_ERROR`      | Failed to load auth  | Check network, try again                |
| `CANCELLED`          | User closed auth     | Handled by app (expected)               |
| `INVALID_CONFIG`     | Bad scopes           | Use valid scopes: ['profile', 'wallet'] |

### Development Tips

**Enable debug logging:**

```typescript
const bridge = new VillaBridge({
  appId: "your-app",
  debug: true, // Logs all messages
});
```

**Check iframe in DevTools:**

- Open Chrome DevTools
- Go to Elements tab
- Look for `#villa-auth-iframe`
- Inspect postMessage in Console

**Passkey issues:**

- Ensure you're on HTTPS (or localhost for dev)
- Use `pnpm dev:https` for local passkey testing
- iOS requires iOS 16+
- Android requires Android 9+ (with compatible authenticator)

## Utilities

### `resolveEns(name: string)`

```typescript
import { resolveEns } from "@rockfridrich/villa-sdk";

const address = await resolveEns("alice");
```

### `reverseEns(address: string)`

```typescript
import { reverseEns } from "@rockfridrich/villa-sdk";

const name = await reverseEns("0x...");
```

### `getAvatarUrl(seed: string, config?)`

```typescript
import { getAvatarUrl } from "@rockfridrich/villa-sdk";

const url = getAvatarUrl("0x...", {
  style: "avataaars",
  seed: "0x...",
});
```

### `getContracts(network?)`

Get contract addresses for a network.

```typescript
import { getContracts } from "@rockfridrich/villa-sdk";

const contracts = getContracts("base");
// => {
//   nicknameResolver: '0x...',
//   recoverySigner: '0x...'
// }
```

## Networks

| Network          | Chain ID | Use Case   |
| ---------------- | -------- | ---------- |
| **Base**         | 8453     | Production |
| **Base Sepolia** | 84532    | Testing    |

## React Integration

For React apps, use `@rockfridrich/villa-sdk-react`:

```bash
npm install @rockfridrich/villa-sdk-react
```

```typescript
import { VillaProvider, VillaAuth, useIdentity } from '@rockfridrich/villa-sdk-react'

function App() {
  return (
    <VillaProvider config={{ appId: 'your-app' }}>
      <LoginPage />
    </VillaProvider>
  )
}

function LoginPage() {
  const identity = useIdentity()

  if (!identity) {
    return <VillaAuth onComplete={(result) => {}} />
  }

  return <h1>Welcome, @{identity.nickname}!</h1>
}
```

## Session Management

### Automatic Session Persistence

Sessions are automatically saved to localStorage:

```typescript
// Session saved after signIn()
villa.isAuthenticated(); // true
villa.getIdentity(); // returns identity

// Even after page reload
// Session restored from localStorage
```

### Session Expiry

Sessions expire after 7 days:

```typescript
// Session is automatically cleared after 7 days
// getIdentity() returns null
// isAuthenticated() returns false
```

### Manual Sign Out

```typescript
await villa.signOut();
// localStorage cleared
// currentSession = null
```

## Type Safety

All exports are fully typed with TypeScript:

```typescript
import type {
  Identity,
  AvatarConfig,
  SignInResult,
  VillaConfig,
  SignInErrorCode,
  VillaSession,
} from "@rockfridrich/villa-sdk";
```

## AI Integration

This package includes `CLAUDE.txt` and `llms.txt` for AI coding assistants.

**One-prompt integration:** Just tell your AI assistant:

> "Add Villa authentication to my app"

Works with Claude Code, Cursor, Windsurf, and Lovable.

## Troubleshooting

### Blank Auth Page

**Symptoms:** Auth iframe shows blank page

**Solution:**

```bash
# Clear build cache and restart
pnpm dev:clean
```

### Passkeys Not Working

**Symptoms:** Passkey creation fails or no biometric option

**Solution:**

```bash
# Use HTTPS (local dev with mkcert)
pnpm dev:https

# Or test with Base Sepolia testnet
const villa = new Villa({ appId: 'test', network: 'base-sepolia' })
```

### Origin Validation Error

**Symptoms:** "Origin not in allowlist" error

**Solution:**

- Don't provide custom `origin` in production
- Use network defaults (base or base-sepolia)
- Contact support for custom origin allowlisting

### Session Not Persisting

**Symptoms:** getIdentity() returns null after reload

**Solution:**

```typescript
// Check localStorage
console.log(localStorage.getItem("villa:session"));

// Sessions require:
// 1. localStorage available
// 2. Valid session data
// 3. Not expired (7 days)
```

## Links

- [Documentation](https://docs.villa.cash)
- [GitHub](https://github.com/rockfridrich/villa)
- [Security Policy](https://github.com/rockfridrich/villa/security)
- [Base Network](https://base.org)

## License

MIT

## Authentication Utilities

The SDK includes low-level utilities for building custom authentication flows:

- **WebAuthn error handling** - Parse and display user-friendly error messages
- **Browser capability detection** - Detect available passkey features
- **Passkey manager detection** - Identify 1Password, iCloud, Google, etc.
- **Porto configuration helpers** - Validate and configure Porto SDK

See [AUTH-UTILITIES.md](./AUTH-UTILITIES.md) for detailed documentation and examples.

```typescript
import {
  detectBrowserCapabilities,
  parseWebAuthnError,
  isPasskeySupported,
  getPasskeyManagerName,
} from "@rockfridrich/villa-sdk";

// Check if passkeys are supported
if (!isPasskeySupported()) {
  console.error("Passkeys not supported");
}

// Detect capabilities
const caps = await detectBrowserCapabilities();
console.log("Platform auth available:", caps.platformAuthenticatorAvailable);
console.log("Passkey managers:", caps.passkeyManagers);

// Handle WebAuthn errors gracefully
try {
  await navigator.credentials.create(options);
} catch (error) {
  const webAuthnError = parseWebAuthnError(error);
  if (webAuthnError.shouldDisplay) {
    showError(webAuthnError.userMessage);
  }
}
```
