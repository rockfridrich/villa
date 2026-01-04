# Villa SDK Components

React components for Villa Identity SDK authentication flows.

## AuthIframe

Fullscreen iframe container for Villa authentication flow. Handles the complete auth experience with loading states, error handling, and postMessage communication.

### Features

- **Fullscreen overlay** - Takes over entire viewport during auth
- **Loading states** - Spinner while iframe loads and initializes
- **Error handling** - Graceful failure with retry button
- **Timeout protection** - Auto-fails after 30s (configurable)
- **Keyboard accessible** - Escape key to close
- **Secure postMessage** - Validates origin and message structure with Zod
- **Smooth animations** - Framer Motion fade in/out

### Usage

```tsx
import { AuthIframe } from '@/components/sdk/AuthIframe'
import { useState } from 'react'
import type { Identity } from '@villa/sdk'

function MyAuthFlow() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AuthIframe
      isOpen={isOpen}
      url="https://villa.cash/sdk/auth"
      onSuccess={(msg) => {
        console.log('Authenticated:', msg.identity)
        setIsOpen(false)
      }}
      onError={(msg) => {
        console.error('Auth failed:', msg.error)
      }}
      onCancel={() => {
        console.log('User cancelled')
        setIsOpen(false)
      }}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Whether iframe is visible |
| `url` | `string` | Yes | URL to load in iframe |
| `onClose` | `() => void` | Yes | Called when iframe should close |
| `onReady` | `() => void` | No | Called when iframe sends READY message |
| `onSuccess` | `(message) => void` | No | Called on successful authentication |
| `onError` | `(message) => void` | No | Called on authentication error |
| `onCancel` | `() => void` | No | Called when user cancels |
| `onConsentGranted` | `(appId: string) => void` | No | Called when consent granted |
| `onConsentDenied` | `(appId: string) => void` | No | Called when consent denied |
| `timeout` | `number` | No | Timeout in ms (default: 30000) |

### Message Types

The iframe communicates via postMessage with these message types:

#### From Iframe → Parent

- `VILLA_AUTH_READY` - Iframe loaded and ready
- `VILLA_AUTH_SUCCESS` - Authentication completed successfully
  - Payload: `{ identity: Identity }`
- `VILLA_AUTH_ERROR` - Authentication failed
  - Payload: `{ error: string, code?: string }`
- `VILLA_AUTH_CANCEL` - User cancelled authentication
- `VILLA_CONSENT_GRANTED` - User granted consent
  - Payload: `{ appId: string }`
- `VILLA_CONSENT_DENIED` - User denied consent
  - Payload: `{ appId: string }`

All messages are validated with Zod schemas for type safety.

### Security

- **Origin validation** - Only accepts messages from trusted Villa domains
- **Message validation** - Zod schemas ensure type-safe message structure
- **Timeout handling** - Prevents hanging on unresponsive iframes
- **Sandboxing** - Iframe has restricted sandbox permissions

Trusted origins:
- `villa.cash`
- `*.villa.cash` (beta, dev-1, dev-2)
- `localhost:3000/3001` (development)

### Error Handling

The component handles errors gracefully:

1. **Network errors** - Shows error overlay with retry button
2. **Timeout** - Auto-fails after timeout period
3. **Auth errors** - Displays error message from iframe
4. **User cancellation** - Calls `onCancel` and closes

### Accessibility

- Escape key closes the iframe
- Spinner has proper `aria-label`
- Error messages are screen-reader friendly
- Buttons have 44px minimum touch targets

### Implementation Details

**Loading Flow:**
1. User triggers auth → `isOpen` set to `true`
2. Component shows spinner overlay
3. Iframe loads HTML
4. Iframe app sends `VILLA_AUTH_READY`
5. Spinner fades out, auth UI visible

**Success Flow:**
1. User completes auth in iframe
2. Iframe sends `VILLA_AUTH_SUCCESS` with identity
3. Component calls `onSuccess(message)`
4. Component closes via `onClose()`

**Error Flow:**
1. Auth fails in iframe
2. Iframe sends `VILLA_AUTH_ERROR` with error details
3. Component shows error overlay with retry button
4. User can retry or cancel

**Timeout Flow:**
1. Timeout timer starts when iframe opens
2. If no valid message received before timeout
3. Component shows timeout error
4. User can retry or cancel

### See Also

- [AuthIframe.example.tsx](./AuthIframe.example.tsx) - Full usage example
- [SignInWelcome.tsx](./SignInWelcome.tsx) - First screen in auth flow
- [packages/sdk/src/iframe.ts](../../../../packages/sdk/src/iframe.ts) - postMessage utilities
