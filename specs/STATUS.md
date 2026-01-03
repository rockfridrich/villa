# Status

Current progress and what's next.

## Phase 1: Passkey Login [CURRENT]

Porto SDK integration for passkey authentication. Porto provides real wallet addresses, passkey management, and built-in recovery.

| Task | Status | Notes |
|------|--------|-------|
| Create `src/lib/porto.ts` | 🔲 | Porto SDK wrapper with connect/check methods |
| Update onboarding to use Porto | 🔲 | Replace native WebAuthn with Porto SDK |
| Remove `src/lib/webauthn.ts` | 🔲 | No longer needed with Porto |
| Connection detection | 🔲 | eth_accounts check on welcome screen |
| Welcome screen | 🔲 | Two CTAs based on existing account detection |
| Onboarding flow | 🔲 | Create account + sign in paths |
| Profile setup | 🔲 | Display name required |
| Local storage | ✅ | Already working with Zustand |
| E2E tests | 🔲 | Playwright for full flow |
| Security tests | 🔲 | XSS, no sensitive data leaks |
| iOS Safari testing | 🔲 | Face ID / Touch ID |
| Android Chrome testing | 🔲 | Fingerprint |
| Deploy v1 | 🔲 | After all tests pass |

**Spec:** [v1-passkey-login.md](v1-passkey-login.md)

**Key change:** Migrating from native WebAuthn (fake derived addresses) to Porto SDK (real wallet addresses as canonical user ID).

## Phase 2: Recovery [NEXT]

Self-sovereign account recovery.

- Face recovery (Unforgettable SDK)
- Guardian setup
- ZK social recovery
- QR/Bluetooth signing

## Phase 3: Community [LATER]

Privacy-preserving community features.

- ZK membership proofs
- Community map (OpenStreetMap)
- Check-in / presence

## Phase 4: AI [FUTURE]

Local-first AI assistant.

- Local AI (WebLLM)
- Cloud AI (with consent)
- Community knowledge

---

## How to Help

See [BACKLOG.md](../BACKLOG.md) for detailed tasks and labels.

**Quick links:**
- [Good first issues](https://github.com/rockfridrich/villa/labels/good-first-issue)
- [Help wanted](https://github.com/rockfridrich/villa/labels/help-wanted)
- [Contributing guide](../docs/contributing.md)
