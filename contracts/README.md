# Villa Contracts

Villa's Solidity smart contracts for Base network, built with Foundry.

## Overview

This package contains:

- **BiometricRecoverySigner.sol** - Porto External Signer for face-based recovery
- **MockGroth16Verifier.sol** - Mock ZK verifier for testing
- **IExternalSigner.sol** - Porto External key type interface
- **IGroth16Verifier.sol** - Bionetta liveness proof verifier interface

## Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Quick Start

```bash
# Build contracts
npm run build

# Run tests
npm run test

# Test coverage
npm run test:coverage
```

## Deployment

### Local (Anvil)

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy contracts
npm run deploy:local
```

This deploys MockGroth16Verifier and BiometricRecoverySigner to local Anvil (chain ID 31337).

### Base Sepolia (Testnet)

```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY="0x..."
export GROTH16_VERIFIER_ADDRESS="0x..."  # Pre-deployed Bionetta verifier
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"

# Deploy and verify
npm run deploy:base-sepolia
```

### Base (Production)

```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY="0x..."
export GROTH16_VERIFIER_ADDRESS="0x..."  # Pre-deployed Bionetta verifier
export BASE_RPC_URL="https://mainnet.base.org"

# Deploy and verify
npm run deploy:base
```

## Deployment Addresses

Deployed contract addresses are saved in `deployments/{chainId}.json`:

```json
{
  "chainId": 8453,
  "network": "base",
  "deployer": "0x...",
  "timestamp": 1234567890,
  "contracts": {
    "Groth16Verifier": "0x...",
    "BiometricRecoverySigner": "0x..."
  }
}
```

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Anvil (local) | 31337 | http://127.0.0.1:8545 |
| Base Sepolia | 84532 | https://sepolia.base.org |
| Base | 8453 | https://mainnet.base.org |

## Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_enrollFace_success

# Gas report
forge test --gas-report
```

## Architecture

### BiometricRecoverySigner

External key type for Porto accounts that enables face-based recovery:

1. **Enrollment** - User captures face, enrolls face-derived key hash
2. **Recovery** - User proves liveness (ZK proof) + signs with face-derived key
3. **Verification** - Contract verifies both proofs, Porto executes recovery

### MockGroth16Verifier

Testing-only verifier that accepts proofs with magic prefix `0xdeadbeef`.

**DO NOT USE IN PRODUCTION**

## Security

- All contracts use Solidity 0.8.24 with overflow checks
- External dependencies: OpenZeppelin v5.0.2, forge-std
- Liveness proofs verified via Bionetta's Groth16 verifier
- Nonce-based replay protection for recovery operations

## License

MIT
