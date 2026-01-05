# ENS villa.cash Integration Spec

**Status:** Draft
**Date:** 2025-01-05

## Overview

Every Villa nickname becomes a resolvable ENS name: `nickname.villa.cash`

This enables:
- Send crypto to `alice.villa.cash` instead of `0x...`
- Universal compatibility with any ENS-aware wallet/app
- DNSSEC security for maximum trust

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  ENS Client     │────▶│  CCIP-Read       │────▶│  Villa API  │
│  (any wallet)   │     │  Resolver        │     │  Database   │
└─────────────────┘     └──────────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  villa.cash  │
                        │  DNS Zone    │
                        │  (DNSSEC)    │
                        └──────────────┘
```

## How It Works

### 1. User Claims Nickname

```tsx
// During onboarding
const result = await villaAuth.complete()
// result.identity.nickname = 'alice'
// Automatically creates: alice.villa.cash
```

### 2. Database Storage

```sql
CREATE TABLE nicknames (
  id UUID PRIMARY KEY,
  nickname VARCHAR(30) UNIQUE NOT NULL,
  nickname_normalized VARCHAR(30) NOT NULL,
  address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- ENS metadata
  ens_name VARCHAR(100) GENERATED ALWAYS AS (nickname || '.villa.cash') STORED,

  CONSTRAINT valid_nickname CHECK (nickname ~ '^[a-z0-9]{3,30}$'),
  CONSTRAINT valid_address CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_nicknames_address ON nicknames(address);
CREATE INDEX idx_nicknames_ens ON nicknames(ens_name);
```

### 3. CCIP-Read Resolver

Deploy an ENS offchain resolver that:
- Intercepts queries for `*.villa.cash`
- Calls Villa API to resolve nickname → address
- Returns signed response per CCIP-Read (EIP-3668)

```solidity
// OffchainResolver.sol
contract VillaResolver is IExtendedResolver {
    string public url = "https://api.villa.cash/ens/{sender}/{data}";

    function resolve(bytes calldata name, bytes calldata data)
        external view returns (bytes memory)
    {
        // Revert with OffchainLookup to trigger CCIP-Read
        revert OffchainLookup(
            address(this),
            urls,
            abi.encodeWithSelector(this.resolveWithProof.selector, name, data),
            this.resolveWithProof.selector,
            abi.encode(name, data)
        );
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external view returns (bytes memory)
    {
        // Verify signature from Villa API
        // Return resolved address
    }
}
```

### 4. DNS Configuration

```
; villa.cash zone file (Cloudflare)

; ENS resolver record
_ens.villa.cash.  IN TXT  "a]0x<RESOLVER_ADDRESS>"

; Wildcard for CCIP-Read
*.villa.cash.     IN TXT  "a]0x<RESOLVER_ADDRESS>"

; DNSSEC enabled
```

### 5. API Endpoints

```
GET /api/ens/resolve/:name
  → { address: '0x...', nickname: 'alice' }

GET /api/ens/reverse/:address
  → { name: 'alice.villa.cash', nickname: 'alice' }

POST /api/ens/gateway (CCIP-Read)
  Body: { sender, data }
  → { data: <signed response> }
```

## Resolution Flow

### Forward (name → address)

```tsx
// Using ethers.js
const address = await provider.resolveName('alice.villa.cash')

// Using Villa SDK
const address = await villa.resolveENS('alice.villa.cash')
const address = await villa.resolveENS('alice') // shorthand
```

### Reverse (address → name)

```tsx
// Using ethers.js
const name = await provider.lookupAddress('0x...')

// Using Villa SDK
const name = await villa.reverseENS('0x...')
// Returns: 'alice.villa.cash' or null
```

## Security

### DNSSEC

- villa.cash zone signed with DNSSEC
- Chain of trust from root → .cash → villa.cash
- Prevents DNS spoofing

### Signature Verification

```tsx
// API response includes signature
{
  address: '0x...',
  nickname: 'alice',
  timestamp: 1704499200,
  signature: '0x...' // Signed by Villa backend key
}

// Client verifies before trusting
const isValid = await verifyENSResponse(response, VILLA_SIGNER_ADDRESS)
```

### Rate Limiting

- 100 requests/minute per IP for resolution
- 10 requests/minute per IP for reverse lookup

## Implementation Phases

### Phase 1: Database & API
- [ ] Add ENS columns to nicknames table
- [ ] Create /api/ens/* endpoints
- [ ] Add reverse lookup index

### Phase 2: CCIP-Read Resolver
- [ ] Deploy VillaResolver contract
- [ ] Configure DNS TXT records
- [ ] Enable DNSSEC on villa.cash

### Phase 3: SDK Integration
- [ ] Add `villa.resolveENS()` method
- [ ] Add `villa.reverseENS()` method
- [ ] Update VillaAuth to show ENS name

## Testing

```tsx
// Unit tests
describe('ENS Resolution', () => {
  it('resolves nickname to address', async () => {
    const address = await villa.resolveENS('alice.villa.cash')
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('reverse resolves address to nickname', async () => {
    const name = await villa.reverseENS('0x...')
    expect(name).toBe('alice.villa.cash')
  })

  it('returns null for unknown names', async () => {
    const address = await villa.resolveENS('nonexistent.villa.cash')
    expect(address).toBeNull()
  })
})
```

## Cost Analysis

| Item | Cost |
|------|------|
| Cloudflare DNS | Free (included) |
| DNSSEC | Free (Cloudflare) |
| Resolver deployment | ~0.01 ETH (one-time) |
| API hosting | Included in DO |

## References

- [EIP-3668: CCIP-Read](https://eips.ethereum.org/EIPS/eip-3668)
- [ENS Offchain Resolution](https://docs.ens.domains/resolvers/ccip-read)
- [DNSSEC Overview](https://www.cloudflare.com/dns/dnssec/how-dnssec-works/)
