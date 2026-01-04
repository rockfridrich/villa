# Base Sepolia Deployment

## Deployer Wallet

**Address:** `0x94E182DA81eCCa26D6ce6B29d99a460C11990725`

⚠️ **Private key stored in GitHub Secrets as `DEPLOYER_PRIVATE_KEY`**

## Funding

Get testnet ETH from these faucets:
- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Contracts

| Contract | Proxy Address | Implementation | Verified |
|----------|---------------|----------------|----------|
| VillaNicknameResolverV2 | TBD | TBD | ❌ |
| BiometricRecoverySignerV2 | TBD | TBD | ❌ |
| MockGroth16Verifier | TBD | N/A | ❌ |

## Deployment Commands

```bash
# From contracts/ directory

# 1. Deploy Nickname Resolver (proxy)
forge script script/DeployProxyNicknameResolver.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify

# 2. Deploy Recovery Signer (proxy)
forge script script/DeployProxyRecoverySigner.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify
```

## Verification

Contracts auto-verify via Basescan API key in GitHub Secrets.

Manual verification:
```bash
forge verify-contract <ADDRESS> VillaNicknameResolverV2 \
  --chain base-sepolia \
  --etherscan-api-key $BASESCAN_API_KEY
```
