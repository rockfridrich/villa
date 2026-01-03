# Villa

Privacy-first passkey authentication for pop-up villages.

## What This Is

Villa provides native WebAuthn passkey authentication, giving village projects:
- **Passwordless auth** via Face ID, Touch ID, or fingerprint
- **Native biometric prompts** — works with iCloud Keychain, Google Password Manager, 1Password
- **Consistent identity** across village apps
- **Privacy by default** — your data stays yours, passkeys never leave your device

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Project Structure

```
villa/
├── .claude/
│   ├── CLAUDE.md          # Development guide
│   ├── agents/            # spec, build, test, review
│   └── templates/         # Spec and security templates
├── specs/
│   ├── v1-passkey-login.md   # Current work
│   ├── design-system.md      # Tailwind patterns
│   ├── vision.md             # Product vision
│   └── STATUS.md             # Phase status
├── docs/
│   ├── security.md                # Security model
│   ├── privacy.md                 # Privacy guarantees
│   ├── contributing.md            # How to contribute
│   ├── webauthn-implementation.md # WebAuthn details
│   └── integration.md             # SDK integration (coming)
├── tests/
│   ├── e2e/                  # Playwright tests
│   └── security/             # Security tests
├── BACKLOG.md                # Public roadmap
└── mocks/                    # Development mocks
```

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Passkey login | In Progress |
| 2 | Recovery (face + guardians) | Next |
| 3 | Community features | Later |
| 4 | AI assistant | Future |

See [BACKLOG.md](BACKLOG.md) for detailed tasks and how to contribute.

## Contributing

We welcome contributors — testers, developers, and designers.

1. Check [BACKLOG.md](BACKLOG.md) for what needs doing
2. Read [docs/contributing.md](docs/contributing.md) for guidelines
3. Join [Telegram](https://t.me/proofofretreat) to discuss

### Using Claude Code

```bash
claude
```

**Agents:**
- `@spec "..."` — Write feature specs
- `@build "..."` — Implement code
- `@test "..."` — Run E2E and security tests
- `@review "..."` — Code review

## Security

Every PR must pass the security checklist. No exceptions.

- Passkeys stay in device secure enclave
- No passwords stored anywhere
- Biometrics processed 100% on-device
- See [docs/security.md](docs/security.md)

## Links

- [WebAuthn Guide](https://webauthn.guide/) — Passkey standard
- [Passkeys.dev](https://passkeys.dev/) — Passkey resources
- [Unforgettable](https://docs.unforgettable.app/sdk/) — Face recovery (Phase 2)
- [Telegram](https://t.me/proofofretreat) — Community chat

## License

MIT
