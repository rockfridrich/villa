# Villa Production Roadmap

**Created:** 2026-01-06
**Status:** Active
**Goal:** Single path from current state to production-ready mainnet deployment

---

## Executive Summary

Villa is currently at **Beta (Base Sepolia)**. This spec documents all blockers and the critical path to production (Base Mainnet).

### Current State (Updated 2026-01-06)

| Component | Status | Notes |
|-----------|--------|-------|
| Porto SDK Integration | ✅ Working | Passkeys via `id.porto.sh` |
| Database (PostgreSQL) | ✅ Working | Profiles, nicknames persist |
| SDK npm Packages | ✅ Published | @rockfridrich/villa-sdk v0.1.0 |
| Contracts (Sepolia) | ✅ Deployed | VillaNicknameResolverV2, BiometricRecoverySignerV2 |
| Generated Avatars | ✅ Persist | Database-backed cross-device |
| Nicknames | ✅ Persist | Database-backed cross-device |
| Auth Flow | ✅ Working | Sign in, create account, returning user |
| Developer Portal | ✅ Live | developers.villa.cash |
| TinyCloud | 🟡 Deferred | Only needed for custom avatar uploads |
| ENS/CCIP-Read | 🟡 Deferred | Direct API works, full EIP-3668 deferred |
| Passkey Domain | 🟡 Future | Phase 2 (requires audit + migration) |
| Mainnet Contracts | 🔴 Blocked | External: audit + Groth16 + multisig |

**Beta Status: PRODUCTION READY** - All core features working on beta.villa.cash

---

## Critical Path Diagram

```
Phase 1: Beta Stabilization (Current)
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [TinyCloud SDK]  ──►  [ENS CCIP-Read]  ──►  [Domain Config]    │
│        P0                    P0                    P0            │
│   Initialize SDK,       Wire gateway,         Point resolvers    │
│   connect Porto         implement handler     to beta API        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Phase 2: Passkey Sovereignty
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [WebAuthn Research]  ──►  [Custom RP]  ──►  [Migration Tool]   │
│        P1                      P1                  P1            │
│   Porto customization      villa.cash or      Existing users     │
│   possibilities            key.villa.cash     re-enroll          │
│                                                                   │
│   ⚠️  Requires security audit before production use              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Phase 3: Mainnet Deployment
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [Security Audit]  ──►  [Groth16 Verifier]  ──►  [Multisig]     │
│        P0                     P1                     P0          │
│   External audit          Real ZK prover        2/3 multisig     │
│   (contracts + SDK)       for biometric         ownership        │
│                                                                   │
│            │                                        │            │
│            └──────────────►  [Mainnet Deploy]  ◄───┘            │
│                                   P0                             │
│                            Base mainnet                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Beta Stabilization

### 1.1 TinyCloud Integration (P0)

**Current State:**
- `@tinycloudlabs/web-sdk` installed but never imported
- Uses localStorage for all data (session.ts, wallet.ts)
- No avatar persistence beyond local device

**Required Changes:**

```typescript
// apps/web/src/lib/storage/tinycloud.ts - Currently stubbed

import { TinyCloud } from '@tinycloudlabs/web-sdk'

// Initialize with Porto wallet
export async function initTinyCloud(wallet: PortoAccount) {
  const tinycloud = new TinyCloud({
    wallet: wallet,
    appId: 'villa.cash',
  })
  await tinycloud.connect()
  return tinycloud
}

// Save user profile
export async function saveProfile(profile: VillaProfile) {
  const tc = getTinyCloudInstance()
  await tc.put('profile', JSON.stringify(profile))
}

// Load user profile (with localStorage fallback)
export async function loadProfile(): Promise<VillaProfile | null> {
  try {
    const tc = getTinyCloudInstance()
    const data = await tc.get('profile')
    return data ? JSON.parse(data) : null
  } catch {
    return loadFromLocalStorage()
  }
}
```

**Files to Modify:**
- `apps/web/src/lib/storage/tinycloud.ts` - Full SDK integration
- `apps/web/src/lib/porto.ts` - Pass wallet to TinyCloud init
- `apps/web/src/app/onboarding/page.tsx` - Save profile after creation

**Test:**
```bash
# Verify avatar persists across devices
1. Create account on Device A
2. Sign in on Device B
3. Avatar should load from TinyCloud
```

---

### 1.2 ENS CCIP-Read Gateway (P0)

**Current State:**
- VillaNicknameResolverV2 deployed: `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800`
- Gateway URL set to: `https://api.villa.cash/ens/resolve`
- Gateway returns `0x` (stubbed implementation)
- Database has profiles table with nicknames

**Required Changes:**

```typescript
// apps/api/src/routes/ens.ts - Currently stubbed

import { db } from '../db'
import { profiles } from '../db/schema'
import { eq } from 'drizzle-orm'
import { encodeFunctionResult, pad } from 'viem'

// CCIP-Read handler
export async function handleResolve(name: string, data: string) {
  // Parse ENS name (e.g., "alice.villa" → "alice")
  const nickname = name.replace('.villa', '').toLowerCase()

  // Lookup in database
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.nickname_normalized, nickname))
    .limit(1)

  if (!profile.length) {
    return { result: '0x' } // Not found
  }

  // Decode the requested selector
  const selector = data.slice(0, 10)

  // addr(bytes32) - 0x3b3b57de
  if (selector === '0x3b3b57de') {
    return {
      result: encodeFunctionResult({
        abi: [{ name: 'addr', type: 'function', outputs: [{ type: 'address' }] }],
        functionName: 'addr',
        result: [profile[0].address as `0x${string}`],
      }),
    }
  }

  return { result: '0x' }
}
```

**Update Gateway URL for Beta:**
```bash
# Point to beta API instead of production
cast send 0xf4648423aC6b3f6328018c49B2102f4E9bA6D800 \
  "setUrl(string)" \
  "https://beta.villa.cash/api/ens/resolve" \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_KEY
```

**Files to Modify:**
- `apps/api/src/routes/ens.ts` - Implement CCIP-Read handler
- Contract URL update via cast (one-time)

**Test:**
```typescript
// Test nickname resolution
const address = await client.getEnsAddress({
  name: 'alice.villa',
  universalResolverAddress: BASE_SEPOLIA_UNIVERSAL_RESOLVER,
})
expect(address).toBe('0x...')  // Alice's Porto address
```

---

### 1.3 Domain Configuration (P0)

**Current State:**
| Domain | DNS | Status |
|--------|-----|--------|
| villa.cash | Cloudflare | Production (DO App) |
| beta.villa.cash | Cloudflare | Staging (DO App) |
| developers.villa.cash | Cloudflare | Docs site |
| dev-1/2.villa.cash | Cloudflare | PR previews |

**Required Changes:**
None for DNS. Issue is contract resolver URL.

**Resolver URL Verification:**
```bash
# Current URL (should be beta for testing)
cast call 0xf4648423aC6b3f6328018c49B2102f4E9bA6D800 "url()(string)" \
  --rpc-url https://sepolia.base.org

# Expected: https://beta.villa.cash/api/ens/resolve
```

---

## Phase 2: Passkey Sovereignty

### 2.1 Current Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Villa App     │ ───► │   Porto SDK     │ ───► │  id.porto.sh    │
│                 │      │                 │      │                 │
│  Custom UI/UX   │      │  connect()      │      │  WebAuthn RP    │
│  Theming        │      │  signMessage()  │      │  Passkey store  │
│  Profile mgmt   │      │  sendTx()       │      │  Account deploy │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Problem:** Passkeys are bound to `id.porto.sh` RP ID. Users see "id.porto.sh" in browser dialogs, not "villa.cash".

### 2.2 Investigation Required

**Option A: Porto Custom RP Support**
- Check if Porto SDK allows custom `rpId` configuration
- May require Porto team collaboration
- Lowest effort if supported

**Option B: Subdomain for Passkeys**
- Use `key.villa.cash` as RP ID
- Porto handles account abstraction only
- Villa owns passkey registration/authentication
- Medium effort

**Option C: Full Passkey Ownership**
- Villa implements WebAuthn directly
- Porto used only for smart contract interactions
- Highest effort, maximum control

**Research Tasks:**
```bash
# 1. Review Porto SDK source
gh repo clone ithacaxyz/porto
grep -r "rpId" porto/

# 2. Check Porto docs for custom RP
curl -s https://porto.sh/sdk | grep -i "rp"

# 3. Test with subdomain
# Create key.villa.cash → same server
# Attempt WebAuthn registration
```

### 2.3 Migration Considerations

If passkey domain changes from `id.porto.sh` to `villa.cash`:
- **Existing users CANNOT use old passkeys**
- Need migration flow: re-authenticate → re-register passkey
- Consider grace period with both systems

**Migration UX:**
```
1. User signs in with old passkey (Porto)
2. Prompt: "Upgrade your security"
3. Register new passkey (villa.cash)
4. Old passkey deprecated but works during transition
5. After N days, old passkey disabled
```

---

## Phase 3: Mainnet Deployment

### 3.1 Security Audit (P0 - Blocking)

**Scope:**
- VillaNicknameResolverV2 contract
- BiometricRecoverySignerV2 contract
- SDK postMessage/iframe security
- localStorage handling

**Auditors to Consider:**
- Trail of Bits
- OpenZeppelin
- Sigma Prime
- Spearbit

**Timeline:** 2-4 weeks typical

### 3.2 Groth16 Verifier (P1)

**Current State:**
- MockVerifier deployed: `0x3a4C091500159901deB27D8F5559ACD8a643A12b`
- Real verifier requires Bionetta/Rarimo integration

**Required:**
- Deploy production Groth16Verifier
- Test with real liveness proofs
- Verify on mainnet before contract deploy

### 3.3 Multisig Ownership (P0)

**Current State:**
- Single deployer owns contracts: `0x94E182DA81eCCa26D6ce6B29d99a460C11990725`

**Required:**
- Deploy Safe multisig (2/3 or 3/5)
- Transfer ownership before mainnet
- Test ownership transfer on Sepolia first

**Multisig Setup:**
```bash
# 1. Create Safe on Base mainnet
# https://app.safe.global/

# 2. Transfer ownership (2-step)
cast send $RESOLVER "transferOwnership(address)" $SAFE_ADDRESS --rpc-url base
# Then from Safe: acceptOwnership()
```

### 3.4 Mainnet Deploy Checklist

```
Pre-Deploy:
[ ] Security audit complete
[ ] Groth16Verifier deployed and tested
[ ] Multisig created
[ ] All tests passing (121 contract tests)
[ ] Testnet stable for 2+ weeks
[ ] No critical bugs in production

Deploy:
[ ] Deploy VillaNicknameResolverV2 proxy
[ ] Deploy BiometricRecoverySignerV2 proxy
[ ] Verify on Basescan
[ ] Set gateway URL to production API
[ ] Transfer ownership to multisig

Post-Deploy:
[ ] Smoke tests pass
[ ] Monitor for 24 hours
[ ] Enable mainnet in Villa app
```

---

## Solana Support (Future)

**Approach:** Maintain domain abstraction in SDK

```typescript
// Future architecture
interface VillaIdentity {
  address: string           // Works for any chain
  chain: 'base' | 'solana' // Chain identifier
  nickname: string         // Universal
  avatar: AvatarConfig     // Universal
}

// Chain-agnostic resolution
const identity = await villa.resolveNickname('alice.villa')
// Returns { address: '...', chain: 'base' } or { address: '...', chain: 'solana' }
```

**When to implement:**
- After mainnet stable
- When Solana passkey wallets mature
- Consider Squads multisig for Solana

---

## Beads Task Structure

### Ready Tasks (No Dependencies)

```yaml
tinycloud-init:
  title: "Initialize TinyCloud SDK"
  priority: P0
  agent: @build
  files:
    - apps/web/src/lib/storage/tinycloud.ts
    - apps/web/src/lib/porto.ts

ens-gateway-impl:
  title: "Implement CCIP-Read gateway"
  priority: P0
  agent: @build
  files:
    - apps/api/src/routes/ens.ts
    - apps/api/src/routes/index.ts

passkey-research:
  title: "Research Porto custom RP ID"
  priority: P1
  agent: @spec
  output: specs/decisions/ADR-002-passkey-domain.md
```

### Blocked Tasks

```yaml
mainnet-deploy:
  title: "Deploy contracts to mainnet"
  priority: P0
  blockedBy:
    - security-audit
    - groth16-verifier
    - multisig-setup
  agent: @solidity

security-audit:
  title: "External security audit"
  priority: P0
  blockedBy: []  # External dependency
  type: external
```

---

## Success Metrics

| Milestone | Criteria | Target Date |
|-----------|----------|-------------|
| Beta Stable | TinyCloud + ENS working | +1 week |
| Passkey Decision | ADR written | +2 weeks |
| Audit Complete | No critical findings | +4-6 weeks |
| Mainnet Ready | All blockers resolved | +6-8 weeks |

---

## Links

- [SDK MLP Roadmap](sdk-mlp-roadmap.md)
- [Contracts Production Readiness](../infrastructure/contracts-production-readiness.md)
- [Passkey Domain Research](../reference/passkey-domain-ownership.md)
- [Learnings](.claude/LEARNINGS.md)
