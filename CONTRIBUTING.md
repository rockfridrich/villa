# Contributing to Villa

Privacy-first identity for AI-native apps. We value contributions from developers of all backgrounds.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/rockfridrich/villa.git
cd villa
bun install

# 2. Verify setup
./scripts/doctor.sh

# 3. Start development
bun dev              # HTTP (most features)
bun dev:https        # HTTPS (passkeys require this)

# 4. Before pushing
bun verify           # typecheck + build + test
```

## Requirements

| Tool    | Version | Check                         |
| ------- | ------- | ----------------------------- |
| Node.js | 20+     | `node --version`              |
| Bun     | 1.0+    | `bun --version`               |
| Git     | Any     | `git --version`               |
| mkcert  | Any     | `mkcert -version` (for HTTPS) |

## Project Structure

```
villa/
├── apps/
│   ├── hub/          # Main app (villa.cash)
│   ├── key/          # Auth iframe (villa.cash/auth)
│   └── developers/   # Docs (docs.villa.cash)
├── packages/
│   ├── sdk/          # @rockfridrich/villa-sdk
│   ├── sdk-react/    # React bindings
│   ├── ui/           # Shared components
│   └── config/       # Shared Tailwind preset
├── contracts/        # Solidity (Base network)
└── specs/            # Feature specifications
```

## Development Commands

```bash
bun dev              # Start all apps
bun build            # Build everything
bun verify           # Full verification (required before PR)
bun test             # Unit tests
bun test:e2e         # E2E tests (requires bun dev:https)
```

## Workflow

### 1. Create Branch

```bash
git checkout -b feat/your-feature    # Features
git checkout -b fix/bug-description  # Bug fixes
```

### 2. Make Changes

- Follow existing patterns in the codebase
- Use `@villa/ui` components when available
- Use Tailwind preset: `@villa/config/tailwind.preset`

### 3. Verify

```bash
bun verify  # Must pass before pushing
```

### 4. Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add session TTL configuration
fix(hub): resolve passkey error on Safari
docs: update integration guide
```

### 5. Create PR

- Push your branch
- Open PR against `main`
- CI runs (lint, typecheck, E2E tests)
- Merge to main auto-deploys to `beta.villa.cash`

## Design System

All apps use `@villa/config/tailwind.preset`:

```typescript
// tailwind.config.ts
import preset from "@villa/config/tailwind.preset";
export default { presets: [preset] };
```

### Colors

| Token           | Use             |
| --------------- | --------------- |
| `cream-*`       | Backgrounds     |
| `ink`           | Text            |
| `accent-yellow` | Primary actions |
| `accent-green`  | Success         |

### Components

Check `packages/ui` first. Add new shared components there.

## Code Standards

- **TypeScript**: Strict mode, no `any`, use Zod for validation
- **React**: Functional components, proper focus states
- **Security**: Never log secrets, sanitize inputs

## Environments

| Env        | URL                   | Network      | Deploy Trigger  |
| ---------- | --------------------- | ------------ | --------------- |
| Production | villa.cash            | Base         | Manual `v*` tag |
| Staging    | beta.villa.cash       | Base Sepolia | Push to `main`  |
| Docs       | docs.villa.cash       | -            | Push to `main`  |

## Getting Help

- [GitHub Discussions](https://github.com/rockfridrich/villa/discussions)
- [Telegram Community](https://t.me/proofofretreat)
- Security issues: security@villa.cash

## License

MIT
