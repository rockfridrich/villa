# README Auto-Sync Protocol

Keeps README.md current for newcomers from website and network.

## README Structure

```markdown
# Villa

{tagline - auto from package.json description}

## What is Villa?
{value proposition - manual, rarely changes}

## Quick Start
{auto-generated from current state}

## Features
{auto from specs/active/ status}

## For Developers
{link to developers.villa.cash}

## Contributing
{link to CONTRIBUTING.md}

## Links
{auto from package.json + domains}
```

## Auto-Generated Sections

### Quick Start

Generated from:
- `package.json` scripts
- Current Node version
- pnpm version

```bash
# scripts/readme-sync.sh generates:
git clone https://github.com/rockfridrich/villa
cd villa
pnpm install
pnpm dev
```

### Current Version

From latest git tag:
```bash
git describe --tags --abbrev=0
```

### Feature Status

From `specs/active/*.md` frontmatter:
```markdown
| Feature | Status |
|---------|--------|
| Passkey Auth | ✅ Live |
| Nicknames | ✅ Live |
| Avatar Selection | ✅ Live |
| SDK | 🚧 Beta |
```

### Links

Auto-generated:
```markdown
- [App](https://villa.cash)
- [Beta](https://beta.villa.cash)
- [Developers](https://developers.villa.cash)
- [GitHub](https://github.com/rockfridrich/villa)
```

## Sync Triggers

### Automatic (CI)

```yaml
# .github/workflows/readme-sync.yml
on:
  push:
    branches: [main]
    paths:
      - 'package.json'
      - 'specs/active/**'
      - 'apps/web/package.json'
```

### Manual

```bash
./scripts/readme-sync.sh
```

## Validation

CI checks README is in sync:

```bash
./scripts/readme-sync.sh --check
# Exits 0 if in sync, 1 if needs update
```

## What NOT to Auto-Generate

Keep manual control of:
- Value proposition / tagline
- Architecture decisions
- Security considerations
- License

## Update Checklist

After major changes, verify:

- [ ] Version number is current
- [ ] Feature status reflects reality
- [ ] Quick start actually works
- [ ] Links are not broken
- [ ] No stale screenshots
