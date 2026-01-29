# Villa Contracts — Claude Code Context

Smart contracts for Villa on Base (Chain ID: 8453). Foundry project with UUPS upgradeable proxies.

## Smart Contract Security Skills

This project uses [Trail of Bits Claude Code skills](https://github.com/trailofbits/skills) for AI-assisted security analysis. Install the marketplace and relevant plugins before working on contracts.

### Setup

```bash
# Add Trail of Bits skills marketplace
/plugin marketplace add trailofbits/skills

# Install smart contract security plugins (recommended)
/plugin install trailofbits/skills/plugins/building-secure-contracts
/plugin install trailofbits/skills/plugins/entry-point-analyzer
/plugin install trailofbits/skills/plugins/fix-review
/plugin install trailofbits/skills/plugins/spec-to-code-compliance
/plugin install trailofbits/skills/plugins/property-based-testing
/plugin install trailofbits/skills/plugins/differential-review

# Optional: broader security plugins
/plugin install trailofbits/skills/plugins/sharp-edges
/plugin install trailofbits/skills/plugins/static-analysis
/plugin install trailofbits/skills/plugins/variant-analysis
```

### Which Skills Apply to Villa

| Skill | When to Use | Villa Relevance |
|-------|-------------|-----------------|
| **Token Integration Analyzer** | Reviewing ERC conformance, weird token patterns | NicknameResolver ERC-165 compliance |
| **Code Maturity Assessor** | Evaluating contract readiness across 9 categories | Pre-audit maturity scoring |
| **Audit Prep Assistant** | 1-2 weeks before formal audit | Preparing contracts for Pashov/ToB review |
| **Guidelines Advisor** | Architecture and implementation review | UUPS proxy patterns, upgrade safety |
| **Secure Workflow Guide** | End-to-end security check (5-step process) | Full security pass on new contracts |
| **Entry Point Analyzer** | Mapping attack surface | Identifying state-changing functions per access level |
| **Fix Review** | After fixing audit findings | Verifying fixes don't introduce new bugs |
| **Spec-to-Code Compliance** | Validating implementation matches spec | Checking CCIP-Read (EIP-3668) conformance |
| **Property-Based Testing** | Writing fuzz/invariant tests | Foundry fuzz and invariant test design |
| **Differential Review** | Reviewing V2 → V3 upgrade diffs | Ensuring upgrade safety, no storage collisions |

### Security Workflow (5-Step)

When modifying or reviewing contracts, follow this order:

1. **Static Analysis** — Run Slither (`slither . --config-file slither.config.json`)
2. **Feature Validation** — Check UUPS upgrade safety, ERC conformance, access control
3. **Visual Analysis** — Map inheritance hierarchy and function visibility
4. **Property Testing** — Verify invariants hold under fuzz (`forge test --fuzz-runs 1000`)
5. **Manual Review** — Check for front-running, ZK proof edge cases, replay attacks

---

## Contract Inventory

### BiometricRecoverySignerV2 (`src/BiometricRecoverySignerV2.sol`)

Porto External Signer for face-based account recovery via ZK proofs.

- **Pattern:** UUPS + Ownable2Step + Pausable
- **Critical paths:** `enrollFace()`, `isValidSignatureWithKeyHash()`, `consumeNonce()`
- **Security concerns:** ZK proof verification, nonce replay protection, ECDSA recovery
- **Deployed:** `0xdFb55a363bdF549EE5C2e77D0aAaC39068ED5836` (Base Sepolia)

### VillaNicknameResolverV3 (`src/VillaNicknameResolverV3.sol`)

CCIP-Read ENS resolver with on-chain nickname minting and role-based access.

- **Pattern:** UUPS + AccessControl + Pausable
- **Roles:** `MINTER_ROLE`, `UPGRADER_ROLE`, `PAUSER_ROLE`
- **Critical paths:** `mintNickname()`, `transferNickname()`, `resolve()`
- **Security concerns:** Case-insensitive dedup, batch minting gas, gateway trust
- **Known TODO:** `resolveWithProof()` trusts gateway response (no signature verification yet)
- **Deployed:** `0x180ddE044F1627156Cac6b2d068706508902AE9C` (Base Sepolia)

---

## Security Checklist

Before any contract change reaches `main`:

### Critical (block merge)
- [ ] No reentrancy (CEI pattern or ReentrancyGuard)
- [ ] Access control on all admin/state-changing functions
- [ ] No unprotected initializers (`initializer` modifier)
- [ ] No storage collisions in upgradeable contracts
- [ ] Storage gap maintained (50 slots)
- [ ] `_disableInitializers()` in constructor

### High
- [ ] Events emitted for all state changes
- [ ] Input validation (zero address, empty strings, bounds)
- [ ] Pausable for emergency stops
- [ ] Nonce/replay protection where applicable

### Medium
- [ ] Static analysis clean (`slither .`)
- [ ] Fuzz tests for edge cases (`forge test`)
- [ ] Format check (`forge fmt --check`)
- [ ] NatSpec complete for public/external functions

---

## Commands

```bash
# Build
forge build --sizes

# Test (with gas report)
forge test -vvv --gas-report

# Fuzz with more runs
FOUNDRY_PROFILE=ci forge test

# Format
forge fmt --check

# Static analysis
slither . --config-file slither.config.json

# Deploy (Base Sepolia)
forge script script/DeployProxyNicknameResolverV3.s.sol \
  --rpc-url base-sepolia --broadcast --verify
```

---

## Known Security Gaps

1. **Gateway trust:** `resolveWithProof()` returns gateway response without signature verification
2. **Nickname normalization:** Only handles ASCII A-Z to lowercase; no unicode normalization
3. **Batch minting:** No gas limit guard on `mintNicknameBatch()` array length

These are tracked and accepted for the current testnet deployment. Address before mainnet.

---

## Disclaimer

Trail of Bits skills provide AI-assisted security analysis. They are **not a substitute for professional audits**. All contracts must undergo manual review by qualified security researchers before mainnet deployment. See [Trail of Bits' own disclaimer](https://github.com/trailofbits/skills#disclaimer).
