# Villa

Privacy-first passkey authentication. Porto SDK + Villa theming.

**Repo:** https://github.com/rockfridrich/villa

---

## Quick Reference

```bash
npm run dev          # Local dev
npm run dev:https    # Passkey testing (requires mkcert)
npm run verify       # ALWAYS run before pushing
npm run qa           # Mobile QA via ngrok
```

| Agent | Model | Use For |
|-------|-------|---------|
| @spec | opus | Architecture decisions |
| @build | sonnet | Implementation |
| @test | haiku | Run tests |
| @review | sonnet | Code review |
| @ops | haiku | Git, GitHub, deploy |

---

## Before You Code

```
1. Is there an approved spec? → No? Write spec first.
2. Run `npm run verify` before EVERY push.
3. Uncertain about approach? → ASK, don't guess.
4. One feature per PR. One commit per logical change.
```

---

## Domain Architecture

| Domain | Environment | Trigger |
|--------|-------------|---------|
| `villa.cash` | Production | Tag `v*` |
| `beta.villa.cash` | Staging | Push to `main` |
| `dev-1/2.villa.cash` | Preview | PR |

---

## Anti-Patterns (Token Burners)

- ❌ Pushing without running tests locally
- ❌ Implementing before spec is approved
- ❌ Creating new files when editing existing works
- ❌ Over-documenting process (this file should stay <200 lines)
- ❌ Multiple PRs for same feature (iterate in one PR)

---

## Project Structure

```
src/
├── app/           # Next.js pages
├── components/ui/ # UI components
├── lib/           # Utilities (porto.ts, store.ts)
└── types/         # TypeScript types

tests/
├── e2e/           # Playwright tests
└── security/      # Security tests

specs/
├── active/        # Current specs
└── reference/     # Templates, guides
```

---

## Code Standards

- **TypeScript strict** — No `any`
- **Functional React** — Hooks only
- **Validate input** — Zod schemas
- **No hardcoded URLs** — Use `BASE_URL` env var

---

## Security Rules

1. Passkeys stay in Porto — never intercept
2. Validate all user input with Zod
3. No secrets in code — use env vars
4. Sanitize display names (XSS)

---

## Language Guidelines

| Internal | User-Facing |
|----------|-------------|
| Porto account | Villa ID |
| wallet address | (hidden) |
| SDK names | Never shown |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | `npm run dev:clean` |
| Port in use | `pkill -f "next dev"` |
| Passkeys fail | Use `npm run dev:https` |
| Tests fail | Run locally first! |

---

## Links

- [Porto SDK](https://porto.sh/sdk)
- [LEARNINGS.md](LEARNINGS.md) — Patterns that saved time
- [agents/](agents/) — Agent definitions
- [knowledge/](knowledge/) — Platform-specific docs

---

## Multi-Terminal Coordination

For parallel work across terminals:
```bash
./scripts/coordinate.sh status  # Check state
./scripts/coordinate.sh reset   # Clear locks
```

See `scripts/coordinate.sh --help` for full usage.

---

*Keep this file under 200 lines. Move details to specific docs.*
