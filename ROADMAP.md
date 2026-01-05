# Villa Roadmap & Strategic Decisions

**Last Updated:** 2026-01-06
**Session:** Multi-chain passkey research + Sprint 4 review

---

## Current State

| Domain | Status | Notes |
|--------|--------|-------|
| **beta.villa.cash** | Live | Main staging |
| **developers.villa.cash** | Live | Dev portal |
| **Database** | villa-db (1vCPU/1GB) ~$15/mo | Smallest tier, sufficient |
| **SDK** | @rockfridrich/villa-sdk@0.1.0 | Published to npm |
| **Contracts** | Base Sepolia deployed | VillaNicknameResolverV2, BiometricRecoverySignerV2 |

---

## Active Sprint: Sprint 4 (Jan 7-13)

| Priority | Task | Status |
|----------|------|--------|
| P0 | SignInWelcome screen | DONE |
| P0 | NicknameSelection screen | DONE |
| P0 | ConsentRequest screen | DONE |
| P1 | Sidebar navigation | IN PROGRESS |
| P1 | Mobile nav drawer | IN PROGRESS |
| P1 | Alert/Badge/DropdownMenu | IN PROGRESS |
| P2 | Fix flaky E2E tests | BACKLOG |

**Next:** Complete P1 items, then move to biometric testing on beta.

---

## Strategic Decisions Log

### ADR-001: Multi-chain Strategy (2026-01-06)

**Decision:** Stay with Porto (90% confidence)

**Rationale:** Villa is an identity SDK, not a multi-chain wallet. Porto's SDK-first design aligns perfectly. Vultisig solves a different problem (secure multi-chain asset custody).

**Future-proof:** If multi-chain demand emerges, wallet linking can add Vultisig/other wallets without replacing Porto.

**PR:** https://github.com/rockfridrich/villa/pull/21 (merged)

---

## Multi-Chain Passkey Research Summary

### Self-Hosted Porto Infrastructure

**Can Villa run its own passkey infrastructure on villa.cash?**

**YES, with caveats:**
- Porto supports `Mode.relay` with custom `keystoreHost`
- When self-hosted, passkeys are bound to YOUR domain (villa.cash), not id.porto.sh
- Users CANNOT reuse Porto accounts from other apps — creates Villa-specific identity
- Porto relay is open-source Rust, can be self-hosted via Docker

**Recommendation:** Phase 2 consideration. For now, use Porto's hosted infrastructure (id.porto.sh) for ecosystem compatibility.

**If self-hosting:**
```typescript
// Custom keystore on villa.cash
Porto.create({
  mode: Mode.relay({
    keystoreHost: 'https://account.villa.cash'
  })
})
```

### Solana Passkey Options

**Status:** POSSIBLE via MPC/Session Key pattern

**How it works:**
- Solana uses Ed25519 (not WebAuthn's secp256r1/P-256)
- Passkey can't directly sign Solana transactions
- Solutions use passkey as authorization primitive → unlocks Ed25519 session key
- Para SDK, Squads, Web3Auth all offer this pattern

**June 2025:** Solana added native secp256r1 precompile for on-chain passkey verification (identity proofs, not transaction signing)

**Effort:** HIGH - requires MPC infrastructure or third-party SDK (Para, Dynamic)

**Recommendation:** P3+ if Solana demand emerges from popup cities

### TON Passkey Options

**Status:** NO NATIVE SUPPORT

**Finding:** No WebAuthn/passkey integration found in TON ecosystem. TON wallets support PIN/biometric login but not passkey-based signing. Would require custom development.

**Effort:** VERY HIGH - would need to build custom contract + verification

**Recommendation:** NOT RECOMMENDED - wait for ecosystem maturity

### Bitcoin Passkey + Lightning

**Status:** POSSIBLE via Hardware Wallet or MPC

**Options:**
1. **Hardware wallets (Ledger/Trezor)** now support passkeys as FIDO2 authenticators
   - Can store passkeys AND seed phrase backup
   - User controls recovery via 24-word seed
2. **MPC wallets** like Vultisig provide seedless multi-chain including BTC
3. **Lightning** requires additional backup (channel.backup) beyond seed phrase

**Key insight:** Passkey can revoke/add signers in smart contract wallets, but Bitcoin is UTXO-based (no account abstraction). Revocation would require:
- Moving funds to new address
- Or: Using multisig with passkey as one signer

**Recommendation:** P4+ - complex architecture, limited demand

### ZCash Passkey Options

**Status:** NO NATIVE SUPPORT

**Finding:** ZCash focuses on privacy (shielded transactions), not auth innovation. Zashi wallet uses standard seed phrases. No passkey implementations found.

**Recommendation:** NOT RECOMMENDED - not aligned with Villa's use case

---

## Passkey Multi-Chain Decision Matrix

| Chain | Passkey Support | Effort | Priority | Recommendation |
|-------|-----------------|--------|----------|----------------|
| **EVM (Base/ETH)** | Native (EIP-7702) | Done | P0 | Current stack |
| **Solana** | Via MPC/Session | High | P3 | Consider if demand |
| **TON** | None | Very High | P5 | Skip |
| **Bitcoin** | Via multisig/MPC | High | P4 | Niche use case |
| **ZCash** | None | Very High | P5 | Skip |

---

## Fraud Prevention Roadmap

After biometric testing completes on beta:

### Phase 1: Basic Fraud Signals (Sprint 5)
- [ ] Device fingerprinting (FingerprintJS)
- [ ] IP reputation checking
- [ ] Rate limiting on recovery attempts (3/day)
- [ ] Anomaly logging (new device + immediate recovery = flag)

### Phase 2: Behavioral Analysis (Sprint 6+)
- [ ] Session patterns (time between actions)
- [ ] Geographic consistency checks
- [ ] Guardian notification for suspicious recovery

### Phase 3: ZK Liveness Integration
- [ ] Bionetta integration for face recovery
- [ ] On-device ZK proof generation
- [ ] On-chain liveness verification

---

## Infrastructure Optimization Status

| Service | Cost | Status | Action Needed |
|---------|------|--------|---------------|
| DigitalOcean DB | ~$15/mo | Optimal | None |
| DO App Platform | ~$5-12/mo per app | TBD | Audit after Sprint 4 |
| Cloudflare DNS | Free | Optimal | None |
| GitHub Actions | Free tier | Optimal | None |

**Recommendation:** Current costs are minimal. No immediate optimization needed.

---

## Quick Sync Checklist

Use this to onboard to a new session:

1. **What's deployed?** → beta.villa.cash (staging), developers.villa.cash (docs)
2. **Current sprint?** → Sprint 4: SDK screens (P0 done), dev portal nav (P1 in progress)
3. **Blocked on anything?** → No blockers
4. **Key decisions made?** → ADR-001: Stay with Porto (multi-chain via wallet linking later)
5. **What's next?** → Complete Sprint 4 P1, then biometric testing on beta

---

## Backlog (Prioritized)

### P0 - Critical Path
- Complete Sprint 4 P1 items
- Biometric recovery testing on beta

### P1 - Near Term
- Self-hosted Porto relay evaluation
- Fraud prevention Phase 1
- Mainnet contract deployment

### P2 - Medium Term
- Social recovery (guardians) implementation
- Solana passkey exploration (if demand)
- TinyCloud integration for cross-device sync

### P3 - Future
- Multi-chain wallet linking
- MCP server for AI integrations
- Native mobile SDKs

---

## Session Reflections

### 2026-01-06

**Accomplished:**
- Deep research on multi-chain passkey options (Solana, TON, BTC, ZCash)
- Created ADR-001 documenting Porto vs Vultisig decision
- Reviewed Sprint 4 status (P0 complete!)
- Created this ROADMAP.md for session sync

**Key Learnings:**
- Solana P-256 precompile (June 2025) enables on-chain passkey verification, but signing still needs MPC
- Porto can be self-hosted on custom domain, but creates ecosystem silo
- TON and ZCash have no passkey support - skip these

**For Tomorrow:**
- Complete Sprint 4 P1 (sidebar, mobile nav)
- Start biometric testing on beta
- Consider fraud prevention Phase 1 scope

---

*Keep this file updated at end of each significant session.*
