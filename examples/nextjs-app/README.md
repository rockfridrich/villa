# Villa SDK - Next.js Example

A minimal Next.js 14 app demonstrating Villa SDK integration for passkey-based authentication on Base network.

## What This Shows

- Complete authentication flow (sign in, display identity, sign out)
- React hooks for identity management (`useIdentity`, `useAuth`)
- Pre-built UI components (`VillaAuth`, `Avatar`)
- Session persistence across page reloads

## Quick Start

### Standalone Usage (Outside Villa Monorepo)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Within Villa Monorepo

From the monorepo root:

```bash
# Build SDK packages first
pnpm --filter @rockfridrich/villa-sdk build
pnpm --filter @rockfridrich/villa-sdk-react build

# Run example
pnpm --filter nextjs-villa-example dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Configuration

Edit `app/layout.tsx` to customize the Villa SDK config:

```typescript
<VillaProvider
  config={{
    appId: 'your-app-id',        // Your unique app identifier
    network: 'base-sepolia',      // 'base' or 'base-sepolia'
  }}
>
  {children}
</VillaProvider>
```

### Getting an App ID

For development, you can use any identifier (e.g., `'my-app-dev'`). For production:

1. Visit [developers.villa.cash](https://developers.villa.cash)
2. Register your app
3. Use the assigned App ID

## Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Wraps app with `VillaProvider` |
| `app/page.tsx` | Auth UI and identity display |
| `app/globals.css` | Minimal styling |

## Code Patterns

### Provider Setup

Wrap your app with `VillaProvider` to enable authentication:

```typescript
import { VillaProvider } from '@rockfridrich/villa-sdk-react'

export default function RootLayout({ children }) {
  return (
    <VillaProvider config={{ appId: 'your-app', network: 'base-sepolia' }}>
      {children}
    </VillaProvider>
  )
}
```

### Check Auth State

Use hooks to access identity and auth methods:

```typescript
import { useIdentity, useAuth } from '@rockfridrich/villa-sdk-react'

function Profile() {
  const identity = useIdentity()
  const { signOut } = useAuth()

  if (!identity) {
    return <p>Not logged in</p>
  }

  return (
    <div>
      <p>Welcome, @{identity.nickname}</p>
      <p>Address: {identity.address}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Pre-built Auth UI

Use `VillaAuth` component for a complete sign-in flow:

```typescript
import { VillaAuth } from '@rockfridrich/villa-sdk-react'
import type { VillaAuthResponse } from '@rockfridrich/villa-sdk-react'

function LoginPage() {
  const handleComplete = (result: VillaAuthResponse) => {
    if (result.success) {
      console.log('Signed in:', result.identity)
    } else {
      console.error('Auth failed:', result.error, result.code)
    }
  }

  return <VillaAuth onComplete={handleComplete} />
}
```

### Display Avatar

Show user's avatar with the `Avatar` component:

```typescript
import { Avatar } from '@rockfridrich/villa-sdk-react'

function UserProfile({ identity }) {
  return <Avatar identity={identity} size={64} />
}
```

## Available Hooks

### `useIdentity()`

Returns the current authenticated identity or `null`:

```typescript
const identity = useIdentity()
// identity: Identity | null

interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}
```

### `useAuth()`

Returns auth state and methods:

```typescript
const { signIn, signOut, isAuthenticated, isLoading } = useAuth()

// signIn: () => Promise<VillaAuthResponse>
// signOut: () => void
// isAuthenticated: boolean
// isLoading: boolean
```

### `useVillaConfig()`

Returns current SDK configuration:

```typescript
const config = useVillaConfig()
// config: { appId: string, network: 'base' | 'base-sepolia', apiUrl?: string }
```

## Error Handling

Auth operations return a `VillaAuthResponse`:

```typescript
type VillaAuthResponse =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: ErrorCode }

type ErrorCode = 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
```

Example error handling:

```typescript
const result = await signIn()

if (!result.success) {
  switch (result.code) {
    case 'CANCELLED':
      console.log('User cancelled')
      break
    case 'NETWORK_ERROR':
      console.error('Network issue:', result.error)
      break
    case 'TIMEOUT':
      console.error('Request timed out')
      break
    default:
      console.error('Auth failed:', result.error)
  }
}
```

## Session Persistence

Sessions are automatically persisted to `localStorage` and restored on page reload. No additional code needed.

To clear session:

```typescript
const { signOut } = useAuth()
signOut() // Clears localStorage and resets state
```

## Customization

### Custom Button Styling

```typescript
<VillaAuth
  onComplete={handleComplete}
  buttonText="Connect Wallet"
  className="my-custom-class"
/>
```

### Build Your Own UI

Use hooks directly instead of pre-built components:

```typescript
function CustomAuthButton() {
  const { signIn, isLoading } = useAuth()

  return (
    <button
      onClick={signIn}
      disabled={isLoading}
      className="my-button"
    >
      {isLoading ? 'Connecting...' : 'Sign In'}
    </button>
  )
}
```

## Production Checklist

- [ ] Replace `appId` with your registered app ID
- [ ] Change `network` to `'base'` for mainnet
- [ ] Update `package.json` dependencies to use published NPM versions (not `workspace:*`)
- [ ] Add error boundaries for auth failures
- [ ] Test on mobile devices (passkeys work better on mobile)
- [ ] Use HTTPS (required for WebAuthn/passkeys)

## Note on Dependencies

**In this monorepo:** Dependencies use `workspace:*` to link to local SDK packages.

**For standalone use:** Replace with NPM versions:
```json
{
  "@rockfridrich/villa-sdk": "^0.1.0",
  "@rockfridrich/villa-sdk-react": "^0.1.0"
}
```

## Learn More

- [Villa SDK Documentation](https://developers.villa.cash)
- [Villa GitHub](https://github.com/rockfridrich/villa)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
