# OpenCode Prompt: zkEmail + OAuth Recovery Implementation

## Quick Start

```bash
# Check available work
bd ready

# Start with contract OR database (they can run in parallel)
bd update villa-5e8 --status=in_progress  # Contract
# OR
bd update villa-ds9 --status=in_progress  # Database
```

## Context

**GitHub Issue:** https://github.com/rockfridrich/villa/issues/83
**PR (Spec):** https://github.com/rockfridrich/villa/pull/84
**Spec File:** `specs/ZKEMAIL_RECOVERY.md`

## What We're Building

Email-based account recovery for Villa ID with:
1. **OAuth (Google/Microsoft)** - 1-click email verification
2. **zkEmail** - Privacy-preserving zero-knowledge proof verification

## Beads (Implementation Order)

```
villa-xgv [EPIC] zkEmail Recovery
    │
    ├── villa-5e8 [P1] EmailRecoverySignerV1 contract ← START HERE
    │
    ├── villa-ds9 [P1] Database schema ← OR START HERE
    │       │
    │       ├── villa-a21 [P1] OAuth integration (depends on DB)
    │       │
    │       └── villa-oxm [P2] zkEmail verification (depends on DB)
    │               │
    │               └── villa-6gm [P3] SMTP relay (optional)
    │
    └── villa-81p [P2] SDK methods (depends on OAuth + zkEmail)
            │
            └── villa-kzv [P1] Recovery UI (depends on SDK)
```

## Implementation Guide

### Phase 1: Contract (villa-5e8)

```bash
bd update villa-5e8 --status=in_progress
```

**Reference:** `contracts/src/BiometricRecoverySignerV2.sol`

Create `contracts/src/EmailRecoverySignerV1.sol`:
- UUPS upgradeable pattern
- `enrollEmail(bytes32 emailHash)` - Link email to account
- `revokeEmail()` - Unlink email
- `isValidSignatureWithKeyHash()` - Porto recovery verification
- Nonce-based replay protection
- Rate limiting storage

**Tests:** `contracts/test/EmailRecoverySigner.t.sol`

```bash
cd contracts && forge test --match-contract EmailRecoverySigner
bd close villa-5e8
```

### Phase 2: Database (villa-ds9)

```bash
bd update villa-ds9 --status=in_progress
```

Create migration in `apps/hub/src/lib/db/`:

```sql
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL REFERENCES profiles(address),
    email_hash VARCHAR(66) NOT NULL UNIQUE,
    email_domain VARCHAR(255) NOT NULL,
    verification_method VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onchain_enrolled BOOLEAN DEFAULT false
);

CREATE TABLE oauth_connections (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL REFERENCES profiles(address),
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email_hash VARCHAR(66) NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

```bash
bd close villa-ds9
```

### Phase 3: OAuth (villa-a21)

```bash
bd update villa-a21 --status=in_progress
```

Create endpoints:
- `apps/hub/src/app/api/auth/oauth/google/route.ts`
- `apps/hub/src/app/api/auth/oauth/google/callback/route.ts`
- `apps/hub/src/app/api/auth/oauth/microsoft/route.ts`
- `apps/hub/src/app/api/auth/oauth/microsoft/callback/route.ts`

**Key:** Only request `email` and `profile` scopes. Store `keccak256(lowercase(email))` only.

```bash
bd close villa-a21
```

### Phase 4: zkEmail (villa-oxm)

```bash
bd update villa-oxm --status=in_progress
```

Install dependencies:
```bash
bun add @zk-email/helpers @zk-email/circuits
```

Create:
- `packages/sdk/src/email/zkemail.ts` - Client-side proof generation
- `apps/hub/src/app/api/email/verify-zk/route.ts` - Proof verification

```bash
bd close villa-oxm
```

### Phase 5: SDK (villa-81p)

```bash
bd update villa-81p --status=in_progress
```

Add to `packages/sdk/src/simple.ts`:
```typescript
linkEmail: () => Promise<EmailVerificationResult>
getEmailStatus: () => Promise<EmailVerification | null>
recoverWithEmail: () => Promise<VillaUser>
unlinkEmail: () => Promise<void>
```

Add bridge messages to `packages/sdk/src/iframe/bridge.ts`

```bash
bd close villa-81p
```

### Phase 6: UI (villa-kzv)

```bash
bd update villa-kzv --status=in_progress
```

Create pages:
- `apps/key/src/app/email/page.tsx` - Email linking
- `apps/key/src/app/recovery/page.tsx` - Account recovery

Update:
- `apps/key/src/app/auth/page.tsx` - Add "Recover with Email" link
- `apps/key/src/app/settings/page.tsx` - Email management section

**UX Requirements:**
- Mobile-first responsive
- OAuth buttons prominent (Google blue, Microsoft gray)
- "Privacy Mode" as secondary option
- Success animations
- Clear error states with retry

```bash
bd close villa-kzv
```

## Testing Checklist

- [ ] Contract: `forge test --match-contract EmailRecoverySigner`
- [ ] TypeScript: `bun verify`
- [ ] E2E: Link email → Sign out → Recover with email → Verify same address

## Key Files Reference

| Purpose | File |
|---------|------|
| Contract pattern | `contracts/src/BiometricRecoverySignerV2.sol` |
| SDK singleton | `packages/sdk/src/simple.ts` |
| Bridge | `packages/sdk/src/iframe/bridge.ts` |
| Auth page | `apps/key/src/app/auth/page.tsx` |
| Settings | `apps/key/src/app/settings/page.tsx` |
| Spec | `specs/ZKEMAIL_RECOVERY.md` |

## Security Reminders

- Never store plaintext email
- Use `keccak256(lowercase(email))` for hashing
- Encrypt OAuth tokens at rest
- Rate limit recovery attempts (3/day)
- 24h cooldown between recovery attempts

## When Done

```bash
bd sync --flush-only
git add -A && git commit -m "feat: Implement zkEmail + OAuth recovery"
```
