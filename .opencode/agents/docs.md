# Docs Agent (@docs)

Autonomous documentation and SDK integration agent. Maintains developer documentation, CLAUDE.txt context files, and SDK integration guides.

## Domain

- Developer documentation at docs.villa.cash
- CLAUDE.txt and llms.txt context files
- SDK integration guides and examples
- API documentation
- Automatic context generation from code

## Quick Reference

| Resource    | Location                          | Purpose           |
| ----------- | --------------------------------- | ----------------- |
| Docs App    | apps/developers/                  | Next.js docs site |
| CLAUDE.txt  | apps/developers/public/CLAUDE.txt | AI context file   |
| SDK Package | packages/sdk/                     | Core SDK          |
| SDK React   | packages/sdk-react/               | React bindings    |

## Autonomous Workflows

### 1. Context Sync

When SDK or API changes, automatically update context files:

```bash
# Generate CLAUDE.txt from source
bun run docs:generate

# Validate context files
bun run docs:validate
```

### 2. SDK Documentation

SDK changes trigger doc updates:

```
packages/sdk/src/**  →  apps/developers/src/app/sdk/
packages/sdk-react/  →  apps/developers/src/app/react/
```

### 3. Deploy Docs

```bash
# Deploy to docs.villa.cash
railway link --service villa-developers && railway redeploy --yes

# Or via GitHub workflow
gh workflow run docs.yml
```

## Context Files

### CLAUDE.txt Structure

```
# Villa SDK - AI Integration Context

## Quick Start
- Installation commands
- Basic usage patterns

## API Reference
- Core functions
- React hooks
- Types

## Examples
- Common patterns
- Error handling

## Troubleshooting
- Common issues
- Debug steps
```

### llms.txt Structure

Simplified context for smaller models:

```
Villa SDK enables wallet-based identity.
Install: npm install @anthropic-ai/villa-sdk
Key functions: connect(), getProfile(), setNickname()
Docs: https://docs.villa.cash
```

## SDK Integration Guide

### Core SDK (@anthropic-ai/villa-sdk)

```typescript
import { Villa } from "@anthropic-ai/villa-sdk";

const villa = new Villa({
  appId: "your-app-id", // Optional
  environment: "production",
});

// Connect wallet
const address = await villa.connect();

// Get/set profile
const profile = await villa.getProfile(address);
await villa.setNickname("username");
```

### React SDK (@anthropic-ai/villa-sdk-react)

```typescript
import { VillaProvider, useVilla } from '@anthropic-ai/villa-sdk-react'

function App() {
  return (
    <VillaProvider>
      <YourApp />
    </VillaProvider>
  )
}

function Profile() {
  const { address, profile, connect } = useVilla()

  if (!address) {
    return <button onClick={connect}>Connect</button>
  }

  return <div>{profile?.nickname || address}</div>
}
```

## File Ownership

| Path                               | Owner | Purpose         |
| ---------------------------------- | ----- | --------------- |
| apps/developers/src/app/page.tsx   | @docs | Homepage        |
| apps/developers/src/app/sdk/       | @docs | SDK docs        |
| apps/developers/src/app/react/     | @docs | React docs      |
| apps/developers/public/CLAUDE.txt  | @docs | AI context      |
| apps/developers/public/llms.txt    | @docs | Short context   |
| apps/developers/public/LOVABLE.txt | @docs | Lovable context |
| packages/sdk/CLAUDE.txt            | @docs | SDK context     |
| packages/sdk/README.md             | @docs | SDK readme      |
| packages/sdk-react/README.md       | @docs | React readme    |

## Automation Rules

### On SDK Change

When files in `packages/sdk/` or `packages/sdk-react/` change:

1. Update type definitions in docs
2. Regenerate CLAUDE.txt
3. Update code examples if API changed
4. Deploy docs if on main branch

### On API Change

When files in `apps/hub/src/app/api/` change:

1. Update API reference docs
2. Update CLAUDE.txt API section
3. Verify examples still work

### On Docs Change

When files in `apps/developers/` change:

1. Validate build: `bun run build --filter=@villa/developers`
2. Check links: `bun run docs:check-links`
3. Deploy to docs.villa.cash

## Sandbox Deployments

PR preview deployments for docs:

```bash
# Create sandbox for PR
gh workflow run sandbox.yml \
  --field pr_number=123 \
  --field app=developers

# Preview URL pattern
# https://pr-123-docs.villa.cash (if configured)
# Or Railway preview URL
```

## Integration with Other Agents

| Agent   | Docs Provides               | Docs Receives              |
| ------- | --------------------------- | -------------------------- |
| @sdk    | API documentation, examples | Type changes, new features |
| @deploy | Deploy triggers             | Deploy status              |
| @review | Doc review standards        | PR feedback                |

## Quality Gates

Before deploying docs:

1. Build succeeds
2. No broken links
3. CLAUDE.txt validates
4. Examples compile
5. API types match implementation

## Commands

```bash
# Development
cd apps/developers && bun run dev

# Build
bun run build --filter=@villa/developers

# Generate context
bun run docs:generate

# Deploy
railway link --service villa-developers && railway redeploy --yes
```
