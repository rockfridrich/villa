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

### Step 1: Find Work

We use **Beads** for task tracking. It lives in the repo (`.beads/`) and syncs via git.

```bash
# See what's ready to work on (no blockers)
bd ready

# Full task overview
bd list --status=open

# View task details
bd show <task-id>
```

You can also check [GitHub Issues](https://github.com/rockfridrich/villa/labels/good%20first%20issue) for `good first issue` labels.

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

### Step 3: Claim and Work

```bash
# Claim a task (marks it in-progress)
bd update <task-id> --status=in_progress

# Create a branch
git checkout -b feat/your-feature

# Make your changes...

# Mark complete when done
bd close <task-id>
```

### Step 4: Create Your PR

1. Run `pnpm verify` (required before every PR)
2. Push and open a PR
3. Beads auto-syncs via git hooks

### Step 5: Get Reviewed & Merged

- PRs automatically deploy to a preview environment (dev-1 or dev-2)
- A maintainer will review your code
- Once approved, your code ships to beta, then production!

## Task Tracking (Beads)

We use [Beads](https://github.com/steveyegge/beads) for git-native task tracking. Tasks live in `.beads/` and sync automatically.

### Quick Commands

| Command | Description |
|---------|-------------|
| `bd ready` | Show tasks with no blockers |
| `bd list --status=open` | All open tasks |
| `bd show <id>` | Task details + dependencies |
| `bd update <id> --status=in_progress` | Claim a task |
| `bd close <id>` | Mark task complete |
| `bd create --title="..." --type=task --priority=2` | Create new task |

### Task Workflow

```
bd ready          # Find available work
    ↓
bd show <id>      # Review task details
    ↓
bd update <id> --status=in_progress   # Claim it
    ↓
git checkout -b feat/...              # Create branch
    ↓
# ... do the work ...
    ↓
pnpm verify       # Verify before push
    ↓
bd close <id>     # Mark complete
    ↓
git push          # Beads syncs automatically
```

### Dependencies & Blocking

Tasks can block other tasks. Use `bd show <id>` to see what's blocking or blocked.

```bash
# Add dependency (task A depends on task B)
bd dep add <task-a> <task-b>

# View blocked tasks
bd blocked
```

### Creating Tasks from Specs

When a spec is approved, create tasks from it:

```bash
./scripts/bd-workflow.sh from-spec specs/active/feature.md
```

## Development Workflow

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local development server |
| `pnpm dev:https` | Start with HTTPS (required for passkey testing) |
| `pnpm verify` | Run all checks (lint, typecheck, build, test) |
| `pnpm qa` | Start ngrok tunnel for mobile testing |
| `pnpm test:e2e:chromium` | Run E2E tests locally |
| `bd ready` | Find available tasks |
| `bd stats` | Project health snapshot |

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

## Specs Workflow

All features start with an approved spec.

### Spec Locations

| Directory | Purpose |
|-----------|---------|
| `specs/active/` | Current sprint work |
| `specs/done/` | Shipped features |
| `specs/reference/` | Design docs, guides |
| `specs/infrastructure/` | DevOps, security |

### Spec Lifecycle

```
Draft (Claude GUI or markdown)
    ↓
Copy to specs/active/{feature}.md
    ↓
Create tasks: ./scripts/bd-workflow.sh from-spec specs/active/{feature}.md
    ↓
Implement tasks via bd workflow
    ↓
Move to specs/done/ when shipped
```

### Spec Metadata

All specs require this header:

```markdown
# Feature Name
**Status:** DRAFT | APPROVED | BUILDING | DONE
**Created:** YYYY-MM-DD
**Author:** Your Name
```

## SDK Integration (NEAR Terminal)

If you're integrating Villa SDK into your app:

```bash
npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react
```

```tsx
import { VillaAuth } from '@rockfridrich/villa-sdk-react'
import { getAvatarUrl } from '@rockfridrich/villa-sdk'

function LoginPage() {
  return (
    <VillaAuth
      appName="Your App"
      onComplete={(result) => {
        if (result.success) {
          // result.identity: { address, nickname, avatar }
          console.log('Welcome', result.identity.nickname)
        }
      }}
    />
  )
}
```

See `specs/done/near-terminal-integration.md` for full SDK documentation.

## For AI-Assisted Contributors

If you're using Claude Code or similar tools:

1. The `.claude/` directory contains project context
2. Run `pnpm prefs:show` to see AI preferences
3. Use specialized agents (cost-optimized by tier):
   - **Workers** (haiku): `@explore`, `@test`, `@ops` — fast, cheap
   - **Specialists** (sonnet): `@build`, `@design`, `@review` — implementation
   - **Architects** (opus): `@spec`, `@architect` — strategic decisions
4. Task tracking: `bd ready` to find work, `bd close <id>` when done
5. See `.claude/CLAUDE.md` for full documentation

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
