# Contributor Onboarding

Quick reference for onboarding new contributors to Villa.

## Quick Reference

- **Onboarding script**: `./scripts/onboard.sh`
- **Health check**: `./scripts/doctor.sh`
- **First issues**: https://github.com/rockfridrich/villa/labels/good%20first%20issue
- **Contributing guide**: `CONTRIBUTING.md`

## For Claude Code Users

Claude Code automatically loads `.claude/CLAUDE.md` for project context.

### Setup
```bash
# Copy preferences template
cp .claude/local/preferences.template.json .claude/local/preferences.json

# View effective preferences
pnpm prefs:show

# Full preferences report
pnpm prefs:report
```

### Available Agents
| Agent | Model | Use For |
|-------|-------|---------|
| @spec | opus | Architecture decisions |
| @build | sonnet | Implementation |
| @design | sonnet | UI bootstrap, critique |
| @test | haiku | Run tests |
| @review | sonnet | Code review |
| @ops | haiku | Git, GitHub, deploy |

### Workflow
1. Read spec before implementing
2. Use agents for specialized work
3. Run `pnpm verify` before every PR
4. One feature per PR

## For Traditional Contributors

Contributors not using Claude Code can follow standard Git workflow.

### Setup
```bash
# Clone
git clone https://github.com/rockfridrich/villa.git
cd villa

# Install
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local

# Build
pnpm build

# Start dev
pnpm dev
```

### Key Commands
| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm dev:https` | Start with HTTPS (passkeys) |
| `pnpm verify` | Run all checks (required) |
| `pnpm qa` | Mobile testing via ngrok |
| `pnpm test:e2e:chromium` | Run E2E tests |

### PR Process
1. Create branch: `git checkout -b feat/your-feature`
2. Make changes
3. Run `pnpm verify`
4. Push and open PR
5. Wait for review
6. Iterate based on feedback
7. Merge when approved

## Common Issues

### Build Fails
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Type Errors
```bash
# Check types in detail
pnpm typecheck

# Fix common issues
# - Check .env.local has all required vars
# - Ensure no missing dependencies
```

### Passkeys Not Working
- Passkeys require HTTPS
- Use `pnpm dev:https` for local testing
- Or use `pnpm qa` with ngrok for mobile

### Port Already in Use
```bash
pkill -f "next dev"
pnpm dev
```

## Access Levels

| Level | Permissions | How to Get |
|-------|-------------|------------|
| Anyone | Fork, PR, preview | Start contributing |
| Collaborator | Direct PR, triage | Consistent contributions |
| Maintainer | Merge, deploy beta | 10+ merged PRs |
| Owner | Production, security | Repository owner |

## Environment Variables

Essential variables for development:

```bash
# Chain (required)
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia

# Optional - full features
DATABASE_URL=postgresql://...
NGROK_AUTHTOKEN=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
```

See `.env.example` for complete documentation.

## Patterns to Follow

### Code Style
- TypeScript strict mode
- Functional React with hooks
- Zod for validation
- No `any` types

### Commit Messages
```
feat: add login button animation
fix: resolve passkey timeout issue
docs: update contributing guide
chore: update dependencies
```

### PR Checklist
- [ ] Ran `pnpm verify`
- [ ] Tested on preview deploy
- [ ] Updated relevant docs
- [ ] No console.log statements
- [ ] Security checklist completed

## Links

- [Contributing Guide](../../CONTRIBUTING.md)
- [Security Policy](../../.github/SECURITY.md)
- [Agent Definitions](../agents/)
- [Learnings](../LEARNINGS.md)
