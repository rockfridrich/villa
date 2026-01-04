# Villa V2 Architecture

**Status:** DRAFT
**Network:** Base (Primary), Base Sepolia (Testnet)
**Updated:** January 4, 2026

---

## Vision

Villa is a privacy-first identity system for pop-up villages. V2 evolves from a single Next.js app to a **monorepo with SDK for external apps**, running primarily on **Base** for liquidity and infrastructure, with **nickname storage** that flows from TinyCloud → PostgreSQL → ENS.

---

## Why Base

| Factor | Base | Ethereum | Polygon |
|--------|------|----------|---------|
| Gas costs | ~$0.001/tx | ~$0.50/tx | ~$0.01/tx |
| Finality | 2 seconds | 12 seconds | 2 seconds |
| ENS support | CCIP-Read ✅ | Native | Limited |
| Porto support | ✅ Native | ✅ Native | ✅ |
| Liquidity | High (Coinbase) | Highest | Medium |
| Ecosystem | Growing fast | Mature | Mature |
| Basenames | `@alice.base.eth` | N/A | N/A |

**Decision:** Base is the best balance of cost, speed, and ecosystem for Villa's target users (non-crypto-native village residents).

---

## Domain Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Villa Domain Map                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   villa.cash (www.villa.cash)                                  │
│   └── Main web app (Next.js)                                   │
│       ├── /              Landing                                │
│       ├── /onboarding    Passkey creation, profile, avatar     │
│       ├── /home          User dashboard                         │
│       ├── /settings      Recovery setup, account management    │
│       └── /recover       Recovery flows                         │
│                                                                 │
│   api.villa.cash                                               │
│   └── REST API service (Hono on Cloudflare Workers)            │
│       ├── /nicknames     Check, claim, resolve                  │
│       ├── /avatars       Avatar rendering (SVG/PNG)            │
│       ├── /ens           CCIP-Read gateway for ENS             │
│       └── /health        Health check                           │
│                                                                 │
│   relay.villa.cash                                             │
│   └── Porto Relay (Docker on DO/Fly)                           │
│       └── /rpc           Gas sponsoring for recovery ops        │
│                                                                 │
│   sdk.villa.cash                                               │
│   └── SDK documentation (Starlight/Docusaurus)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
villa/
├── apps/
│   ├── web/                    # Main Next.js app (villa.cash)
│   │   ├── src/
│   │   │   ├── app/            # Next.js pages
│   │   │   ├── components/     # App-specific components
│   │   │   └── lib/            # App-specific utilities
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── api/                    # Hono API (api.villa.cash)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── nicknames.ts
│   │   │   │   ├── avatars.ts
│   │   │   │   └── ens.ts      # CCIP-Read gateway
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── relay/                  # Porto Relay (relay.villa.cash)
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   │
│   └── docs/                   # SDK docs (sdk.villa.cash)
│       └── package.json
│
├── packages/
│   ├── sdk/                    # @villa/sdk - External app integration
│   │   ├── src/
│   │   │   ├── client.ts       # Main SDK class
│   │   │   ├── auth.ts         # signIn, signOut
│   │   │   ├── profile.ts      # getProfile, getNickname
│   │   │   ├── avatar.ts       # getAvatarUrl, renderAvatar
│   │   │   ├── ens.ts          # ENS resolution (direct, no backend)
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsup.config.ts
│   │
│   ├── contracts/              # Solidity contracts (Base)
│   │   ├── src/
│   │   │   ├── BiometricRecoverySigner.sol
│   │   │   ├── VillaNicknameResolver.sol  # ENS CCIP-Read resolver
│   │   │   └── VillaRegistry.sol          # On-chain registry (future)
│   │   ├── script/
│   │   ├── test/
│   │   └── foundry.toml
│   │
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                 # Shared config
│       ├── tailwind/
│       ├── tsconfig/
│       └── eslint/
│
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## Nickname Storage Architecture

### Storage Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   Nickname Storage Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Layer 1: TinyCloud (Porto per-account storage)                │
│   ├── Immediate storage after claim                              │
│   ├── User-controlled, encrypted                                 │
│   ├── Survives app reinstalls                                    │
│   └── Format: { nickname: "alice", claimedAt: timestamp }        │
│                                                                  │
│                          │                                       │
│                          ▼                                       │
│                                                                  │
│   Layer 2: PostgreSQL (api.villa.cash)                          │
│   ├── Fast lookups for availability checking                     │
│   ├── Address → nickname mapping                                 │
│   ├── nickname → address reverse lookup                          │
│   ├── Avatar config storage                                      │
│   └── Analytics (claim rate, popular names)                      │
│                                                                  │
│                          │                                       │
│                          ▼                                       │
│                                                                  │
│   Layer 3: ENS via CCIP-Read (Base + Ethereum)                  │
│   ├── alice.villa.eth resolves via CCIP gateway                 │
│   ├── Gateway queries PostgreSQL, returns ENS-format response   │
│   ├── Works in any ENS-compatible wallet/app                    │
│   └── Future: migrate to on-chain VillaRegistry on Base         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (PostgreSQL)

```sql
-- Nicknames table
CREATE TABLE nicknames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(30) NOT NULL UNIQUE,
  nickname_normalized VARCHAR(30) NOT NULL UNIQUE, -- lowercase, stripped
  address VARCHAR(42) NOT NULL UNIQUE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nicknames_address ON nicknames(address);
CREATE INDEX idx_nicknames_normalized ON nicknames(nickname_normalized);

-- Avatar configs table
CREATE TABLE avatars (
  address VARCHAR(42) PRIMARY KEY,
  style VARCHAR(20) NOT NULL, -- 'adventurer', 'avataaars', etc.
  seed VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENS text records (for future extensibility)
CREATE TABLE ens_records (
  address VARCHAR(42) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (address, key)
);
```

### API Endpoints (api.villa.cash)

```typescript
// GET /nicknames/check/:nickname
// Check if nickname is available
{
  available: boolean,
  normalized: string,
  suggestion?: string  // If taken, suggest alice123
}

// POST /nicknames/claim
// Claim a nickname (requires Porto signature)
{
  nickname: string,
  address: string,
  signature: string  // Porto signed message
}

// GET /nicknames/resolve/:nickname
// Resolve nickname to address
{
  address: string,
  avatar: { style, seed, gender },
  ens: "alice.villa.eth"
}

// GET /nicknames/reverse/:address
// Reverse lookup address to nickname
{
  nickname: string,
  avatar: { style, seed, gender }
}
```

---

## ENS Resolution (No Backend Calls from SDK)

The SDK resolves ENS names **directly** without calling Villa's backend, using viem's built-in ENS support with CCIP-Read.

### How It Works

```typescript
// packages/sdk/src/ens.ts
import { createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

/**
 * Resolve a Villa nickname to an address
 * Uses ENS CCIP-Read - no backend call needed
 *
 * @example
 * const address = await resolveNickname('alice')
 * // Resolves alice.villa.eth via CCIP-Read
 */
export async function resolveNickname(nickname: string): Promise<`0x${string}` | null> {
  try {
    const ensName = `${normalize(nickname)}.villa.eth`
    const address = await client.getEnsAddress({ name: ensName })
    return address
  } catch {
    return null
  }
}

/**
 * Resolve any ENS name to an address
 * Works with .eth, .base.eth, or any ENS name
 */
export async function resolveEns(name: string): Promise<`0x${string}` | null> {
  try {
    const address = await client.getEnsAddress({ name: normalize(name) })
    return address
  } catch {
    return null
  }
}

/**
 * Get ENS text records (avatar, description, etc.)
 */
export async function getEnsText(name: string, key: string): Promise<string | null> {
  try {
    return await client.getEnsText({ name: normalize(name), key })
  } catch {
    return null
  }
}
```

### CCIP-Read Gateway (api.villa.cash/ens)

For Villa-specific names (`*.villa.eth`), we run a CCIP-Read gateway that:

1. Receives request from ENS resolver on mainnet
2. Queries PostgreSQL for nickname → address mapping
3. Returns signed response in ENS format

```typescript
// apps/api/src/routes/ens.ts
import { Hono } from 'hono'

const ens = new Hono()

// CCIP-Read gateway endpoint
// Called by ENS resolver when resolving alice.villa.eth
ens.get('/resolve', async (c) => {
  const { sender, data } = c.req.query()

  // Decode the ENS query
  const { name, record } = decodeEnsQuery(data)

  // Query our database
  const nickname = extractNickname(name) // "alice" from "alice.villa.eth"
  const result = await db.nicknames.findByNickname(nickname)

  if (!result) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Return ENS-format response with signature
  const response = encodeEnsResponse({
    address: result.address,
    records: {
      avatar: await getAvatarUrl(result.address),
      // ... other records
    }
  })

  return c.json({ data: response })
})

export default ens
```

---

## SDK Architecture (@villa/sdk)

### Installation

```bash
npm install @villa/sdk
# or
pnpm add @villa/sdk
```

### Quick Start

```typescript
import { Villa } from '@villa/sdk'

// Initialize
const villa = new Villa({
  appId: 'your-app-id',
  network: 'base',  // or 'base-sepolia' for testnet
})

// Sign in (opens Villa iframe)
const identity = await villa.signIn()
// Returns: { address: '0x...', nickname: 'alice', avatar: {...} }

// Get any user's profile (direct ENS resolution, no backend)
const profile = await villa.getProfile('alice')
// Returns: { address: '0x...', nickname: 'alice', avatar: {...} }

// Resolve ENS name (works with any .eth name)
const address = await villa.resolveEns('vitalik.eth')

// Get avatar URL (deterministic, no backend call)
const avatarUrl = villa.getAvatarUrl('alice')
// Returns: https://api.dicebear.com/9.x/adventurer/svg?seed=...

// Render avatar as data URL
const avatarDataUrl = await villa.renderAvatar('alice', { format: 'png', size: 256 })
```

### SDK Class Design

```typescript
// packages/sdk/src/client.ts

export interface VillaConfig {
  appId: string
  network?: 'base' | 'base-sepolia'
  apiUrl?: string  // Override api.villa.cash for testing
}

export interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}

export interface Profile {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
  ens?: string
}

export class Villa {
  private config: VillaConfig
  private porto: Porto | null = null
  private identity: Identity | null = null

  constructor(config: VillaConfig) {
    this.config = {
      network: 'base',
      apiUrl: 'https://api.villa.cash',
      ...config
    }
  }

  /**
   * Sign in with Villa (opens iframe popup)
   * Handles passkey auth, nickname claim, avatar selection
   */
  async signIn(): Promise<Identity> {
    // Opens fullscreen iframe with Villa auth flow
    // Returns when user completes onboarding
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    await this.porto?.provider.request({ method: 'wallet_disconnect' })
    this.identity = null
  }

  /**
   * Get current signed-in identity
   */
  getIdentity(): Identity | null {
    return this.identity
  }

  /**
   * Get any user's profile by nickname
   * Uses ENS CCIP-Read - no backend call
   */
  async getProfile(nickname: string): Promise<Profile | null> {
    const address = await resolveNickname(nickname)
    if (!address) return null

    // Get avatar from ENS text record or derive from address
    const avatar = await this.getAvatarConfig(address)

    return {
      address,
      nickname,
      avatar,
      ens: `${nickname}.villa.eth`
    }
  }

  /**
   * Resolve any ENS name to address
   * Direct viem call, no backend
   */
  async resolveEns(name: string): Promise<`0x${string}` | null> {
    return resolveEns(name)
  }

  /**
   * Get avatar URL for a nickname or address
   * Deterministic - no network call needed
   */
  getAvatarUrl(nicknameOrAddress: string, options?: { size?: number }): string {
    const seed = this.getAvatarSeed(nicknameOrAddress)
    const size = options?.size || 128
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&size=${size}`
  }

  /**
   * Render avatar as data URL (PNG or SVG)
   */
  async renderAvatar(
    nicknameOrAddress: string,
    options?: { format?: 'svg' | 'png', size?: number }
  ): Promise<string> {
    // Generate locally using @dicebear/core
  }

  private getAvatarSeed(nicknameOrAddress: string): string {
    // Normalize and hash for deterministic seed
  }

  private async getAvatarConfig(address: string): Promise<AvatarConfig> {
    // Try ENS text record first, fallback to derived config
  }
}
```

---

## Base Wallet Support (Future)

### Phase 1: Porto Only (Current)
- Passkeys as primary auth
- Porto accounts (EIP-7702)
- Recovery via face + guardians

### Phase 2: Base Wallet as Primary Signer
- Allow existing Coinbase Wallet / Base wallet users to sign in
- Wallet address becomes Porto account's primary signer
- Benefits: users keep existing wallet, unified experience

```typescript
// Future SDK API
const villa = new Villa({
  appId: 'your-app',
  signers: {
    primary: 'base-wallet',  // or 'passkey'
    recovery: ['face', 'guardians']
  }
})

// Sign in with existing Base wallet
const identity = await villa.signIn({
  method: 'wallet',  // Opens wallet connect
})

// Or create new passkey-based account
const identity = await villa.signIn({
  method: 'passkey',  // Opens Porto dialog
})
```

### Technical Approach

Porto accounts support multiple key types:
- **WebAuthn** (passkey) - current primary
- **ECDSA** (wallet) - can add as co-signer
- **External** (contract) - for recovery signers

To add Base wallet as primary signer:

```typescript
// Add wallet as authorized signer
await porto.provider.request({
  method: 'experimental_authorize',
  params: [{
    keyType: 'ecdsa',
    publicKey: walletPublicKey,
    permissions: ['sign', 'transact'],
    label: 'Coinbase Wallet'
  }]
})
```

---

## Infrastructure Requirements

### Services

| Service | Platform | Purpose |
|---------|----------|---------|
| `apps/web` | Digital Ocean App Platform | Main web app |
| `apps/api` | Cloudflare Workers | REST API + CCIP gateway |
| `apps/relay` | Fly.io or DO App Platform | Porto relay (Docker) |
| `apps/docs` | Cloudflare Pages | SDK documentation |

### Database

| Resource | Platform | Purpose |
|----------|----------|---------|
| PostgreSQL | Neon or Supabase | Nickname registry, avatars |
| Redis | Upstash | Rate limiting, caching |

### DNS (Cloudflare)

| Record | Type | Value |
|--------|------|-------|
| `villa.cash` | CNAME | DO app |
| `www.villa.cash` | CNAME | DO app |
| `api.villa.cash` | CNAME | Workers route |
| `relay.villa.cash` | CNAME | Fly.io |
| `sdk.villa.cash` | CNAME | Pages |

### Secrets

| Secret | Used By | Source |
|--------|---------|--------|
| `DATABASE_URL` | API | Neon/Supabase |
| `MERCHANT_PRIVATE_KEY` | Relay | 1Password |
| `CLOUDFLARE_API_TOKEN` | Deploy | 1Password |
| `BASESCAN_API_KEY` | Contracts | 1Password |

---

## Migration Path

### Current State (V1)
```
villa/
├── src/                    # Next.js app
├── contracts/              # Foundry contracts
└── specs/
```

### Target State (V2)
```
villa/
├── apps/
│   ├── web/               # Migrate from src/
│   ├── api/               # New
│   ├── relay/             # New
│   └── docs/              # New
├── packages/
│   ├── sdk/               # New
│   ├── contracts/         # Move from contracts/
│   ├── ui/                # Extract from src/components/ui
│   └── config/            # Extract configs
└── specs/
```

### Migration Steps

1. **Setup Turborepo** - Initialize monorepo tooling
2. **Extract UI package** - Move shared components
3. **Create SDK package** - Start with types + ENS resolution
4. **Create API service** - Start with nickname endpoints
5. **Move web app** - Relocate to apps/web
6. **Move contracts** - Relocate to packages/contracts
7. **Setup relay** - Docker service for Porto relay
8. **Deploy incrementally** - Each service independently

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Turborepo monorepo
- [ ] Extract packages/ui from current components
- [ ] Create packages/config with shared configs
- [ ] Migrate apps/web (current Next.js app)
- [ ] Setup pnpm workspaces

### Phase 2: API + Nicknames (Week 2-3)
- [ ] Create apps/api with Hono
- [ ] Setup PostgreSQL (Neon)
- [ ] Implement nickname endpoints
- [ ] Implement CCIP-Read gateway
- [ ] Deploy to Cloudflare Workers

### Phase 3: SDK (Week 3-4)
- [ ] Create packages/sdk
- [ ] Implement ENS resolution (direct, no backend)
- [ ] Implement avatar rendering
- [ ] Implement auth flow (iframe)
- [ ] Publish to npm as @villa/sdk

### Phase 4: Recovery + Relay (Week 4-5)
- [ ] Create apps/relay (Porto relay Docker)
- [ ] Deploy relay to Fly.io
- [ ] Update biometric recovery for Base
- [ ] Deploy contracts to Base Sepolia

### Phase 5: Production (Week 5-6)
- [ ] Deploy contracts to Base mainnet
- [ ] Migrate DNS to final structure
- [ ] E2E testing across all services
- [ ] SDK documentation site

---

## Acceptance Criteria

### Monorepo
- [ ] `pnpm install` works from root
- [ ] `pnpm build` builds all packages
- [ ] `pnpm dev` starts web app
- [ ] Turborepo caching working

### API
- [ ] Nickname availability check < 100ms
- [ ] Nickname claim with signature verification
- [ ] CCIP-Read gateway resolves alice.villa.eth
- [ ] Rate limiting on all endpoints

### SDK
- [ ] `villa.signIn()` opens auth iframe
- [ ] `villa.getProfile('alice')` resolves via ENS
- [ ] `villa.resolveEns('vitalik.eth')` works
- [ ] Avatar rendering works offline
- [ ] Published to npm

### Relay
- [ ] Health check endpoint
- [ ] Gas sponsoring for recovery ops
- [ ] Merchant spending limits

### Contracts
- [ ] BiometricRecoverySigner deployed on Base Sepolia
- [ ] VillaNicknameResolver deployed on mainnet (for CCIP)
- [ ] All contracts verified on block explorer

---

## Out of Scope (V2)

- On-chain nickname registry (use offchain + CCIP for now)
- Native mobile SDK (React Native wrapper later)
- Custom theming for SDK iframe
- Multi-chain support beyond Base + mainnet
- Farcaster integration
- Token/NFT support

---

Ready for architect decomposition.
