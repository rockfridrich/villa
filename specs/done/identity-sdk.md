# Villa Identity SDK — Technical Spec

**Version:** 1.0.0  
**Domain:** id.proofofretreat.me  
**Updated:** January 3, 2026

---

## What We're Building

Identity layer for Proof of Retreat Village. Users get a passkey-based wallet, claim a nickname that works across ENS, pick an avatar, and control exactly what data apps can see.

The SDK handles everything — auth, storage, consent — so devs just call a few methods and get a working identity system.

---

# 1. Villa Identity SDK

**Status:** DRAFT  
**Design:** Pending

## Goal

Give developers a drop-in identity solution. One SDK, fullscreen iframe flow, works everywhere.

## How It Works

The SDK renders a **fullscreen iframe popup** with the complete auth/onboarding flow. We control the UX inside the iframe — React components, no theming for now (we'll open that up later). The iframe wraps Porto for passkey auth, same as the main app.

This means:
- Devs don't build UI, they just call `villa.signIn()`
- We can iterate on the flow without breaking integrations
- Consistent UX across all village apps

## Developer Experience

```typescript
import { VillaIdentity } from '@villa/identity-sdk';

const villa = new VillaIdentity({
  appId: 'village-map',
  appSignature: '0x...',
  appWallet: '0x...'
});

// Opens fullscreen iframe with auth flow
const identity = await villa.signIn();

// Get user data (prompts consent in iframe if needed)
const profile = await villa.getData(['nickname', 'avatar']);

// Render avatar
const avatarSvg = villa.renderAvatar('svg');
const avatarPng = await villa.renderAvatar('png', 256);

// Store app-specific data in user's vault
await villa.pushData('preferences', { theme: 'dark' });
```

All internal URLs (TinyCloud, Porto, gateway) are hidden. Devs never see them.

## SDK Public API

| Method | What It Does |
|--------|--------------|
| `signIn()` | Opens iframe, handles passkey auth, returns identity |
| `create(nickname, avatar)` | Create new profile (usually called inside iframe flow) |
| `getData(scopes)` | Fetch user data, triggers consent if needed |
| `pushData(key, value)` | Write app-specific data to user's vault |
| `renderAvatar(format, size?)` | Generate avatar as SVG or PNG, cached for session |
| `disconnect()` | End session, clear cache |

## Data Access Model

**What apps can fetch:**

| Scope | Data | Requires Consent |
|-------|------|------------------|
| `nickname` | User's nickname | Yes |
| `avatar` | Avatar style + variant | Yes |
| `wallet` | Wallet address | Yes |
| `appData` | Only data THIS app wrote | Yes |

**What apps CANNOT access:**
- Data written by other apps (isolated)
- Private profile (locale, device, registeredAt)
- Linked wallet data
- Other apps' consent records

**Data ownership:**

```typescript
// When app writes data
await villa.pushData('preferences', { theme: 'dark' });

// Stored as:
{
  key: 'preferences',
  value: { theme: 'dark' },
  author: 'village-map',        // App ID, immutable
  writtenAt: '2026-01-03T...',
  linkedTo: null                // Optional, for related data
}

// Only 'village-map' can read this back
// Other apps get empty result for this key
```

**Linking data:**

Apps can link their data to other data points (for relationships), but authorship is always preserved:

```typescript
await villa.pushData('event-rsvp', {
  eventId: 'retreat-2026',
  attending: true
}, { linkedTo: 'preferences' });  // Links to own data only
```

## Types

```typescript
interface Identity {
  walletAddress: string;        // Salted in external logs
  nickname: string | null;
  avatar: AvatarConfig | null;
  isNewUser: boolean;
}

interface AvatarConfig {
  style: 'avataaars' | 'bottts';  // DiceBear style
  selection: 'male' | 'female' | 'other';  // User-facing choice
  variant: number;
}

type Scope = 'nickname' | 'avatar' | 'wallet' | 'appData';
```

---

## Data Persistence

### Where Identity Data Lives

| Data | Primary Storage | Backup/Sync | Notes |
|------|-----------------|-------------|-------|
| **Passkey** | Device keychain | Porto SDK (iCloud/Google sync) | Automatic |
| **Nickname** | VillaNicknameResolver (on-chain) | PostgreSQL (CCIP-Read) | Globally unique, ENS-compatible |
| **Avatar** | localStorage (Zustand) | TinyCloud (Phase 2) | Deterministic regeneration |
| **Address** | Derived from passkey | — | Never stored, always derived |

### Why This Architecture

**Nickname on-chain:**
- Must be globally unique (ENS namespace)
- Survives device changes
- Resolvable by any ENS-compatible app
- Query: `VillaNicknameResolver.nicknameFor(address)`

**Avatar local-first:**
- Fast renders (no network latency)
- Deterministic: `wallet + style + variant` = same avatar forever
- Cheap to regenerate on new device
- Future: sync via TinyCloud for convenience

### Returning User Detection

When `villa.signIn()` completes:

```typescript
// 1. User authenticates → get address
const { address } = await porto.connect()

// 2. Check nickname (on-chain)
const nickname = await villaResolver.nicknameFor(address)

// 3. Check avatar (localStorage)
const storedIdentity = getStoredIdentity()
const hasAvatar = storedIdentity?.address === address && storedIdentity?.avatar

// 4. Route based on state
if (nickname && hasAvatar) {
  // Returning user, same device → /home
  return { ...identity, isNewUser: false }
} else if (nickname && !hasAvatar) {
  // Returning user, new device → avatar step only
  showAvatarSelection()
} else {
  // New user → full onboarding
  showNicknameSelection()
}
```

**See:** [returning-user-flow.md](returning-user-flow.md) for detailed routing logic

## Security Note: Wallet Address Salting

When wallet addresses appear in external logs, analytics, or third-party services, we salt them:

```typescript
function saltWalletForExport(address: string): string {
  const salt = process.env.VILLA_WALLET_SALT;
  return keccak256(address + salt).slice(0, 42);
}
```

This prevents correlation attacks if logs leak. Internal systems use real addresses; external-facing stuff gets salted versions.

## Technical

**Iframe Architecture:**
```
┌─────────────────────────────────────────────────┐
│                  Host App                        │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │        Villa SDK Iframe (fullscreen)     │   │
│   │                                         │   │
│   │   ┌─────────────────────────────────┐   │   │
│   │   │     Porto Passkey Modal         │   │   │
│   │   └─────────────────────────────────┘   │   │
│   │                                         │   │
│   │   React Components:                     │   │
│   │   - NicknameSetup                       │   │
│   │   - AvatarSelection                     │   │
│   │   - ConsentDialog                       │   │
│   │   - ProfileCard                         │   │
│   │                                         │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Communication:**
- SDK ↔ Iframe via postMessage
- Iframe ↔ Backend via authenticated fetch
- All within same origin (id.proofofretreat.me)

**Dependencies (internal):**
- `@portofi/sdk` — Passkey auth
- `@tinycloudlabs/web-sdk` — Storage
- `@dicebear/core` — Avatars
- `web3.bio` — Wallet identity enrichment

## Tasks

- [ ] Build iframe container with postMessage bridge
- [ ] Port Porto integration from main app to iframe
- [ ] Create React components: NicknameSetup, AvatarSelection, ConsentDialog
- [ ] Implement SDK wrapper methods
- [ ] Add wallet address salting for exports
- [ ] Session caching for avatar renders
- [ ] Package as npm module
- [ ] Write docs with examples (React, vanilla JS)
- [ ] E2E tests for full flow
- [ ] Security audit

## Acceptance Criteria

- [ ] `villa.signIn()` opens fullscreen iframe and completes auth
- [ ] Flow works identically to main app
- [ ] Wallet addresses salted in any external logging
- [ ] Avatar renders cached for session
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] < 100KB bundle size (excluding DiceBear styles)

## Out of Scope

- Custom theming (v1.1)
- Native mobile SDKs (React Native wrapper planned)
- Headless mode (iframe-only for now)

---

# 2. App Registration

**Status:** DRAFT  
**Design:** Pending

## Goal

Let developers register their apps with a wallet signature. Simple now, on-chain verifiable later.

## User Experience

1. Dev visits `id.proofofretreat.me/developers`
2. Connects wallet
3. Enters app ID (e.g., "village-map")
4. Signs message: `"Register app: village-map for Villa Identity"`
5. Gets credentials + SDK snippet

## Technical

**Data Model:**

```sql
CREATE TABLE registered_apps (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(64) NOT NULL UNIQUE,
    app_wallet BYTEA NOT NULL,
    signature BYTEA NOT NULL,
    app_name VARCHAR(255),
    app_url VARCHAR(500),
    allowed_origins TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Request Auth:**

Every SDK request includes:
- `X-Villa-App-Id`
- `X-Villa-App-Wallet`
- `X-Villa-App-Signature` (registration signature)
- `X-Villa-Request-Timestamp`
- `X-Villa-Request-Signature` (request-specific)

Gateway verifies both signatures on every request.

**Reserved App IDs:** `villa`, `proof`, `retreat`, `admin`, `system`, `api`, `test`

**Rate Limits:**
- Registration: 5 apps per wallet per day
- API requests: 100/min per app

## Tasks

- [ ] Developer portal UI
- [ ] Wallet connection flow
- [ ] Signature generation and verification
- [ ] PostgreSQL schema
- [ ] Gateway auth middleware
- [ ] Rate limiting
- [ ] Dashboard for viewing registered apps

## Acceptance Criteria

- [ ] Registration completes in < 2 minutes
- [ ] Invalid signatures rejected
- [ ] Duplicate app IDs blocked
- [ ] SDK requests without valid credentials return 401

---

# 3. Nickname Registry

**Status:** DRAFT  
**Design:** Pending

## Goal

Let users claim unique nicknames that resolve as `nickname.proofofretreat.eth` across the ENS ecosystem.

## User Experience

1. User finishes passkey setup
2. Sees "Choose your nickname" screen
3. Types nickname, real-time validation
4. Green check = available, red X = taken/invalid
5. Claims nickname
6. `alice.proofofretreat.eth` now resolves to their address

## Technical

**PostgreSQL Schema (ENS-compatible):**

```sql
CREATE TABLE nicknames (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(30) NOT NULL,
    nickname_hash BYTEA NOT NULL UNIQUE,
    namehash BYTEA NOT NULL UNIQUE,
    label_hash BYTEA NOT NULL,
    parent_namehash BYTEA NOT NULL,
    owner_address BYTEA NOT NULL,
    migration_status VARCHAR(20) DEFAULT 'offchain',
    migration_signature BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_nickname_lower ON nicknames(LOWER(nickname));
```

We pre-compute `namehash` and `label_hash` so migration to on-chain is straightforward.

**Normalization:**

```typescript
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/[^a-z0-9]/g, '')        // alphanumeric only
    .slice(0, 30);
}
```

**Validation:**
- 3-30 chars
- a-z, 0-9 only
- Not reserved
- Not profanity
- Not taken

**ENS Resolution (CCIP-Read):**

We deploy an offchain resolver to Ethereum that points to our gateway. When someone queries `alice.proofofretreat.eth`:

1. ENS hits our resolver
2. Resolver reverts with `OffchainLookup` pointing to gateway
3. Gateway queries PostgreSQL, signs response
4. Client passes signed response back to resolver
5. Resolver verifies signature, returns address

Standard ENS libraries (ethers, viem, wagmi) handle this automatically. Users don't know it's offchain.

**Migration Path:**

We collect EIP-712 signatures from users when they claim nicknames. These signatures authorize future on-chain registration. When we're ready:

1. Deploy L2 registry (Base)
2. Batch-submit collected signatures
3. Gateway reads from L2 first, falls back to PostgreSQL
4. Eventually all names on-chain

## API Endpoints

```
GET  /api/nicknames/check?nickname=alice
POST /api/nicknames/claim { nickname: "alice" }
GET  /api/nicknames/resolve/alice
GET  /api/nicknames/reverse/0x1234...
```

## Tasks

- [ ] PostgreSQL schema with migrations
- [ ] Normalization and validation functions
- [ ] API endpoints
- [ ] CCIP-Read resolver contract
- [ ] Gateway signing service
- [ ] Configure proofofretreat.eth resolver
- [ ] Migration signature collection
- [ ] Load test gateway (target: 1000 req/s)

## Acceptance Criteria

- [ ] Nickname claim < 3 seconds
- [ ] `alice.proofofretreat.eth` resolves via any ENS interface
- [ ] One nickname per wallet enforced
- [ ] Migration signatures collected for future on-chain move

---

# 4. Avatar System

**Status:** DRAFT  
**Design:** Pending

## Goal

Generate unique avatars from wallet address. Anime styles for male/female, Vietnamese cultural theme for "other". 30-second timer to create urgency.

## User Experience

1. After nickname, user sees avatar screen
2. Gender buttons: Male / Female / Other
3. Avatar generates based on selection
4. "Randomize" cycles through variants
5. Timer counts down from 30 seconds
6. Auto-selects current avatar at 0, or user taps "Select"

## Styles

| Selection | Style | Base |
|-----------|-------|------|
| Male | Anime male | DiceBear lorelei |
| Female | Anime female | DiceBear lorelei |
| Other | Vietnamese cultural | DiceBear notionistsNeutral |

## Technical

**Storage (minimal):**

```typescript
// Only this goes to TinyCloud
{
  avatar: {
    style: 'anime-female',
    variant: 42
  }
}
// ~30 bytes, not the 5-15KB SVG
```

**Generation:**

```typescript
function renderAvatar(
  wallet: string, 
  style: AvatarStyle, 
  variant: number
): string {
  const seed = `${wallet.toLowerCase()}-${variant}`;
  const avatar = createAvatar(STYLE_MAP[style], { seed, size: 128 });
  return avatar.toString(); // SVG
}
```

Same wallet + variant = same avatar forever. Deterministic.

**SDK Method:**

```typescript
// SVG (sync, fast)
const svg = villa.renderAvatar('svg');

// PNG (async, needs canvas)
const png = await villa.renderAvatar('png', 256);
```

Session-cached. Regenerated on next session (cheap operation).

## Tasks

- [ ] DiceBear setup with style configs
- [ ] SVG generation
- [ ] PNG conversion via canvas
- [ ] Session cache
- [ ] Avatar selection React component
- [ ] 30-second timer with auto-select
- [ ] Visual regression tests

## Acceptance Criteria

- [ ] Same wallet + variant = identical avatar
- [ ] Gender selection maps to correct style
- [ ] SVG renders < 20ms
- [ ] PNG renders < 100ms
- [ ] Timer auto-selects at 0
- [ ] Only style + variant stored

---

# 5. User Data & Permissions (Main App)

**Status:** DRAFT  
**Design:** Pending

## Goal

Users see exactly what data apps have access to, what apps wrote to their storage, and can revoke permissions anytime. Users see everything; apps only see their own data.

## User Experience

1. User opens `id.proofofretreat.me` (main app)
2. Goes to "Connected Apps" section
3. Sees list of apps with permissions granted
4. Taps an app to see:
   - What scopes they have (nickname, avatar, wallet, appData)
   - What data they wrote to user's storage (full visibility)
   - When access was granted
5. User can:
   - Revoke access (app loses all permissions)
   - Keep data or delete what app wrote
   - View full data in nice formatted view

**Key distinction:** User sees ALL app data across all apps. Each app only sees its own data — complete isolation between apps.

## Screens

- **Connected Apps List:** All apps with access
- **App Detail:** Permissions, data written, actions
- **Data Viewer:** Formatted view of app-specific data
- **Revoke Confirmation:** Confirm revoke + data deletion choice

## Technical

**TinyCloud Structure:**

```
/profile/public           # nickname, avatar, wallet
/profile/private          # registeredAt, deviceId, locale, deviceMeta
/consent/{appId}          # granted scopes, timestamp
/apps/{appId}/            # data written by app
/linked-wallets/          # connected main wallet identities (private)
```

**Consent Record:**

```typescript
interface Consent {
  appId: string;
  appName: string;
  scopes: Scope[];
  grantedAt: string;
  lastAccessed: string;
}
```

**App Data Tracking:**

When an app calls `pushData(key, value)`, we store:

```typescript
// /apps/{appId}/{key}
{
  value: { ... },
  writtenAt: '2026-01-03T12:00:00Z',
  writtenBy: 'village-map'
}
```

**Revocation Flow:**

```typescript
async function revokeAccess(appId: string, deleteData: boolean) {
  // Remove consent
  await tinycloud.delete(`consent/${appId}`);
  
  // Optionally delete app data
  if (deleteData) {
    await tinycloud.delete(`apps/${appId}`);
  }
  
  // App immediately loses access
}
```

## Tasks

- [ ] Connected Apps list component
- [ ] App detail view
- [ ] Data viewer with formatting
- [ ] Revoke flow with data deletion option
- [ ] Track app writes with metadata
- [ ] Permission change notifications (optional)

## Acceptance Criteria

- [ ] User sees all apps with access
- [ ] User sees exactly what data each app wrote
- [ ] Revoke immediately blocks app access
- [ ] User can choose to keep or delete app data
- [ ] Data displayed in readable format

---

# 6. Private User Data Collection

**Status:** DRAFT  
**Design:** Pending

## Goal

After registration, collect useful private data (locale, device info) that stays in user's vault. Never shared with apps.

## What We Collect

| Data | Source | Purpose |
|------|--------|---------|
| `locale` | `navigator.language` | Personalization, future i18n |
| `timezone` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Event times |
| `deviceType` | UA parsing | Analytics, fraud signals |
| `screenSize` | `window.screen` | UX optimization |
| `registeredAt` | Server timestamp | Internal records |
| `deviceId` | FingerprintJS hash | Fraud detection (soft) |

## Technical

**Private Profile (TinyCloud):**

```typescript
// /profile/private — never exposed to apps
{
  registeredAt: '2026-01-03T12:00:00Z',
  locale: 'en-US',
  timezone: 'Asia/Ho_Chi_Minh',
  device: {
    type: 'mobile',
    os: 'iOS',
    browser: 'Safari',
    screenWidth: 390,
    screenHeight: 844
  },
  deviceId: 'a1b2c3...',  // hashed
  previousDeviceIds: ['x1y2z3...']  // for fraud detection
}
```

**Collection (client-side):**

```typescript
function collectPrivateData(): PrivateProfile {
  return {
    registeredAt: new Date().toISOString(),
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    device: {
      type: detectDeviceType(),
      os: detectOS(),
      browser: detectBrowser(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    },
    deviceId: await getDeviceFingerprint()
  };
}
```

**Fraud Detection (soft, internal only):**

We compare `deviceId` across sessions. If someone logs in from many different devices rapidly, we flag it but don't block. This is for our internal analytics, never exposed to apps.

## Tasks

- [ ] Private data collection function
- [ ] Store to TinyCloud on registration
- [ ] Update device list on each login
- [ ] Fraud signal calculation (internal dashboard)

## Acceptance Criteria

- [ ] Locale captured from browser
- [ ] Device metadata collected
- [ ] All private data in user's TinyCloud vault
- [ ] Never exposed via SDK to apps
- [ ] Fraud signals visible in internal dashboard only

---

# 7. Wallet Linking & web3.bio Enrichment

**Status:** DRAFT  
**Design:** Pending

## Goal

We create vanilla (fresh) wallets for users via Porto. But users can connect their main wallet to enrich their identity. We pull data via web3.bio and link identities privately.

## How It Works

1. User signs up → gets new Porto wallet (vanilla)
2. User optionally connects existing wallet (MetaMask, etc.)
3. We query web3.bio for that wallet's identity data
4. Store enriched data in user's TinyCloud
5. Link vanilla wallet ↔ main wallet privately

## What web3.bio Gives Us

```typescript
// web3.bio response for 0x1234...
{
  address: '0x1234...',
  identity: {
    ens: 'alice.eth',
    lens: 'alice.lens',
    farcaster: { fid: 12345, username: 'alice' },
    twitter: '@alice',
    // ... more
  },
  avatar: 'https://...',
  description: 'Builder',
  links: [...]
}
```

## Technical

**TinyCloud Structure:**

```typescript
// /linked-wallets/{saltedAddress}
{
  linkedAt: '2026-01-03T12:00:00Z',
  web3bio: {
    ens: 'alice.eth',
    farcaster: { fid: 12345, username: 'alice' },
    lens: 'alice.lens',
    // ... cached web3.bio data
  },
  // Real address stored with encryption, salted version as key
}
```

**Linking Flow:**

```typescript
async function linkExternalWallet(externalAddress: string) {
  // 1. User connects external wallet (MetaMask, etc.)
  
  // 2. User signs message proving ownership
  const message = `Link wallet to Villa Identity\nVilla Wallet: ${villaWalletAddress}\nExternal Wallet: ${externalAddress}\nTimestamp: ${Date.now()}`;
  const signature = await externalWallet.signMessage(message);
  
  // 3. Verify signature on backend
  const verified = await verifySignature(message, signature, externalAddress);
  if (!verified) throw new Error('Invalid signature');
  
  // 4. Query web3.bio for identity data
  const web3bioData = await fetch(
    `https://api.web3.bio/profile/${externalAddress}`
  ).then(r => r.json());
  
  // 5. Store in TinyCloud with signature proof
  const saltedKey = saltWallet(externalAddress);
  await tinycloud.put(`linked-wallets/${saltedKey}`, {
    linkedAt: new Date().toISOString(),
    linkSignature: signature,           // Proof of ownership
    linkedFrom: externalAddress,        // Clear reference
    web3bio: web3bioData
  });
}
```

**Signature is required.** No signature = no linking. This proves the user actually controls the external wallet, not just knows the address.

**Privacy:**
- Linked wallet data is private (only user sees it)
- Apps can't query linked wallets
- Used for personalization in main app only
- Salted keys prevent correlation

## Use Cases

- Show user's ENS name in their profile
- Import Farcaster social graph
- Display existing avatar from ENS/Lens
- Future: reputation scoring from on-chain activity

## Tasks

- [ ] Wallet connection UI in main app
- [ ] Signature message format and signing flow
- [ ] Signature verification on backend
- [ ] web3.bio integration
- [ ] TinyCloud storage for linked wallets (with signature)
- [ ] Display enriched data in profile
- [ ] Unlink wallet flow
- [ ] Refresh/update web3.bio data

## Acceptance Criteria

- [ ] User can connect external wallet
- [ ] Signature required from external wallet to complete linking
- [ ] Invalid signatures rejected
- [ ] web3.bio data fetched and stored
- [ ] Linked data visible in user's profile
- [ ] Data stays private (not exposed to apps)
- [ ] Multiple wallets can be linked

---

# 8. API Documentation

**Status:** DRAFT  
**Design:** N/A

## Goal

Documentation that works for humans, AI assistants (Claude, Cursor, Lovable, 21st.dev), and automated tools.

## Requirements

**For Humans:**
- Quick start guide (5 min to working integration)
- Clear examples in TypeScript and JavaScript
- Interactive API explorer
- Troubleshooting guide

**For AI Assistants:**
- Structured OpenAPI 3.1 spec
- Every endpoint with request/response examples
- Error codes with solutions
- Type definitions exported

**For Automated Tools:**
- OpenAPI spec for code generation
- TypeScript definitions
- Postman/Insomnia collections

## Structure

```
docs/
├── openapi.yaml           # Full API spec
├── sdk/
│   ├── quickstart.md
│   ├── authentication.md
│   ├── nicknames.md
│   ├── avatars.md
│   └── consent.md
├── api/
│   ├── nicknames.md
│   ├── profiles.md
│   └── apps.md
└── examples/
    ├── react/
    ├── vanilla-js/
    └── node/
```

## JSDoc Standard

Every SDK method gets full JSDoc:

```typescript
/**
 * Opens fullscreen iframe and authenticates user via passkey.
 * 
 * @example
 * ```typescript
 * const identity = await villa.signIn();
 * console.log(identity.nickname);
 * ```
 * 
 * @returns User identity with wallet, nickname, avatar
 * @throws {InvalidAppCredentialsError} App not registered
 * @throws {UserCancelledError} User closed auth flow
 */
async signIn(): Promise<Identity>
```

## Tasks

- [ ] OpenAPI 3.1 spec
- [ ] JSDoc for all SDK methods
- [ ] Quick start guide
- [ ] Feature guides
- [ ] Example projects
- [ ] Documentation site (Mintlify or similar)
- [ ] Test docs with AI assistants

## Acceptance Criteria

- [ ] Every endpoint documented with examples
- [ ] Quick start works in < 5 minutes
- [ ] AI assistants can answer questions from docs
- [ ] Code examples tested and working

---

# Appendix: Full Data Model

```sql
-- App registration
CREATE TABLE registered_apps (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(64) NOT NULL UNIQUE,
    app_wallet BYTEA NOT NULL,
    signature BYTEA NOT NULL,
    app_name VARCHAR(255),
    app_url VARCHAR(500),
    allowed_origins TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Nicknames (ENS-compatible)
CREATE TABLE nicknames (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(30) NOT NULL,
    nickname_hash BYTEA NOT NULL UNIQUE,
    namehash BYTEA NOT NULL UNIQUE,
    label_hash BYTEA NOT NULL,
    parent_namehash BYTEA NOT NULL,
    owner_address BYTEA NOT NULL,
    migration_status VARCHAR(20) DEFAULT 'offchain',
    migration_signature BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reserved nicknames
CREATE TABLE reserved_nicknames (
    nickname VARCHAR(30) PRIMARY KEY,
    reason VARCHAR(100)
);

-- Indexes
CREATE UNIQUE INDEX idx_nickname_lower ON nicknames(LOWER(nickname));
CREATE INDEX idx_nickname_owner ON nicknames(owner_address);
CREATE INDEX idx_apps_wallet ON registered_apps(app_wallet);
```

---

# Appendix: TinyCloud Structure

```
User's Vault:
├── profile/
│   ├── public              # nickname, avatar, walletAddress
│   └── private             # registeredAt, locale, device, deviceId
├── consent/
│   └── {appId}             # scopes, grantedAt
├── apps/
│   └── {appId}/            # ISOLATED per app
│       └── {key}           # { value, author, writtenAt, linkedTo }
└── linked-wallets/
    └── {saltedAddress}     # { linkSignature, linkedFrom, web3bio, linkedAt }
```

**App isolation:** Each app only sees `/apps/{ownAppId}/`. Gateway enforces this — requests for other apps' data return empty. User sees all in main app.

**Wallet linking:** Requires signature from external wallet. No signature = no entry in `linked-wallets/`.

---

# Appendix: Environment Variables

```bash
# Database (Digital Ocean Managed PostgreSQL)
DATABASE_URL=postgresql://...

# Signing key (stored in DO Secrets / environment)
GATEWAY_SIGNING_KEY=0x...  # Ed25519 or ECDSA private key
VILLA_WALLET_SALT=random-32-byte-hex

# External services (internal, not exposed)
TINYCLOUD_HOST=https://node.tinycloud.xyz
PORTO_CONFIG_URL=https://porto.xyz/config

# ENS
ENS_RESOLVER_ADDRESS=0x...

# Infrastructure
DO_SPACES_KEY=...          # For any static assets
DO_SPACES_SECRET=...
```

**Note:** We use Digital Ocean as main infrastructure. Signing keys stored as environment secrets in DO App Platform, not external KMS.

---

# Summary

Eight features for v1:

1. **SDK** — Fullscreen iframe, React components, wraps Porto
2. **App Registration** — Wallet signature auth, PostgreSQL now, on-chain later
3. **Nickname Registry** — PostgreSQL → CCIP-Read → ENS resolution
4. **Avatar System** — DiceBear, 30s timer, minimal storage
5. **User Permissions** — See/revoke app access, view/delete app data
6. **Private Data** — Locale, device info, fraud signals (internal only)
7. **Wallet Linking** — Connect main wallet, web3.bio enrichment, private storage
8. **Documentation** — OpenAPI, JSDoc, AI-friendly

Ready to build.
