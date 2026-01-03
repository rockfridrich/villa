# Status

Current progress and what's next.

## Phase 1: Passkey Login [IN PROGRESS]

Porto SDK integration for passkey authentication with Villa theming.

| Task | Status | Notes |
|------|--------|-------|
| Create `src/lib/porto.ts` | ✅ | Porto SDK wrapper with Villa theme |
| Villa theme for Porto | ✅ | 30+ color tokens mapped |
| Separate create/sign-in flows | ✅ | `createAccount()` and `signIn()` |
| Update onboarding to use Porto | ✅ | Direct Porto dialog, no explainer |
| Remove `src/lib/webauthn.ts` | ✅ | Deleted, using Porto SDK |
| Connection detection | ✅ | eth_accounts check on mount |
| Welcome screen | ✅ | Two CTAs based on account detection |
| Onboarding flow | ✅ | Create + sign in paths |
| Profile setup | ✅ | Display name with Zod validation |
| Home screen | ✅ | Profile display with logout |
| Local storage | ✅ | Zustand with persist |
| TypeScript strict | ✅ | No errors |
| E2E tests | 🔲 | Scaffold exists, needs Porto mocks |
| Security tests | 🔲 | XSS tests written, need run |
| iOS Safari testing | 🔲 | Manual testing needed |
| Android Chrome testing | 🔲 | Manual testing needed |
| Deploy v1 | 🔲 | After all tests pass |

**Spec:** [v1-passkey-login.md](v1-passkey-login.md)

**Branch:** `feature/porto-passkey-login` ([PR #1](https://github.com/rockfridrich/villa/pull/1))

### Implementation Notes

Porto SDK provides:
- Real Ethereum wallet addresses (not hash-derived)
- Passkey management, cross-device sync
- Built-in recovery (social, email, OAuth)
- Theming via ThemeFragment (60+ tokens)

Villa controls:
- Welcome screen, profile setup, home screen
- Error messages and retry flows
- Theme colors applied to Porto dialogs

Porto controls (security-critical):
- Passkey creation/authentication prompts
- Transaction signing UI
- Key management

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

See [BACKLOG.md](../BACKLOG.md) for detailed tasks.

**Quick links:**
- [Good first issues](https://github.com/rockfridrich/villa/labels/good-first-issue)
- [Help wanted](https://github.com/rockfridrich/villa/labels/help-wanted)
- [Contributing guide](../docs/contributing.md)
