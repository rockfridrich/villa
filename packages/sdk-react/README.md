# @rockfridrich/villa-sdk-react

React bindings for Villa SDK. Privacy-first passkey authentication for Base network.

[![npm version](https://img.shields.io/npm/v/@rockfridrich/villa-sdk-react.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react viem zod
```

## Quick Start (Simple API)

No provider needed. Just use the hook and button:

```tsx
import { useVilla, VillaButton } from "@rockfridrich/villa-sdk-react";

function App() {
  const { user, signOut } = useVilla();

  if (!user) {
    return <VillaButton onSignIn={(u) => console.log("Welcome", u.nickname)} />;
  }

  return (
    <div>
      <img src={user.avatar} alt="" />
      <p>@{user.nickname}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Advanced API (with Provider)

For more control, use the provider pattern:

```tsx
import {
  VillaProvider,
  VillaAuth,
  useIdentity,
  useAuth,
} from "@rockfridrich/villa-sdk-react";

function App() {
  return (
    <VillaProvider config={{ appId: "your-app" }}>
      <AuthenticatedApp />
    </VillaProvider>
  );
}

function AuthenticatedApp() {
  const identity = useIdentity();
  const { signOut } = useAuth();

  if (!identity) {
    return (
      <VillaAuth
        onComplete={(r) => r.success && console.log(r.identity.nickname)}
      />
    );
  }

  return (
    <div>
      <Avatar identity={identity} size={48} />
      <h1>Welcome, @{identity.nickname}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## API

### Simple API (Recommended)

```tsx
import { useVilla, VillaButton } from '@rockfridrich/villa-sdk-react'

// useVilla hook
const { user, signIn, signOut, isAuthenticated, isLoading } = useVilla()

// VillaButton component
<VillaButton onSignIn={(user) => {}} onSignOut={() => {}} />
```

### Provider API

```tsx
<VillaProvider config={{ appId: "your-app", network: "base" }}>
  {children}
</VillaProvider>
```

### Hooks

```tsx
const identity = useIdentity();
const { signIn, signOut, isAuthenticated, isLoading } = useAuth();
const config = useVillaConfig();
```

### Components

```tsx
// Auth button (triggers full flow)
<VillaAuth
  onComplete={(result) => { /* handle result */ }}
  buttonText="Sign In"
/>

// Display avatar
<Avatar identity={user} size={48} />

// Preview avatar config
<AvatarPreview
  walletAddress="0x..."
  selection="female"
  variant={2}
  size={64}
/>
```

## Types

```typescript
interface Identity {
  address: `0x${string}`;
  nickname: string;
  avatar: AvatarConfig;
}

type VillaAuthResponse =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode };
```

## Links

- [Documentation](https://docs.villa.cash)
- [Core SDK](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
- [GitHub](https://github.com/rockfridrich/villa)

## License

MIT
