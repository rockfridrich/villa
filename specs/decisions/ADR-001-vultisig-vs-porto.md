# ADR-001: Multi-chain Strategy — Vultisig vs Porto

**Status:** DECISION
**Author:** Claude (AI Partner)
**Date:** 2026-01-06
**Confidence:** 90% — Stay with Porto

---

## Context

Villa is building a privacy-first identity SDK for popup city developers. The core product is passkey-based authentication with ENS-compatible nicknames, privacy-preserving community membership, and self-sovereign recovery.

The question arose: should Villa adopt [Vultisig](https://vultisig.com/) to enable multi-chain support (Bitcoin, Solana, etc.) instead of/alongside the current [Porto](https://porto.sh/) integration?

This is a pivotal architectural decision that affects:
- User experience and onboarding flow
- Developer integration complexity
- Future chain expansion capabilities
- Switching costs and timeline impact

---

## Technologies Compared

### Porto (Current)

| Aspect | Details |
|--------|---------|
| **Core Tech** | WebAuthn passkeys + EIP-7702 account abstraction |
| **Team** | Ithaca (creators of Foundry, Reth, Wagmi, Viem) |
| **Chains** | EVM-only (Ethereum, Base, all EVM L2s) |
| **Auth Model** | Passkeys synced via iCloud/Google — "remembered device" UX |
| **Integration** | SDK-first: `villa.signIn()` → identity in <3 seconds |
| **Bundle Size** | ~50KB (target: <100KB) |
| **Gas Efficiency** | 50-71% more efficient vs alternatives |
| **Open Source** | Yes (MIT license, Rust relay backend) |

**Key Strengths:**
- Native web integration (no app download required)
- Seamless cross-device sync via platform keychain
- EIP-7702: EOA upgrades to smart account in-place
- SDK-first design matches Villa's developer-focused vision
- 60% of Villa integration already complete

**References:**
- [Porto SDK Documentation](https://porto.sh/sdk)
- [Introducing Porto](https://ithaca.xyz/updates/porto)
- [EIP-7702 Overview](https://www.alchemy.com/blog/eip-7702-ethereum-pectra-hardfork)

### Vultisig (Alternative)

| Aspect | Details |
|--------|---------|
| **Core Tech** | MPC/TSS (Multi-Party Computation, Threshold Signature Scheme) |
| **Team** | THORChain founders |
| **Chains** | 30+ including Bitcoin, Ethereum, Solana, Cosmos, SUI |
| **Auth Model** | Distributed key shares across 2+ devices (seedless) |
| **Integration** | Wallet-first: users download app, scan QR, approve |
| **Security** | No single point of failure, multi-device MFA built-in |
| **Open Source** | Yes (audited) |

**Key Strengths:**
- True multi-chain from day one (BTC, SOL, etc.)
- Institutional-grade security via threshold signatures
- No seed phrase — vault shares can be stored anywhere
- "Fast Vault" (single device + server) for simplified UX
- DeFi compatible across all supported chains

**References:**
- [Vultisig Documentation](https://docs.vultisig.com/)
- [Vultisig GitHub](https://github.com/vultisig)
- [MPC vs Multi-sig Explainer](https://www.fireblocks.com/blog/mpc-vs-multi-sig)

---

## Decision Criteria Analysis

### 1. Product-Market Fit

| Criteria | Porto | Vultisig | Villa Needs |
|----------|-------|----------|-------------|
| **Target User** | App developers embedding auth | Crypto users securing assets | App developers |
| **Primary Use Case** | Embedded identity/payments | Multi-chain asset custody | Identity SDK for communities |
| **Integration Model** | SDK (10 lines of code) | App (download + vault setup) | SDK |
| **UX Philosophy** | "User never sees wallet" | "User manages vault shares" | Abstract complexity |

**Verdict: Porto aligns with Villa's SDK-for-developers mission.**

Vultisig solves a fundamentally different problem (secure asset custody) than Villa (identity SDK for community apps). Villa users shouldn't need to understand vaults, key shares, or multi-device signing.

### 2. Developer Experience

| Criteria | Porto | Vultisig |
|----------|-------|----------|
| **Time to integrate** | <10 minutes | Hours+ (app installation flow) |
| **Code complexity** | 10 lines | Custom wallet connection + callback handling |
| **User onboarding** | Click → passkey prompt → done | Download app → create vault → scan QR → approve |
| **Error states** | Browser-native passkey errors | App connectivity, vault sync, device availability |

**Verdict: Porto wins on developer experience.**

Villa's value proposition is "identity in 10 lines of code." Vultisig would require users to leave the web app, download a mobile wallet, create a vault, and return — fundamentally breaking the embedded experience.

### 3. Multi-Chain Requirement Analysis

**Does Villa actually need Bitcoin/Solana?**

Examining Villa's specs:
- Vision spec: "Ethereum-compatible chains" for ZK proof verification
- Current deployment: Base (EVM L2)
- Identity features: ENS nicknames (Ethereum-native)
- Recovery: Passkey sync + ZK social recovery (EVM contracts)
- Community proofs: On-chain membership verification (EVM)

**No current or specified future feature requires non-EVM chains.**

The popup city use case (community membership, event check-ins, credential aggregation) doesn't demand Bitcoin or Solana integration. Users aren't managing DeFi portfolios across chains — they're proving community membership and storing identity data.

### 4. Security Model Comparison

| Aspect | Porto Passkeys | Vultisig MPC |
|--------|----------------|--------------|
| **Key Generation** | Device secure enclave | Distributed across devices |
| **Key Storage** | OS keychain (iCloud/Google sync) | Device-local vault shares |
| **Backup Method** | Platform cloud sync | Export vault shares |
| **Recovery** | Passkey rediscovery | Recover from n-of-m shares |
| **Single Point of Failure** | Platform provider (Apple/Google) | None (threshold) |
| **Attack Surface** | Device compromise | Device compromise (but needs multiple) |

**Verdict: Both are strong, different tradeoffs.**

Porto relies on platform security (Apple/Google enclaves) — battle-tested but centralized backup. Vultisig's MPC is cryptographically stronger (no SPOF) but requires user device management discipline.

For Villa's target user (community member, not crypto power user), passkey convenience outweighs MPC's theoretical security benefits. Villa already plans ZK social recovery as a fallback.

### 5. Switching Cost Analysis

| Factor | Impact |
|--------|--------|
| **Porto integration complete** | ~60% done |
| **Sunk engineering cost** | 2+ sprints |
| **Architecture redesign** | Complete auth flow rewrite |
| **UX paradigm shift** | Web-native → app-dependent |
| **ENS integration** | Would need alternative naming |
| **Timeline impact** | 3-6 month delay to MLP |

**Verdict: Switching cost is severe.**

Porto integration (auth, theming, session management) is deeply embedded. Vultisig would require:
1. Rewriting all auth flows
2. Mobile app onboarding integration
3. New state management for multi-device signing
4. Alternative naming solution (no EIP-7702 = no ENS integration pattern)

---

## Recommendation

### Decision: **Stay with Porto. Do not adopt Vultisig.**

### Confidence: **90%**

### Rationale

1. **Product-market alignment**: Villa is an identity SDK, not a multi-chain wallet. Porto's SDK-first design matches Villa's developer-focused mission perfectly.

2. **User experience**: Porto's passkey flow ("click → biometric → done") is fundamentally better for community app users than Vultisig's vault management.

3. **No demonstrated need**: No current or planned feature requires non-EVM chains. Multi-chain is a solution looking for a problem in Villa's context.

4. **Switching cost prohibitive**: 60% complete integration + 3-6 month delay to rewrite.

5. **Future optionality preserved**: If multi-chain becomes critical, Villa can add Vultisig as an *alternative* auth method via wallet linking (already in spec).

### The 10% Uncertainty

- Unknown requirements from future popup city partners
- Potential ecosystem shift toward multi-chain by default
- Passkey backup reliability dependency on Apple/Google

These risks are addressable without a full architecture switch.

---

## Future-Proof Architecture

If multi-chain demand emerges, Villa can adopt a **hybrid model** without switching:

```
Phase 1 (Now): Porto-only
├── Passkey auth via Porto
├── EVM identity (Base, Ethereum)
└── ENS nicknames

Phase 2 (If needed): Wallet Linking
├── Primary: Porto passkey (unchanged)
├── Secondary: Link external wallets
│   ├── Vultisig vault connection
│   ├── MetaMask / Rainbow
│   └── Hardware wallets
└── Benefit: Multi-chain assets without changing auth

Phase 3 (Hypothetical): Multi-Protocol Identity
├── Porto for EVM-native features
├── Vultisig for multi-chain operations
└── Unified identity layer
```

**Key insight**: Villa doesn't need to *replace* Porto with Vultisig. If multi-chain becomes essential, wallet linking (already in spec at `/linked-wallets/`) can bridge both worlds.

---

## Action Items

1. **Close this decision**: Stay with Porto, continue SDK development
2. **Document for future**: If "why not multi-chain?" comes up, point here
3. **Monitor**: Track popup city partner requests for BTC/SOL features
4. **Prepare wallet linking**: Ensure `/linked-wallets/` infrastructure can accept Vultisig vaults if needed

---

## Appendix: Quick Comparison Table

| Dimension | Porto (Recommended) | Vultisig |
|-----------|---------------------|----------|
| Integration time | 10 minutes | Hours |
| User onboarding | 1 click | App download + vault setup |
| Chains supported | EVM only | 30+ |
| Security model | Passkey + platform sync | MPC/TSS |
| SDK maturity | Production (Wagmi/Viem team) | Emerging |
| Villa alignment | High (SDK-first, privacy) | Low (wallet-first, power users) |
| Switching cost | N/A | 3-6 months |

---

## Sources

- [Vultisig - Free MPC Wallet](https://vultisig.com/)
- [Vultisig Documentation](https://docs.vultisig.com/)
- [Porto SDK - Getting Started](https://porto.sh/sdk)
- [Introducing Porto - Ithaca](https://ithaca.xyz/updates/porto)
- [EIP-7702 and Pectra Upgrade - Alchemy](https://www.alchemy.com/blog/eip-7702-ethereum-pectra-hardfork)
- [MPC vs Multi-sig - Fireblocks](https://www.fireblocks.com/blog/mpc-vs-multi-sig)
- [MPC vs Multi-sig Overview - Cobo](https://www.cobo.com/post/mpc-multisig-overview)

---

*This ADR was authored by Claude as an AI partner decision. The 90% confidence reflects high alignment with product vision, with 10% reserved for unknown future requirements.*
