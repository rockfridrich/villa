# Villa SDK — Minimum Lovable Product

**Status:** DRAFT
**Design:** Pending (SDK + Developer Portal)

---

## Goal

Ship a TypeScript SDK that lets popup city developers add passkey authentication, persistent identity, and credential aggregation to their apps in under 10 minutes — abstracting away all Web3 complexity (Porto, ENS, TinyCloud, wallets).

---

## Why This Approach

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Thin Porto wrapper | Fast to ship, leverages existing infra | Exposes Porto concepts, can't swap providers | ❌ |
| Full custom auth | Complete control, no dependencies | 6+ months, massive security burden | ❌ |
| Abstract everything | Clean DX, swappable backends, portable identity | More upfront work, abstraction cost | ✅ |

### Decision Rationale

**Complete abstraction wins because:**

1. **Developer experience** — `villa.signIn()` is better than explaining Porto, WebAuthn, EIP-7702
2. **User experience** — "Villa ID" not "wallet address", passkeys not seed phrases
3. **Portability** — Can swap Porto for another auth provider without breaking apps
4. **Credential aggregation** — Read from Zupass/Sola/EAS, write to user's container
5. **Popup city positioning** — "Post-Zupass identity" that actually works across events

### Why We Beat Zupass & Sola

| Pain Point | Zupass | Sola | Villa |
|------------|--------|------|-------|
| Cross-event identity | ❌ New identity per event | ⚠️ Profile tokens, fragmented | ✅ One passkey, everywhere |
| Storage | Browser localStorage (loses on clear) | On-chain + off-chain hybrid | TinyCloud (encrypted, synced) |
| Developer experience | Complex PCD packages, popup API | Limited API, no SDK | 3-step integration, TypeScript-first |
| Credential portability | Proprietary PCD format | Badge tokens, not portable | Read all formats, unified container |
| Recovery | None (browser only) | Address-based | Porto recovery (social, email, OAuth) |
| AI-native | ❌ | ⚠️ MCP server exists | ✅ llms.txt + MCP server + .ai/ context |

---

## User Experience

### For Developers (SDK Users)

1. Developer runs `npm install @villa/sdk`
2. Developer adds 10 lines of code (see Quick Start below)
3. User taps "Sign in with Villa"
4. Passkey prompt appears (Face ID / Touch ID / Windows Hello)
5. User is authenticated, developer gets typed identity object
6. Developer can read user's credentials, store app data, share between apps

### For End Users

1. User visits popup city app (e.g., residents.proofofretreat.me)
2. User taps "Sign in with Villa"
3. Biometric prompt appears (no passwords, no seed phrases)
4. User sees their Villa ID (nickname + avatar)
5. User's credentials from other events are automatically available
6. User can grant/revoke data sharing permissions per app

---

## Screens

**SDK controls (iframe popup):**
- Sign in / Sign up flow (passkey creation)
- Nickname selection (if new user)
- Avatar selection (male/female/other)
- Permission grant screen (what app can access)
- Account settings (nickname, avatar, linked accounts)

**Developer Portal (developers.villa.cash):**
- Sign in with Villa (dogfooding)
- App registration (name, domain, logo)
- API key generation
- Usage dashboard
- Documentation (with llms.txt)

---

## UI Boundaries

**Villa SDK controls:**
- Complete auth flow (Porto abstracted internally)
- Nickname registry UI
- Avatar selection
- Permission management
- Credential display (aggregated view)
- Error states and recovery flows

**Porto controls (hidden from developers AND users):**
- Passkey creation/verification (secure enclave)
- Key management and storage
- Transaction signing (future)
- Session management

**App developer controls:**
- Where to place sign-in button
- What permissions to request
- What to do with user data
- Custom UI after authentication

---

## States

Each SDK component handles:

| State | Behavior |
|-------|----------|
| Loading | Skeleton UI while checking session |
| Unauthenticated | Show sign-in button |
| Authenticating | Passkey prompt active, show spinner |
| Authenticated | Return identity, hide modal |
| Error | Show error message, retry option |
| Offline | Queue operations, sync when online |
| Permission Denied | Explain what's needed, allow retry |

---

## Session Behavior

| What | TTL | Who Controls | Notes |
|------|-----|--------------|-------|
| Porto session | ~24h | Porto/Ithaca | Server-controlled, auto-refresh |
| Villa session token | 7 days | Villa SDK | Stored in httpOnly cookie |
| TinyCloud access | Per-request | Porto signing | No separate token needed |
| Credential cache | 1 hour | Villa SDK | Refresh on user action |

---

## Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| Porto SDK | (never mentioned) |
| Wallet address | Villa ID |
| 0x... address | (never shown) |
| TinyCloud | "Your data" |
| PCD / Attestation | "Credential" or "Badge" |
| ENS | (hidden, nickname is the identity) |
| WebAuthn | "Passkey" or "Face ID / Touch ID" |
| EIP-7702 | (never mentioned) |
| Smart account | (never mentioned) |

---

## Technical Approach

### SDK Architecture

```
@villa/sdk
├── core/           # Identity, auth, storage abstraction
├── react/          # React hooks (@villa/react)
├── credentials/    # Aggregation from Zupass, Sola, EAS
└── types/          # Shared TypeScript types
```

### Core Module (`@villa/sdk`)

```typescript
// Initialization (single entry point)
import { Villa } from '@villa/sdk'

const villa = new Villa({
  appId: 'app_xxx',           // From developer portal
  // No API key needed for client-side (domain-verified)
})

// Authentication
const identity = await villa.signIn()
// Returns: { id, nickname, avatar, address (optional) }

// Or check existing session
const identity = await villa.getIdentity()

// Sign out
await villa.signOut()
```

### React Hooks (`@villa/react`)

```typescript
import { VillaProvider, useVilla, useIdentity } from '@villa/react'

// Wrap app
<VillaProvider appId="app_xxx">
  <App />
</VillaProvider>

// In components
function Profile() {
  const { identity, signIn, signOut, isLoading } = useVilla()

  if (isLoading) return <Skeleton />
  if (!identity) return <button onClick={signIn}>Sign in</button>

  return <div>Hello, {identity.nickname}</div>
}
```

### Credential Aggregation

```typescript
// Get all user credentials (aggregated from multiple sources)
const credentials = await villa.credentials.list()
// Returns unified format regardless of source (Zupass, Sola, EAS, POAPs)

// Filter by type
const eventBadges = await villa.credentials.list({ type: 'event-attendance' })

// Check specific credential
const hasZuzaluBadge = await villa.credentials.has('zuzalu-2023-attendee')
```

### Storage (TinyCloud Abstraction)

```typescript
// App-specific storage (isolated per app)
await villa.storage.set('preferences', { theme: 'dark' })
const prefs = await villa.storage.get('preferences')

// Shared storage (user-controlled, cross-app)
// Requires explicit user permission
const profile = await villa.storage.getShared('profile')
```

### Data Flow

```
User taps "Sign in"
       ↓
Villa SDK opens iframe modal
       ↓
Porto SDK handles passkey (abstracted)
       ↓
User authenticates via biometric
       ↓
Porto returns session + account
       ↓
Villa SDK fetches/creates profile from TinyCloud
       ↓
Villa SDK aggregates credentials (Zupass, Sola, EAS)
       ↓
Returns typed Identity to developer
```

### Storage Architecture

**TinyCloud structure per user:**
```
/villa/
├── profile.json           # Nickname, avatar, created_at
├── credentials/           # Aggregated credential cache
│   ├── zupass/           # Imported from Zupass
│   ├── sola/             # Imported from Sola
│   ├── eas/              # From Base Attestation Service
│   └── poap/             # POAPs
├── permissions/           # Per-app permissions granted
└── apps/
    └── {app_id}/         # App-specific isolated storage
```

### Credential Aggregation Pipeline

```
1. On sign-in, check credential cache age
2. If stale (>1 hour), fetch from sources:
   - Zupass: Request PCDs via Z-API popup
   - Sola: Query profile tokens via API
   - EAS: GraphQL query on Base
   - POAPs: Query POAP API
3. Transform to unified Villa Credential format
4. Store in TinyCloud (user owns their data)
5. Return to app
```

### Unified Credential Format

```typescript
interface VillaCredential {
  id: string                    // Unique ID
  type: CredentialType          // 'event-attendance' | 'membership' | 'skill' | 'custom'
  issuer: {
    id: string                  // Issuer identifier
    name: string                // Human-readable name
    verified: boolean           // Is issuer known/trusted
  }
  subject: {
    id: string                  // Villa ID of holder
    claims: Record<string, any> // The actual credential data
  }
  source: 'zupass' | 'sola' | 'eas' | 'poap' | 'villa'
  sourceId: string              // Original ID in source system
  issuedAt: number              // Unix timestamp
  expiresAt?: number            // Optional expiration
  proof?: {                     // Optional cryptographic proof
    type: string
    data: string
  }
}
```

---

## Developer Portal

### Registration Flow

1. Developer visits developers.villa.cash
2. Signs in with Villa (dogfooding the SDK)
3. Creates new app (name, domain, description, logo)
4. Receives `appId` (public, used in SDK init)
5. Optionally generates API key (for server-side operations)

### App Configuration

```typescript
interface AppConfig {
  id: string                    // app_xxx
  name: string                  // "Proof of Retreat Map"
  domain: string                // "map.proofofretreat.me"
  logo?: string                 // URL to logo
  permissions: Permission[]     // What the app can access
  redirectUrls: string[]        // Allowed OAuth redirects
  webhooks?: WebhookConfig[]    // Optional event notifications
}

type Permission =
  | 'identity:read'             // Basic identity (nickname, avatar)
  | 'credentials:read'          // Read user's credentials
  | 'storage:app'               // App-specific storage
  | 'storage:shared:read'       // Read shared profile data
  | 'storage:shared:write'      // Write to shared profile
```

### API Key Security

- API keys are hashed before storage (bcrypt)
- Keys shown once on creation, never retrievable
- Keys scoped to specific app
- Rate limited per key
- Revocable by developer

---

## AI-Native Documentation

### llms.txt (at /llms.txt)

```
# Villa SDK

> Identity infrastructure for popup cities. Passkey auth + credential aggregation.

## Docs

- [Quick Start](/docs/quickstart.md): 10-minute integration guide
- [Authentication](/docs/auth.md): Sign in, sessions, identity
- [Credentials](/docs/credentials.md): Read Zupass, Sola, EAS credentials
- [Storage](/docs/storage.md): TinyCloud-backed data persistence
- [React Hooks](/docs/react.md): useVilla, useIdentity, useCredentials
- [API Reference](/docs/api.md): Full SDK reference

## Examples

- [Next.js App](/examples/nextjs.md): Full integration example
- [Event Check-in](/examples/checkin.md): QR-based attendance
- [Gated Access](/examples/gated.md): Credential-gated content
```

### MCP Server (`@villa/mcp`)

```typescript
// Exposes SDK as MCP tools for AI agents
const tools = [
  'villa_get_identity',      // Get current user identity
  'villa_list_credentials',  // List user's credentials
  'villa_check_credential',  // Check if user has specific credential
  'villa_store_data',        // Store app data
  'villa_read_data',         // Read app data
]
```

### RLM Context (.ai/ directory)

```
.ai/
├── CONTEXT.md              # What Villa SDK is, key concepts
├── ARCHITECTURE.md         # How the layers work together
├── DECISIONS.md            # Why we chose this approach
└── PATTERNS.md             # Common integration patterns
```

---

## Deployment Considerations

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_VILLA_APP_ID` | Yes | App ID from developer portal |
| `VILLA_API_KEY` | Server-only | For server-side operations |
| `VILLA_WEBHOOK_SECRET` | Optional | For webhook signature verification |

### Platform Quirks

- **Passkey RP ID:** Must be `villa.cash` for cross-subdomain portability
- **Iframe mode:** Requires domain registration with Porto/Ithaca
- **CORS:** SDK handles preflight, apps need to allow villa.cash origin
- **CSP:** Add `frame-src https://villa.cash` to Content-Security-Policy

---

## Tasks

### Phase 1: Core SDK (MLP)

- [ ] **WU-0: Types & Interfaces**
  - VillaConfig, Identity, Credential types
  - Error types with codes
  - Permission types

- [ ] **WU-1: Porto Abstraction Layer**
  - Abstract Porto.create() → villa internal
  - Abstract Porto.connect() → villa.signIn()
  - Session management (check, refresh, clear)
  - Domain-bound passkeys (RP ID = villa.cash)

- [ ] **WU-2: Identity Management**
  - Profile creation flow (nickname, avatar)
  - Profile update
  - TinyCloud profile storage
  - Identity caching

- [ ] **WU-3: React Package**
  - VillaProvider context
  - useVilla hook
  - useIdentity hook
  - SignInButton component

- [ ] **WU-4: Storage Abstraction**
  - TinyCloud read/write abstraction
  - App-specific storage (isolated)
  - Shared storage (with permissions)
  - Offline queue + sync

### Phase 2: Credential Aggregation

- [ ] **WU-5: Credential Types**
  - Unified VillaCredential format
  - Source adapters (Zupass, Sola, EAS, POAP)
  - Transformation utilities

- [ ] **WU-6: Zupass Reader**
  - Z-API integration
  - PCD verification
  - Transform to VillaCredential

- [ ] **WU-7: Sola Reader**
  - Profile token query
  - Badge aggregation
  - Transform to VillaCredential

- [ ] **WU-8: EAS Reader**
  - Base GraphQL client
  - Schema discovery
  - Transform to VillaCredential

- [ ] **WU-9: Credential Cache**
  - TinyCloud storage for credentials
  - Cache invalidation strategy
  - Background refresh

### Phase 3: Developer Portal

- [ ] **WU-10: Portal Auth**
  - Sign in with Villa (dogfooding)
  - Developer profile

- [ ] **WU-11: App Registration**
  - Create/edit/delete apps
  - Domain verification
  - Logo upload

- [ ] **WU-12: API Key Management**
  - Generate keys (hashed storage)
  - Revoke keys
  - Usage tracking

- [ ] **WU-13: Documentation Site**
  - VitePress setup
  - llms.txt generation
  - API reference (TypeDoc)

### Phase 4: AI-Native

- [ ] **WU-14: MCP Server**
  - @villa/mcp package
  - Tool definitions
  - Documentation as resources

- [ ] **WU-15: .ai/ Context**
  - CONTEXT.md
  - DECISIONS.md
  - PATTERNS.md

### Phase 5: Polish

- [ ] **WU-16: Error Handling**
  - Error codes
  - Recovery suggestions
  - Debug mode

- [ ] **WU-17: Testing**
  - Unit tests (80%+ coverage)
  - E2E tests
  - Mock providers

- [ ] **WU-18: npm Publishing**
  - Package structure
  - README
  - Changelog

---

## Acceptance Criteria

### Must Have (MLP)

- [ ] Developer can `npm install @villa/sdk` and authenticate users in <10 lines
- [ ] Users sign in with passkey (Face ID / Touch ID)
- [ ] Users have persistent identity (nickname + avatar)
- [ ] Identity works across apps on villa.cash subdomain
- [ ] User data stored in TinyCloud (user owns it)
- [ ] No Web3 terminology exposed to users or developers
- [ ] Works on iOS Safari, Android Chrome, desktop browsers
- [ ] TypeScript types for everything
- [ ] React hooks package available

### Should Have

- [ ] Credential aggregation from Zupass
- [ ] Credential aggregation from Sola
- [ ] Developer portal for app registration
- [ ] llms.txt documentation
- [ ] MCP server for AI agents

### Nice to Have

- [ ] EAS read + write proxy
- [ ] Webhook notifications
- [ ] Usage analytics dashboard
- [ ] Rate limiting UI

---

## Out of Scope (v1)

- **EAS write proxy** — Developers can use EAS SDK directly for now; we'll add proxy in v2
- **On-chain credential issuance** — Read-only aggregation first, write later
- **Multi-chain support** — Base only for MLP
- **Governance features** — Voting, delegation deferred to v2
- **Mobile SDKs** — Web-first, React Native later
- **Custom credential schemas** — Use standard types first
- **ENS on-chain migration** — Nicknames stay off-chain for now

---

## Success Metrics

| Metric | Target | How We Measure |
|--------|--------|----------------|
| Integration time | <10 min | Time from npm install to working auth |
| Developer NPS | >50 | Survey at 1 week |
| Auth success rate | >95% | SDK analytics |
| Cross-app identity | 100% | Same user, different apps, same identity |
| Credential aggregation | >80% | Credentials from known sources imported |

---

## Security Considerations

### Authentication
- Passkeys bound to villa.cash domain (WebAuthn RP ID)
- Porto handles all key management (never touch private keys)
- Session tokens are httpOnly, secure, sameSite=strict

### Authorization
- Apps can only access permitted data
- User explicitly grants permissions
- Permissions revocable at any time

### Data Privacy
- All data encrypted in TinyCloud (user's key)
- Villa backend never sees unencrypted user data
- Credential aggregation happens client-side

### Input Validation
- All SDK inputs validated with Zod
- Nicknames sanitized (XSS prevention)
- Domain allowlist for apps

---

## Quick Start (Developer Docs Preview)

```typescript
// 1. Install
npm install @villa/sdk @villa/react

// 2. Wrap your app
import { VillaProvider } from '@villa/react'

function App() {
  return (
    <VillaProvider appId="app_xxx">
      <YourApp />
    </VillaProvider>
  )
}

// 3. Use the hook
import { useVilla } from '@villa/react'

function Profile() {
  const { identity, signIn, signOut, isLoading } = useVilla()

  if (isLoading) return <div>Loading...</div>

  if (!identity) {
    return <button onClick={signIn}>Sign in with Villa</button>
  }

  return (
    <div>
      <img src={identity.avatar} alt={identity.nickname} />
      <h1>Welcome, {identity.nickname}</h1>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}
```

**That's it. No wallets. No seed phrases. No Web3 jargon.**

---

## Competitive Positioning

### vs Zupass

"Zupass is a hackathon project that became infrastructure. Villa is infrastructure designed from day one."

- Zupass: Browser localStorage, no sync, no recovery
- Villa: TinyCloud, encrypted sync, Porto recovery

### vs Sola

"Sola is great for event coordination. Villa is the identity layer that makes Sola better."

- Sola: Event-focused, badge tokens, on-chain overhead
- Villa: Identity-focused, aggregates Sola badges, works offline

### vs Privy/Dynamic

"Privy and Dynamic are wallet-first. Villa is identity-first."

- Privy: "Connect wallet" paradigm, exposes addresses
- Villa: "Sign in" paradigm, zero crypto UX

---

## First Customers (Design Partners)

1. **residents.proofofretreat.me** — Event registration + attendance
2. **map.proofofretreat.me** — Location sharing with consent
3. **Proof of Retreat internal tools** — Dogfooding

These apps will use the SDK and provide feedback before public launch.
