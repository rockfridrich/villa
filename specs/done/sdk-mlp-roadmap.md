# Villa SDK - MLP Roadmap

**Last Updated:** 2026-01-05
**Target:** Minimum Lovable Product for external developer adoption

---

## Sprint Status

### Sprint 1 ✅ COMPLETE (2026-01-05)

**SDK Auth Screens**
- [x] `SignInWelcome.tsx` - Entry with Sign In / Create buttons
- [x] `ConsentRequest.tsx` - Permission consent dialog
- [x] `NicknameSelection.tsx` - Real-time availability (300ms debounce)
- [x] Framer Motion animations with prefersReducedMotion
- [x] 44px touch targets

**Security**
- [x] iframe.ts origin validation
- [x] Trusted origins allowlist

**API Infrastructure**
- [x] PostgreSQL with Drizzle ORM
- [x] Connection pooling with retry/fallback
- [x] Health endpoints (/health, /health/ready)
- [x] Nickname validation routes
- [x] Docker Compose for local dev

**Contracts**
- [x] VillaNicknameResolverV2 deployed (Base Sepolia)
- [x] BiometricRecoverySignerV2 deployed (Base Sepolia)
- [x] SDK contract address exports

**Beta:** https://beta.villa.cash ✅

---

### Sprint 2 ✅ COMPLETE (2026-01-05)

**npm Packages Published**
- [x] `@rockfridrich/villa-sdk@0.1.0` - Core SDK (types, ENS, avatars, contracts)
- [x] `@rockfridrich/villa-sdk-react@0.1.0` - React components & hooks
- [x] npm Trusted Publishing configured (OIDC, no tokens needed)
- [x] Peer dependencies (viem, zod, react)

**Developer Portal**
- [x] `developers.villa.cash` - Live landing page
- [x] Quickstart guide (4 steps)
- [x] API reference (types, components)
- [x] AI integration section (CLAUDE.txt, llms.txt)
- [x] One Dark Pro syntax highlighting
- [x] Copy buttons with 44px touch targets

**SDK Package**
- [x] Villa class with appId config
- [x] `getAvatarUrl()` method
- [x] `getContracts(chainId)` helper
- [x] ENS resolution helpers
- [x] Session management (save/load/clear)

**Tests**
- [x] 96 E2E tests passing
- [x] SDK import verification tests

---

### Sprint 3 - Iframe Integration (Current)

**Iframe Container**
- [ ] Create fullscreen iframe component
- [ ] postMessage bridge for SDK ↔ iframe communication
- [ ] Message validation and origin checks
- [ ] Loading states and error handling

**Screen Integration**
- [ ] Wire SignInWelcome to Porto auth
- [ ] Wire NicknameSelection to on-chain resolver
- [ ] Wire ConsentRequest to TinyCloud permissions
- [ ] Navigation flow between screens

**Near Terminal Integration**
- [ ] Test SDK integration with Near Terminal codebase
- [ ] Provide integration example
- [ ] Support for ProfileSettings component

---

### Sprint 4 - Advanced Features (Backlog)

**App Registration**
- [ ] Wallet connection for registration
- [ ] App ID claiming with signature
- [ ] Credentials display

**Rate Limiting**
- [ ] Per-app rate limits (100/min)
- [ ] Registration limits (5 apps/wallet/day)

---

### Backlog (Post-MLP)

**User Features**
- [ ] Wallet linking (web3.bio enrichment)
- [ ] Private data collection (locale, device)
- [ ] Connected Apps management UI
- [ ] Data viewer with revocation

**SDK Enhancements**
- [ ] Custom theming support (v1.1)
- [ ] Avatar PNG rendering
- [ ] Session caching
- [ ] React Native wrapper

**Infrastructure**
- [ ] Production mainnet deployment
- [ ] TinyCloud integration
- [ ] CCIP-Read gateway for ENS
- [ ] Fraud detection signals

**Security**
- [ ] Security audit
- [ ] Wallet address salting for exports
- [ ] Multi-signature app registration

---

## Contract Addresses (Base Sepolia)

| Contract | Proxy | Implementation |
|----------|-------|----------------|
| VillaNicknameResolverV2 | `0xf4648423aC6b3f6328018c49B2102f4E9bA6D800` | `0xd959290E5E5f99D1e56765aFcd1c786E9118AAe7` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836` | `0xbff139E1db248B60B0BEAA7864Ba180597714D7F` |
| MockVerifier | `0x3a4C091500159901deB27D8F5559ACD8a643A12b` | - |

---

## Success Metrics

| Metric | Sprint 1 | Sprint 2 Target | MLP Target |
|--------|----------|-----------------|------------|
| SDK screens | 4/4 | 4/4 integrated | 4/4 |
| E2E tests | 96 pass | 100+ | 150+ |
| Beta uptime | 100% | 100% | 99.9% |
| API latency | <200ms | <100ms | <50ms |
| Bundle size | - | <50KB | <100KB |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Porto SDK | ✅ Integrated | Passkey auth |
| Drizzle ORM | ✅ Set up | PostgreSQL |
| DiceBear | ✅ Integrated | Avatar generation |
| TinyCloud | 🔲 Pending | User storage (Sprint 2) |
| web3.bio | 🔲 Pending | Wallet enrichment (Backlog) |

---

## Links

- **Spec:** [identity-sdk.md](identity-sdk.md)
- **Learnings:** [../../.claude/LEARNINGS.md](../../.claude/LEARNINGS.md)
- **Reflection:** [../../.claude/reflections/2026-01-05-mlp-sprint-1.md](../../.claude/reflections/2026-01-05-mlp-sprint-1.md)
