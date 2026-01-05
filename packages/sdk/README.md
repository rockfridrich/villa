# @anthropic-villa/sdk

Privacy-first passkey authentication for Base network.

[![npm version](https://img.shields.io/npm/v/@anthropic-villa/sdk.svg)](https://www.npmjs.com/package/@anthropic-villa/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Passkey Authentication** - WebAuthn-based, no passwords
- **Privacy-First** - Passkeys never leave user's device
- **One Identity** - Same user across all Villa apps
- **ENS Compatible** - `nickname.villa.cash` resolution
- **TypeScript-First** - Full type safety
- **Zero Web3 UX** - Users see "Sign In", not "Connect Wallet"

## Installation

```bash
npm install @anthropic-villa/sdk

# For React apps:
npm install @anthropic-villa/sdk @anthropic-villa/sdk-react
```

## Quick Start (React)

```tsx
import { VillaProvider, VillaAuth, useIdentity } from '@anthropic-villa/sdk-react'

function App() {
  return (
    <VillaProvider config={{ appId: 'your-app' }}>
      <AuthenticatedApp />
    </VillaProvider>
  )
}

function AuthenticatedApp() {
  const identity = useIdentity()

  if (!identity) {
    return <VillaAuth onComplete={() => {}} />
  }

  return <h1>Welcome, @{identity.nickname}!</h1>
}
```

## Quick Start (Headless)

```ts
import { Villa } from '@anthropic-villa/sdk'

const villa = new Villa({ appId: 'your-app' })

// Sign in user
const result = await villa.signIn()

if (result.success) {
  console.log('Welcome', result.identity.nickname)
  console.log('Address:', result.identity.address)
}

// Check if authenticated
if (villa.isAuthenticated()) {
  const user = villa.getIdentity()
}

// Sign out
villa.signOut()
```

## API Reference

### Villa Class

```ts
new Villa(config: VillaConfig)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appId` | `string` | required | Your app identifier |
| `network` | `'base' \| 'base-sepolia'` | `'base'` | Network to use |
| `apiUrl` | `string` | production | Custom API endpoint |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `signIn(options?)` | `Promise<SignInResult>` | Authenticate user |
| `signOut()` | `void` | Clear session |
| `isAuthenticated()` | `boolean` | Check if user is signed in |
| `getIdentity()` | `Identity \| null` | Get current user |

### React Hooks

```tsx
import { useVilla, useIdentity, useAuth } from '@anthropic-villa/sdk-react'

// Access SDK instance
const villa = useVilla()

// Get current user (null if not authenticated)
const identity = useIdentity()

// Auth state and methods
const { signIn, signOut, isAuthenticated, isLoading } = useAuth()
```

### React Components

```tsx
import { VillaProvider, VillaAuth, Avatar } from '@anthropic-villa/sdk-react'

// Required wrapper
<VillaProvider config={{ appId: 'your-app' }}>
  {children}
</VillaProvider>

// Full auth flow
<VillaAuth
  onComplete={(result) => { /* handle auth result */ }}
  appName="Your App"  // Optional, shown in consent
/>

// Avatar display
<Avatar identity={user} size={48} />
```

### Avatar Utilities

```ts
import { getAvatarUrl, createAvatarConfig } from '@anthropic-villa/sdk'

// Get avatar URL for display
const url = getAvatarUrl(address, avatarConfig)

// Create config from user selection
const config = createAvatarConfig('female', 42)
```

### ENS Resolution

```ts
import { resolveEns, reverseEns } from '@anthropic-villa/sdk'

// Resolve nickname to address
const address = await resolveEns('alice.villa.cash')

// Reverse lookup
const nickname = await reverseEns('0x1234...')
```

## Types

```typescript
interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}

interface AvatarConfig {
  style: 'avataaars' | 'bottts'
  selection: 'male' | 'female' | 'other'
  variant: number
}

type SignInResult =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode }

type SignInErrorCode =
  | 'CANCELLED'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
```

## Network Configuration

| Network | Chain ID | Usage |
|---------|----------|-------|
| Base | 8453 | Production |
| Base Sepolia | 84532 | Testing |

```ts
// Use testnet
const villa = new Villa({
  appId: 'your-app',
  network: 'base-sepolia'
})
```

## Contract Addresses

### Base Sepolia (Testnet)

| Contract | Proxy |
|----------|-------|
| VillaNicknameResolverV2 | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` |

### Using Contract Addresses

```typescript
import { getContracts, getNicknameResolverAddress } from '@anthropic-villa/sdk'

// Get all contracts for a chain
const contracts = getContracts(84532) // Base Sepolia

// Get specific address
const resolverAddress = getNicknameResolverAddress(84532)
```

## AI Integration

This SDK includes `CLAUDE.txt` and `llms.txt` for AI coding assistants.

For Claude Code / Cursor / Lovable, copy to your project:

```bash
cp node_modules/@anthropic-villa/sdk/CLAUDE.txt .claude/villa.md
```

Or just say: **"Add Villa authentication to my app"**

## Security

- **Passkeys never leave device** - WebAuthn handles auth securely
- **Origin validation** - iframe only accepts messages from trusted origins
- **Message schema validation** - postMessage payloads validated with Zod
- **Session encryption** - Sessions stored securely in localStorage

## Architecture

```
External App                     Villa
============                     =====
import { Villa }         -->     packages/sdk/client.ts
  |
villa.signIn()           -->     packages/sdk/iframe.ts
  |                              |
  |                              v
  |                              Fullscreen iframe (villa.cash/auth)
  |                              |
  v                              v
Promise<SignInResult>    <--     postMessage bridge
```

## Examples

### Protected Route (React Router)

```tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loading />
  if (!isAuthenticated) return <Navigate to="/login" />

  return children
}
```

### User Menu

```tsx
function UserMenu() {
  const identity = useIdentity()
  const { signOut } = useAuth()

  if (!identity) return null

  return (
    <div>
      <Avatar identity={identity} size={32} />
      <span>@{identity.nickname}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Links

- [Documentation](https://developers.villa.cash)
- [GitHub](https://github.com/anthropics/villa)
- [Examples](https://developers.villa.cash/examples)

## License

MIT
