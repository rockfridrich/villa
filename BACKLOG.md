# Villa Backlog

Public roadmap. Discuss in [GitHub Issues](https://github.com/rockfridrich/villa/issues). PRs welcome!

## Phase 1: Passkey Login [IN PROGRESS]

Core identity with passwordless auth via WebAuthn.

- [x] WebAuthn implementation for native passkeys
- [x] Welcome and onboarding screens
- [x] Profile setup (name, avatar)
- [x] Local storage persistence
- [x] E2E tests (Playwright) — 14 tests
- [x] Security tests — 24 tests
- [x] Unit + integration tests — 102 tests
- [x] DigitalOcean App Platform deployment
- [x] Docker build optimization (BuildKit caching)
- [x] Preview deployments for PRs
- [x] E2E tests on deployed URLs
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Custom domain (villa.proofofretreat.me)
- [ ] Porto iframe mode (requires domain registration)

## Phase 2: Recovery

Self-sovereign account recovery without corporate dependencies.

- [ ] Face recovery (Unforgettable SDK)
- [ ] Guardian setup flow
- [ ] ZK social recovery
- [ ] QR code signing (air-gapped)
- [ ] Bluetooth signing (local transfer)
- [ ] Recovery time delay + cancellation

## Phase 3: Community

Privacy-preserving community membership and coordination.

- [ ] ZK membership proofs
- [ ] Community map integration (OpenStreetMap)
- [ ] Check-in / presence functionality
- [ ] Event coordination

## Phase 4: AI Assistant

Local-first AI with optional cloud (consent required).

- [ ] Local AI (WebLLM)
- [ ] Cloud AI with explicit consent
- [ ] Community knowledge integration

---

## Ideas (Discussion Welcome)

Open for community input. Create an issue to discuss!

- **Porto SDK integration** — Web3 wallet with passkey signing (requires user understanding of blockchain concepts)
- **Villa SDK** — Let other village projects use Villa auth
- **Telegram bot** — Capture community context from chats
- **Multi-language** — i18n support
- **Desktop app** — Electron or Tauri wrapper
- **Browser extension** — Quick identity access
- **Bun package manager** — Replace npm with Bun for faster installs (~3x) and builds (~2x). Requires: Dockerfile update, CI workflow update, lock file migration

---

## Contributing

See [docs/contributing.md](docs/contributing.md) for how to help.

### Labels

| Label | Description |
|-------|-------------|
| `good-first-issue` | Great for new contributors |
| `help-wanted` | We need community help |
| `discussion` | Open for discussion |
| `security` | Security-related |
| `testing` | Testing tasks |
| `phase-1` | Phase 1 work |
| `phase-2` | Phase 2 work |
| `phase-3` | Phase 3 work |
| `phase-4` | Phase 4 work |

---

## Principles

From our [vision](specs/vision.md):

- **Users own their identity** — No corporation can revoke access
- **Privacy by default** — Data stays local unless you choose to share
- **Security over convenience** — We don't weaken protection to reduce friction
- **Open source** — All code is auditable
