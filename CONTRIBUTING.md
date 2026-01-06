# Contributing to Villa

Welcome! Villa is a privacy-first passkey authentication system built on Base. We're excited to have you contribute.

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/rockfridrich/villa.git
cd villa
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values (see Environment Setup below)

# 3. Run dev server
pnpm dev

# 4. Verify everything works
pnpm verify
```

## Your First Contribution

### Step 1: Find an Issue

Look for issues labeled [`good first issue`](https://github.com/rockfridrich/villa/labels/good%20first%20issue) - these are curated for newcomers.

### Step 2: Set Up Your Environment

Run the interactive onboarding wizard:

```bash
./scripts/onboard.sh
```

This will:
- Check your dependencies (Node 20+, pnpm, git)
- Help you configure environment variables
- Verify your first build succeeds
- Unlock your first achievement!

### Step 3: Create Your PR

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run `pnpm verify` (required before every PR)
4. Push and open a PR

### Step 4: Get Reviewed & Merged

- PRs automatically deploy to a preview environment (dev-1 or dev-2)
- A maintainer will review your code
- Once approved, your code ships to beta, then production!

## Development Workflow

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local development server |
| `pnpm dev:https` | Start with HTTPS (required for passkey testing) |
| `pnpm verify` | Run all checks (lint, typecheck, build, test) |
| `pnpm qa` | Start ngrok tunnel for mobile testing |
| `pnpm test:e2e:chromium` | Run E2E tests locally |

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for basic development
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia testnet

# Optional - for full features
DATABASE_URL=...            # PostgreSQL connection
NGROK_AUTHTOKEN=...         # Mobile QA testing
```

See `.env.example` for full documentation.

### Testing on Mobile (ngrok)

```bash
pnpm qa  # Starts dev server + ngrok tunnel
```

Scan the QR code to test on your phone. This is essential for passkey testing since they require secure contexts.

## Access Levels

| Level | Can Do | How to Get |
|-------|--------|------------|
| **Anyone** | Fork, open PRs, preview deploys | Just start contributing! |
| **Collaborator** | Direct PRs (no fork), issue triage | Consistent quality contributions |
| **Maintainer** | Merge to main, deploy to beta | Trusted contributor (10+ merged PRs) |
| **Owner** | Production releases, security decisions | Repository owner |

### Deployment Tiers

| Environment | URL | Trigger | Gate |
|-------------|-----|---------|------|
| Preview | dev-1/dev-2.villa.cash | PR created | CI passes |
| Staging | beta.villa.cash | Merge to main | Maintainer approval |
| Production | villa.cash | Version tag (v*) | Maintainer approval |

## Code Standards

### Must-Haves

- **TypeScript strict** - No `any` without justification
- **Run `pnpm verify`** - Before every PR
- **One feature per PR** - Keep PRs focused (<400 lines ideal)
- **Meaningful commits** - Use conventional commits (feat:, fix:, docs:)

### Security Requirements

- Never commit secrets (use environment variables)
- Validate all user input with Zod
- Follow passkey security model (keys never leave device)
- See `.claude/templates/security-checklist.md`

### Language Guidelines

| Internal | User-Facing |
|----------|-------------|
| Porto account | Villa ID |
| wallet address | (hidden) |
| SDK names | Never shown |

## For AI-Assisted Contributors

If you're using Claude Code or similar tools:

1. The `.claude/` directory contains project context
2. Run `pnpm prefs:show` to see AI preferences
3. Use specialized agents: `@build`, `@test`, `@review`, `@ops`
4. See `.claude/CLAUDE.md` for full agent documentation

## Achievements

We track contributor achievements via GitHub labels! Earn badges for:

- 🏁 **Environment Ready** - Complete onboarding
- 🎯 **First PR** - Open your first pull request
- 🚀 **Code Shipped** - Get your first PR merged
- 📱 **QA Hero** - Test on physical device via ngrok
- 🐛 **Bug Squasher** - Fix 3+ bugs
- ⭐ **Feature Builder** - Ship a major feature
- 💎 **Trusted Contributor** - 10+ merged PRs

## Getting Help

- **Bug or feature?** [Open an issue](https://github.com/rockfridrich/villa/issues/new/choose)
- **Questions?** Start a [discussion](https://github.com/rockfridrich/villa/discussions)
- **Security issue?** See [SECURITY.md](.github/SECURITY.md)

## Code of Conduct

Be respectful and constructive. We're building something together.

---

*Ready to contribute? Find a [good first issue](https://github.com/rockfridrich/villa/labels/good%20first%20issue) and get started!*
