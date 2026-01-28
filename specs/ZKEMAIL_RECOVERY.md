# zkEmail + OAuth Recovery Specification

> Privacy-first account recovery for Villa ID

## Overview

Enable users to recover their Villa ID using email verification, with two methods:
1. **OAuth** (Google/Microsoft) - 1-click, best UX
2. **zkEmail** - Privacy-preserving zero-knowledge proof

## Problem Statement

Passkeys can be lost due to:
- Device theft or damage
- Factory reset without backup
- Switching to new device without migration

Users need a secure recovery path that doesn't compromise Villa's privacy-first principles.

## Design Principles

1. **Recovery only** - Email supplements passkey, doesn't replace it
2. **Privacy first** - Email never stored in plaintext
3. **User choice** - OAuth for convenience, zkEmail for privacy
4. **Zero infrastructure** - zkEmail requires no email service from Villa

## User Flows

### Flow 1: Link Recovery Email (Authenticated)

```
User signed in with passkey
         ↓
Click "Add Recovery Email" in Settings
         ↓
Choose method:
├─ "Continue with Google" → OAuth flow → email hash stored
├─ "Continue with Microsoft" → OAuth flow → email hash stored
└─ "Privacy Mode" → zkEmail flow → paste email → ZK proof → hash stored
         ↓
Success: "Recovery email linked!"
```

### Flow 2: Recover Account (Lost Passkey)

```
User at sign-in page, can't use passkey
         ↓
Click "Recover with Email"
         ↓
Choose method (same options as linking)
         ↓
Verify email ownership
         ↓
Match email hash to existing account
         ↓
Grant session, prompt to create new passkey
```

## Technical Architecture

### Smart Contract: EmailRecoverySignerV1

Following `BiometricRecoverySignerV2` pattern:

```solidity
contract EmailRecoverySignerV1 is
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IExternalSigner
{
    // Maps account => email hash
    mapping(address => bytes32) public enrolledEmailHashes;

    // Maps email hash => account (reverse lookup for recovery)
    mapping(bytes32 => address) public emailToAccount;

    // Replay protection
    mapping(address => uint256) public recoveryNonces;

    // Rate limiting
    mapping(address => uint256) public lastRecoveryAttempt;

    function enrollEmail(bytes32 emailHash) external;
    function revokeEmail() external;
    function isValidSignatureWithKeyHash(...) external view returns (bool);
}
```

### Database Schema

```sql
-- Email verifications
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL REFERENCES profiles(address),
    email_hash VARCHAR(66) NOT NULL UNIQUE,
    email_domain VARCHAR(255) NOT NULL,
    verification_method VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onchain_enrolled BOOLEAN DEFAULT false,
    enrollment_tx_hash VARCHAR(66)
);

-- OAuth connections (for token refresh)
CREATE TABLE oauth_connections (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL REFERENCES profiles(address),
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email_hash VARCHAR(66) NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### SDK Interface

```typescript
interface VillaInstance {
    // Existing methods...

    /** Link recovery email to account */
    linkEmail: () => Promise<EmailVerificationResult>

    /** Get linked email status */
    getEmailStatus: () => Promise<EmailVerification | null>

    /** Recover account using email */
    recoverWithEmail: () => Promise<VillaUser>

    /** Remove linked email */
    unlinkEmail: () => Promise<void>
}

interface EmailVerification {
    verified: boolean
    domain?: string
    method?: 'oauth_google' | 'oauth_microsoft' | 'zkemail'
    verifiedAt?: string
    onchainEnrolled?: boolean
}
```

### API Endpoints

```
# OAuth
GET  /api/auth/oauth/google          - Initiate Google OAuth
GET  /api/auth/oauth/google/callback - Handle callback
GET  /api/auth/oauth/microsoft       - Initiate Microsoft OAuth
GET  /api/auth/oauth/microsoft/callback

# zkEmail
POST /api/email/verify-zk            - Verify zkEmail proof

# Recovery
POST /api/email/lookup               - Check if email is linked (by hash)
POST /api/recovery/initiate          - Start recovery flow
POST /api/recovery/complete          - Complete recovery, create session

# Management
GET  /api/email/status               - Get linked email status
DELETE /api/email                    - Unlink email
```

## Privacy Model

### OAuth Path
- Villa receives only: email address from provider
- Stored: `keccak256(lowercase(email))` only
- Never stored: full email address

### zkEmail Path
- User pastes raw email (or sends to verify@villa.cash)
- Client extracts DKIM signature
- Client generates ZK proof locally (email content never leaves device)
- Villa verifies proof, stores only email hash

### On-chain (Optional)
- User can enroll email hash on-chain for trustless recovery
- Smart contract stores: `bytes32 emailHash` only
- Enables recovery without trusting Villa backend

## Security Measures

| Threat | Mitigation |
|--------|------------|
| Email enumeration | Rate limit lookups, no confirmation of existence |
| OAuth token theft | Tokens encrypted at rest, minimal scopes |
| Replay attacks | Nonce-based verification |
| Brute force recovery | 24h cooldown, max 3 attempts/day |
| Email hash rainbow | Salted hash (email + account address) |

## UI Mockups

### Email Linking Page

```
┌────────────────────────────────────┐
│  🔐 Add Recovery Email             │
│                                    │
│  Protect your Villa ID. If you     │
│  lose your passkey, recover with   │
│  your email.                       │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [G] Continue with Google    │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [M] Continue with Microsoft │ │
│  └──────────────────────────────┘ │
│                                    │
│  ─────────── or ────────────────  │
│                                    │
│  🔒 Use Privacy Mode               │
│  Verify without sharing with       │
│  Google or Microsoft               │
│                                    │
└────────────────────────────────────┘
```

### Recovery Page

```
┌────────────────────────────────────┐
│  🔑 Recover Your Villa ID          │
│                                    │
│  Lost your passkey? No problem.    │
│  Sign in with your recovery email. │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [G] Continue with Google    │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [M] Continue with Microsoft │ │
│  └──────────────────────────────┘ │
│                                    │
│  🔒 Recover with Privacy Mode      │
│                                    │
│  ← Back to sign in                 │
└────────────────────────────────────┘
```

## Implementation Phases

1. **Phase 1**: Contract + Database (can parallelize)
2. **Phase 2**: OAuth + zkEmail verification (depends on DB)
3. **Phase 3**: SDK methods (depends on Phase 2)
4. **Phase 4**: UI pages (depends on SDK)
5. **Phase 5**: SMTP relay (optional, low priority)

## Dependencies

```json
{
  "@zk-email/helpers": "^3.0.0",
  "@zk-email/circuits": "^3.0.0"
}
```

## Success Metrics

- Email linking completion rate > 60%
- Recovery success rate > 95%
- Average linking time < 15 seconds (OAuth)
- Zero plaintext email storage

## References

- [zkEmail Documentation](https://docs.zk.email/)
- [BiometricRecoverySignerV2.sol](../contracts/src/BiometricRecoverySignerV2.sol)
- [GitHub Issue #83](https://github.com/rockfridrich/villa/issues/83)

---

**Beads:** `villa-xgv` (epic), `villa-5e8`, `villa-ds9`, `villa-a21`, `villa-oxm`, `villa-81p`, `villa-kzv`, `villa-6gm`
