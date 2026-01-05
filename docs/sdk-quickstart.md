# Villa SDK Quick Start

Get users authenticated with passkeys, nicknames, and avatars in under 5 minutes.

## Installation

```bash
# From your app directory
pnpm add @villa/sdk
# or
npm install @villa/sdk
```

## Basic Integration

### 1. One-Line Auth

```tsx
import { VillaAuth } from '@villa/sdk'

function LoginPage() {
  return (
    <VillaAuth
      appName="Your App Name"
      onComplete={(result) => {
        if (result.success) {
          // User authenticated!
          console.log(result.identity.address)   // 0x...
          console.log(result.identity.nickname)  // alice
          console.log(result.identity.avatar)    // { style, selection, variant }

          // Redirect to your app
          router.push('/dashboard')
        } else {
          // Handle error
          console.error(result.error, result.code)
        }
      }}
    />
  )
}
```

### 2. Display User Avatar

```tsx
import { AvatarPreview } from '@villa/sdk'

function UserProfile({ user }) {
  return (
    <div className="profile">
      <AvatarPreview
        address={user.address}
        config={user.avatar}
        size={64}
      />
      <span>{user.nickname}</span>
    </div>
  )
}
```

### 3. Check Returning User

```tsx
// Before showing auth, check if user exists
async function checkExistingUser(address: string) {
  const response = await fetch(
    `https://api.villa.cash/nicknames/reverse/${address}`
  )
  const data = await response.json()

  if (data.nickname) {
    // User already onboarded - skip nickname selection
    return { isReturning: true, nickname: data.nickname }
  }
  return { isReturning: false }
}
```

## Components

### VillaAuth (Full Flow)

Complete authentication orchestrator: Welcome → Passkey → Nickname → Avatar → Done

```tsx
interface VillaAuthProps {
  appName?: string           // Shown in consent screen
  onComplete: (result: VillaAuthResponse) => void
  existingAddress?: string   // Pre-fill for returning users
  initialStep?: AuthStep     // For testing
}

type VillaAuthResponse = {
  success: true
  identity: {
    address: `0x${string}`
    nickname: string
    avatar: AvatarConfig
  }
} | {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}
```

### AvatarPreview (Display)

Renders a user's avatar from their config.

```tsx
interface AvatarPreviewProps {
  address: string      // Wallet address (for deterministic generation)
  config: AvatarConfig // { style, selection, variant }
  size?: number        // Default: 128
}
```

### AvatarSelection (Picker)

Standalone avatar picker with timer and randomization.

```tsx
interface AvatarSelectionProps {
  walletAddress: string
  onSelect: (config: AvatarConfig) => void
  timerDuration?: number  // Default: 30 seconds, set 0 to disable
}
```

### NicknameSelection (Claim)

Nickname input with real-time availability checking.

```tsx
interface NicknameSelectionProps {
  onClaim: (nickname: string) => Promise<void>
  checkAvailability?: (nickname: string) => Promise<{
    available: boolean
    suggestions?: string[]
  }>
}
```

## Types

```tsx
interface AvatarConfig {
  style: 'avataaars' | 'bottts'           // DiceBear style
  selection: 'male' | 'female' | 'other'  // User's choice
  variant: number                          // Random seed
}

interface Identity {
  address: string
  displayName: string
  avatar: AvatarConfig
  createdAt: number
}
```

## Styling

Components use CSS variables for theming:

```css
:root {
  --villa-primary: #2563eb;
  --villa-background: #faf9f7;
  --villa-text: #1a1a1a;
  --villa-border: #e5e5e5;
  --villa-success: #22c55e;
  --villa-error: #ef4444;
}
```

Override in your app:

```css
.villa-auth {
  --villa-primary: #your-brand-color;
}
```

## Error Handling

```tsx
<VillaAuth
  onComplete={(result) => {
    if (!result.success) {
      switch (result.code) {
        case 'CANCELLED':
          // User closed the flow
          break
        case 'AUTH_FAILED':
          // Passkey creation/verification failed
          showError('Authentication failed. Please try again.')
          break
        case 'NETWORK_ERROR':
          // API unreachable
          showError('Network error. Check your connection.')
          break
        case 'TIMEOUT':
          // Operation timed out
          showError('Request timed out. Please try again.')
          break
      }
    }
  }}
/>
```

## Next Steps

- [Profile Settings](./profile-settings.md) - Let users edit their profile
- [Avatar Upload](./avatar-upload.md) - Custom avatar uploads (coming soon)
- [API Reference](./api-reference.md) - Full API documentation

## Support

- GitHub Issues: https://github.com/rockfridrich/villa/issues
- Docs: https://docs.villa.cash
