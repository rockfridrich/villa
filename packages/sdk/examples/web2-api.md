# Villa Web2 API - Maximum Abstraction Example

The Villa Web2 API provides the highest level of abstraction, hiding all blockchain complexity and providing familiar web service patterns.

## Basic Usage

```typescript
import { auth } from "@rockfridrich/villa-sdk/web2";

// Simple authentication - like any modern web service
const user = await auth.signIn();
console.log(`Hello, ${user.name}!`);

// Update user profile
await auth.updateProfile({
  name: "Alice Smith",
  bio: "Building the future",
});

// Listen to auth changes
auth.onStateChange((state) => {
  if (state.isSignedIn) {
    showDashboard(state.user);
  } else {
    showLoginPage();
  }
});

// Sign out
auth.signOut();
```

## Advanced Usage

```typescript
import { createAuth } from "@rockfridrich/villa-sdk/web2";

// Create isolated auth instance with custom config
const myAuth = createAuth({
  appId: "my-awesome-app",
  environment: "production", // or "staging"
  debug: false,
});

const user = await myAuth.signIn();
```

## Comparison with Traditional SDK

### Web2 API (New - Maximum Abstraction)

```typescript
// No blockchain knowledge required
import { auth } from "@rockfridrich/villa-sdk/web2";

const user = await auth.signIn();
// user.name, user.avatar, user.id
```

### Simple API (Existing)

```typescript
// Some blockchain concepts exposed
import { villa } from "@rockfridrich/villa-sdk";

const user = await villa.signIn();
// user.nickname, user.avatar, user.address
```

### Advanced API (For Power Users)

```typescript
// Full blockchain access
import { Villa } from "@rockfridrich/villa-sdk";

const client = new Villa({ appId: "my-app" });
const result = await client.signIn({ scopes: ["profile", "wallet"] });

// Access internal blockchain details
const wallet = villa.internal.getWallet();
const address = villa.internal.getAddress();
```

## Key Benefits of Web2 API

1. **Zero Crypto Knowledge** - No addresses, wallets, or signatures
2. **Familiar Patterns** - Uses standard web authentication patterns
3. **Progressive Enhancement** - Can access advanced features when needed
4. **Type Safety** - Full TypeScript support
5. **Modern DX** - State management, error handling, loading states

## Migration Guide

### From Simple API

```typescript
// Before
import { villa } from "@rockfridrich/villa-sdk";
const user = await villa.signIn();
console.log(user.nickname, user.address);

// After
import { auth } from "@rockfridrich/villa-sdk/web2";
const user = await auth.signIn();
console.log(user.name, user.id); // No blockchain terminology
```

### Accessing Advanced Features

```typescript
// When you need blockchain details
import { villa } from "@rockfridrich/villa-sdk";

const user = await auth.signIn();
const address = villa.internal.getAddress(); // Get actual blockchain address
```
