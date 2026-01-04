# Villa Identity Storage Architecture

**Status:** Design
**Author:** Claude
**Date:** 2026-01-05

---

## Why This Approach

Villa needs to store user identity data (nickname, avatar) in a way that:
1. **Works immediately** - No blockchain dependency for basic functionality
2. **Scales cheaply** - Free tiers should handle early growth
3. **Migrates to ENS** - Clear path to decentralized identity
4. **Preserves privacy** - Minimal data, user control

**Decision:** Start with database-backed storage, add ENS integration when economically viable.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Villa SDK                                │
├─────────────────────────────────────────────────────────────────┤
│  resolveNickname(nick) ─────▶ Try ENS (CCIP-Read) ──┐           │
│                                        │            │           │
│                              ┌─────────▼─────────┐  │           │
│                              │ VillaNicknameResolver │◀──┘           │
│                              │  (On-chain gateway) │           │
│                              └─────────┬─────────┘           │
│                                        │ HTTP                │
│                              ┌─────────▼─────────┐           │
│                              │ api.villa.cash    │           │
│                              │ /ens/resolve      │           │
│                              └─────────┬─────────┘           │
│                                        │                     │
│                              ┌─────────▼─────────┐           │
│                              │     Database       │           │
│                              │  (Supabase/Turso) │           │
│                              └───────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Options Comparison

### Option 1: TinyCloud (Porto's Storage)

Porto provides TinyCloud for per-account key-value storage.

**Pros:**
- Free, built into Porto SDK
- Per-user storage linked to passkey
- No backend needed

**Cons:**
- Limited to 100KB per account
- No cross-account queries (can't check nickname availability)
- Data tied to Porto infrastructure
- Can't resolve `alice.villa` → address without user online

**Use for:** Personal settings, preferences, backup seeds

**NOT for:** Nicknames (need availability check), avatars (need resolution)

### Option 2: Database + CCIP-Read Gateway (Recommended)

Centralized database with on-chain gateway for ENS compatibility.

**Pros:**
- Standard ENS resolution works cross-chain
- Full control over data model
- Can check nickname availability
- Free tier (Supabase: 500MB, Turso: 9GB)
- Easy migration to ENS later

**Cons:**
- Requires backend service
- Centralized (initially)
- Gateway is trust point

**Use for:** Nicknames, avatars, profile data

### Option 3: Direct Base ENS Registration

Register `alice.villa.base.eth` on-chain.

**Pros:**
- Fully decentralized
- Standard ENS resolution
- User owns the name

**Cons:**
- Expensive (~$0.50-2.00 per registration)
- Gas fees per update
- Slower (blockchain confirmation)

**Use for:** Phase 3 (users can optionally pay)

---

## Cost Analysis

### Database Serving (Recommended for Phase 1-2)

| Provider | Free Tier | Cost at 10K users | Cost at 100K users |
|----------|-----------|-------------------|-------------------|
| **Supabase** | 500MB, 500K rows | $0/mo | $25/mo (Pro) |
| **Turso** | 9GB, 500 DBs | $0/mo | $29/mo (Scaler) |
| **Cloudflare D1** | 5GB, 100K writes/day | $0/mo | ~$5/mo |
| **PlanetScale** | 5GB, 1B reads | $0/mo | $29/mo |

**Data per user:** ~500 bytes (address + nickname + avatar config)
- 10K users = 5MB
- 100K users = 50MB
- 1M users = 500MB

**Conclusion:** Database storage is effectively free for first 100K users.

### Base ENS Registration

| Cost Component | Base Sepolia | Base Mainnet |
|----------------|--------------|--------------|
| Registration (5 char) | ~0.001 ETH | ~$0.50-1.00 |
| Gas (register) | ~0.0005 ETH | ~$0.10-0.30 |
| Gas (set resolver) | ~0.0003 ETH | ~$0.05-0.15 |
| **Total per user** | ~0.002 ETH | **~$0.75-1.50** |

**At scale:**
- 10K users: $7,500 - $15,000
- 100K users: $75,000 - $150,000

**Conclusion:** ENS sponsorship not viable for free tier. Offer as premium feature.

### Hybrid Approach Cost

| Phase | Users | Monthly Cost | Notes |
|-------|-------|--------------|-------|
| 1 (DB only) | 0-10K | $0 | Free tier |
| 2 (DB + optional ENS) | 10K-50K | $25-50 | Users pay for ENS |
| 3 (Decentralized option) | 50K+ | $25-50 + gas | Users own names |

---

## Data Model

### Database Schema

```sql
-- User profiles (primary store)
CREATE TABLE profiles (
  address VARCHAR(42) PRIMARY KEY,  -- Ethereum address (0x...)
  nickname VARCHAR(32) UNIQUE,       -- Unique, case-insensitive
  nickname_normalized VARCHAR(32),   -- Lowercase for lookup
  avatar_style VARCHAR(20),          -- 'bottts', 'adventurer', etc.
  avatar_seed VARCHAR(64),           -- Seed for generation
  avatar_gender VARCHAR(10),         -- 'male', 'female', 'other'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nickname reservations (prevent squatting)
CREATE TABLE nickname_reservations (
  nickname_normalized VARCHAR(32) PRIMARY KEY,
  address VARCHAR(42),
  expires_at TIMESTAMP,  -- Reservation expires if not confirmed
  created_at TIMESTAMP DEFAULT NOW()
);

-- ENS registrations (track on-chain names)
CREATE TABLE ens_registrations (
  address VARCHAR(42) PRIMARY KEY,
  ens_name VARCHAR(255),  -- e.g., alice.villa.base.eth
  chain_id INTEGER,
  registered_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_profiles_nickname ON profiles(nickname_normalized);
CREATE INDEX idx_reservations_expires ON nickname_reservations(expires_at);
```

### API Endpoints

```typescript
// POST /api/nickname/check
// Check if nickname is available
{
  nickname: "alice"
}
// Response: { available: true, normalized: "alice", suggestions: ["alice_1", "alice_2"] }

// POST /api/nickname/reserve
// Reserve nickname for 10 minutes (requires signed message)
{
  nickname: "alice",
  address: "0x...",
  signature: "0x..."  // Sign: "Reserve nickname alice for 0x..."
}
// Response: { reserved: true, expiresAt: 1704499200 }

// POST /api/profile
// Create/update profile (requires signed message)
{
  address: "0x...",
  nickname: "alice",
  avatar: { style: "bottts", seed: "alice", gender: "other" },
  signature: "0x..."  // Sign: "Update profile for 0x..."
}

// GET /api/profile/:address
// Get profile by address
// Response: { address, nickname, avatar, ens: "alice.villa.base.eth" }

// GET /ens/resolve?name=alice.villa
// CCIP-Read gateway (called by VillaNicknameResolverV2)
// Response: { address: "0x..." }
```

---

## Implementation Plan

### Phase 1: Database Storage (Now)

**Goal:** Working nickname + avatar system without ENS cost.

```
1. Deploy API endpoints:
   - /api/nickname/check
   - /api/nickname/reserve
   - /api/profile (CRUD)
   - /ens/resolve (CCIP-Read gateway)

2. SDK integration:
   - Villa.checkNickname(name) → availability
   - Villa.reserveNickname(name) → 10min hold
   - Villa.createProfile(data) → store
   - Villa.resolveNickname(name) → address

3. Update VillaNicknameResolverV2:
   - Point to api.villa.cash/ens/resolve
   - Already deployed, just configure
```

### Phase 2: ENS Resolution Support

**Goal:** Allow standard ENS resolution of villa.base.eth names.

```
1. Register villa.base.eth on Base ENS
2. Set VillaNicknameResolverV2 as resolver
3. Users can resolve alice.villa.base.eth via any ENS client
4. Data still lives in database
```

### Phase 3: Optional On-Chain Registration

**Goal:** Users can pay to register their name on-chain.

```
1. Add "Upgrade to ENS" button
2. User pays gas + registration fee
3. Name registered on Base ENS
4. Database marks as "on-chain verified"
5. Resolution works both ways
```

---

## Security Considerations

### Nickname Squatting Prevention

1. **Signature required** - All writes require wallet signature
2. **Reservation timeout** - 10 minute hold, then released
3. **Rate limiting** - Max 10 reservations per address per hour
4. **Banned words** - Filter offensive/misleading names

### Data Ownership

1. **Users can export** - Full profile export available
2. **Users can delete** - Right to be forgotten
3. **No selling** - Never sell user data
4. **Minimal data** - Only store what's needed

### Gateway Trust Model

The CCIP-Read gateway is a centralization point. Mitigations:

1. **Open source** - Gateway code public
2. **Multiple operators** - Villa + community can run gateways
3. **On-chain fallback** - Phase 3 adds direct ENS option
4. **Data signatures** - Responses signed by known key

---

## TinyCloud Integration (Supplementary)

While not primary storage, TinyCloud can store:

```typescript
// User preferences (not queryable by others)
await porto.tinycloud.set('preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true
})

// Backup hint (encrypted)
await porto.tinycloud.set('recovery_hint', encryptedHint)

// Session data
await porto.tinycloud.set('last_session', {
  timestamp: Date.now(),
  device: 'iPhone 15'
})
```

**Limit:** 100KB total per account.

---

## Migration Path to Full Decentralization

```
Phase 1 (Now)      Phase 2 (2026 Q2)    Phase 3 (2026 Q3+)
─────────────────────────────────────────────────────────────
Database           Database + ENS        Hybrid
    │                   │                    │
    │              Register               Users choose:
    │              villa.base.eth         ├─ Free (DB)
    │                   │                 └─ Paid (ENS)
    │                   │
    ▼                   ▼                    ▼
Centralized        Semi-decentralized    Fully optional
$0/user            $0/user + ENS fee     $0 or $0.75/user
```

---

## Next Steps

1. [ ] Set up Supabase/Turso database
2. [ ] Implement API endpoints in apps/api
3. [ ] Add SDK methods for nickname operations
4. [ ] Update VillaNicknameResolverV2 gateway URL
5. [ ] Write E2E tests for profile flow
6. [ ] Document API for external developers
