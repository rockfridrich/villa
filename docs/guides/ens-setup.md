# ENS villa.cash Setup Guide

Step-by-step guide to connect `nickname.villa.cash` ENS resolution.

## Prerequisites

- Cloudflare account with villa.cash zone
- DigitalOcean App Platform (villa API)
- Base Sepolia testnet access (for resolver deployment)
- Foundry installed (`foundryup`)

## Architecture Overview

```
User queries "alice.villa.cash"
            │
            ▼
┌─────────────────────────┐
│   ENS Universal        │
│   Resolver             │
│   (checks DNS TXT)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Cloudflare DNS       │
│   villa.cash zone      │
│   TXT: resolver addr   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   CCIP-Read Resolver   │
│   (on-chain contract)  │
│   Reverts with URL     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Villa API            │
│   /api/ens/resolve     │
│   Returns signed addr  │
└─────────────────────────┘
```

## Phase 1: Database Setup

### 1.1 Add ENS columns to profiles table

```sql
-- Migration: add_ens_support.sql
ALTER TABLE profiles
ADD COLUMN ens_name VARCHAR(100) GENERATED ALWAYS AS (nickname || '.villa.cash') STORED;

CREATE INDEX idx_profiles_ens ON profiles(ens_name);
```

Run migration:
```bash
DATABASE_URL="..." pnpm drizzle-kit generate
DATABASE_URL="..." pnpm drizzle-kit migrate
```

### 1.2 Verify in database

```bash
DATABASE_URL="..." psql -c "SELECT nickname, ens_name FROM profiles LIMIT 5;"
```

## Phase 2: API Endpoints

### 2.1 Create ENS resolution endpoint

Create `apps/web/src/app/api/ens/resolve/[name]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  // Parse name: "alice" or "alice.villa.cash"
  const nickname = params.name.replace('.villa.cash', '').toLowerCase()

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.nickname_normalized, nickname),
  })

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    address: profile.address,
    nickname: profile.nickname,
    ensName: `${profile.nickname}.villa.cash`,
  })
}
```

### 2.2 Create reverse resolution endpoint

Create `apps/web/src/app/api/ens/reverse/[address]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase()

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.address, address),
  })

  if (!profile) {
    return NextResponse.json({ name: null })
  }

  return NextResponse.json({
    name: `${profile.nickname}.villa.cash`,
    nickname: profile.nickname,
  })
}
```

### 2.3 Create CCIP-Read gateway endpoint

Create `apps/web/src/app/api/ens/gateway/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ethers } from 'ethers'

// Private key for signing responses (set in env)
const SIGNER_KEY = process.env.ENS_SIGNER_PRIVATE_KEY!

export async function POST(request: Request) {
  const { sender, data } = await request.json()

  // Decode the name from calldata
  // This is simplified - real impl needs proper ABI decoding
  const name = decodeName(data)
  const nickname = name.replace('.villa.cash', '').toLowerCase()

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.nickname_normalized, nickname),
  })

  if (!profile) {
    return NextResponse.json({ data: '0x' })
  }

  // Sign the response
  const wallet = new ethers.Wallet(SIGNER_KEY)
  const messageHash = ethers.solidityPackedKeccak256(
    ['address', 'uint64', 'bytes32'],
    [profile.address, Math.floor(Date.now() / 1000) + 300, ethers.id(name)]
  )
  const signature = await wallet.signMessage(ethers.getBytes(messageHash))

  // Encode response
  const response = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint64', 'bytes'],
    [profile.address, Math.floor(Date.now() / 1000) + 300, signature]
  )

  return NextResponse.json({ data: response })
}

function decodeName(data: string): string {
  // Decode DNS-encoded name from calldata
  // Implementation depends on resolver interface
  return 'alice.villa.cash' // Placeholder
}
```

## Phase 3: Cloudflare DNS Configuration

### 3.1 Enable DNSSEC

```bash
# Using Cloudflare API
CLOUDFLARE_API_TOKEN="..." \
CLOUDFLARE_ZONE_ID="bf3804f5e64ef25baeb078f8d986b6b9" \
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dnssec" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"status":"active"}'
```

### 3.2 Add ENS TXT Records

```bash
# Add resolver TXT record for ENS
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CLOUDFLARE_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
npx tsx src/lib/infra/cli.ts cloudflare dns add-txt _ens.villa.cash "a]0xRESOLVER_ADDRESS"
```

> **Note:** Get API credentials from 1Password or GitHub Secrets. Never commit tokens to code.

Or via Cloudflare dashboard:
1. Go to DNS → Records
2. Add TXT record:
   - Name: `_ens`
   - Content: `a]0x<RESOLVER_CONTRACT_ADDRESS>`
   - TTL: Auto

### 3.3 Verify DNS

```bash
dig TXT _ens.villa.cash +short
# Should return: "a]0x..."
```

## Phase 4: Deploy CCIP-Read Resolver

### 4.1 Create resolver contract

Create `contracts/src/VillaResolver.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IExtendedResolver} from "@ens/contracts/resolvers/profiles/IExtendedResolver.sol";

contract VillaResolver is IExtendedResolver {
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    string[] public urls;
    address public signer;

    constructor(string memory _url, address _signer) {
        urls.push(_url);
        signer = _signer;
    }

    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        override
        returns (bytes memory)
    {
        revert OffchainLookup(
            address(this),
            urls,
            abi.encodeWithSelector(this.resolveWithProof.selector, name, data),
            this.resolveWithProof.selector,
            abi.encode(name, data)
        );
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory)
    {
        // Verify signature and return address
        (address addr, uint64 expires, bytes memory sig) = abi.decode(
            response,
            (address, uint64, bytes)
        );

        require(block.timestamp < expires, "Response expired");
        // Verify signature matches signer
        // Return encoded address

        return abi.encode(addr);
    }
}
```

### 4.2 Deploy to Base Sepolia (testnet first)

```bash
# Set environment
export PRIVATE_KEY="0x..."
export RPC_URL="https://sepolia.base.org"
export ETHERSCAN_API_KEY="..."

# Deploy
cd contracts
~/.foundry/bin/forge script script/DeployVillaResolver.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

### 4.3 Note deployed address

```bash
# Save resolver address
echo "VILLA_RESOLVER_ADDRESS=0x..." >> .env.beta
```

## Phase 5: Test in Beta Environment

### 5.1 Deploy API to beta

```bash
# Push to main (triggers beta deploy)
git push origin feat/profile-settings-sdk

# Create PR
gh pr create --title "feat(sdk): ENS villa.cash integration" \
  --body "Adds ENS resolution for nickname.villa.cash"
```

### 5.2 Test API endpoints

```bash
# Test resolve
curl https://beta.villa.cash/api/ens/resolve/testuser
# Expected: {"address":"0x...","nickname":"testuser","ensName":"testuser.villa.cash"}

# Test reverse
curl https://beta.villa.cash/api/ens/reverse/0x1234567890123456789012345678901234567890
# Expected: {"name":"testuser.villa.cash","nickname":"testuser"}
```

### 5.3 Test ENS resolution (after DNS propagation)

```bash
# Using cast (foundry)
~/.foundry/bin/cast resolve-name testuser.villa.cash --rpc-url https://sepolia.base.org

# Using ethers.js
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
provider.resolveName('testuser.villa.cash').then(console.log);
"
```

### 5.4 Verify DNSSEC

```bash
# Check DNSSEC chain
dig +dnssec villa.cash

# Verify with online tool
open "https://dnssec-analyzer.verisignlabs.com/villa.cash"
```

## Phase 6: Production Deployment

### 6.1 Deploy resolver to Base mainnet

```bash
export RPC_URL="https://mainnet.base.org"
~/.foundry/bin/forge script script/DeployVillaResolver.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

### 6.2 Update DNS records

```bash
# Update TXT record with mainnet resolver
CLOUDFLARE_API_TOKEN="..." \
npx tsx src/lib/infra/cli.ts cloudflare dns upsert _ens.villa.cash \
  "a]0xMAINNET_RESOLVER_ADDRESS" --type TXT
```

### 6.3 Verify production

```bash
# Test with real nickname
curl https://villa.cash/api/ens/resolve/alice

# Test ENS resolution
~/.foundry/bin/cast resolve-name alice.villa.cash --rpc-url https://mainnet.base.org
```

## Troubleshooting

### DNS not resolving

```bash
# Check DNS propagation
dig TXT _ens.villa.cash @8.8.8.8
dig TXT _ens.villa.cash @1.1.1.1

# Force cache flush
curl -X POST "https://cloudflare-dns.com/api/v1/purge?domain=villa.cash"
```

### CCIP-Read failing

```bash
# Check resolver URL is accessible
curl -X POST https://beta.villa.cash/api/ens/gateway \
  -H "Content-Type: application/json" \
  -d '{"sender":"0x...","data":"0x..."}'
```

### Signature verification failing

- Ensure `ENS_SIGNER_PRIVATE_KEY` matches deployer
- Check timestamp is within validity window
- Verify message hash encoding matches contract

## Monitoring

### Add health check

```bash
# Cron job to verify ENS resolution
*/5 * * * * curl -s https://villa.cash/api/health/ens | jq .status
```

### Metrics to track

- Resolution latency (target: <500ms)
- Cache hit rate
- Error rate by type
- DNS query volume

## References

- [EIP-3668: CCIP-Read](https://eips.ethereum.org/EIPS/eip-3668)
- [ENS DNSSEC Integration](https://docs.ens.domains/dns-registrar/dns-integration)
- [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/)
