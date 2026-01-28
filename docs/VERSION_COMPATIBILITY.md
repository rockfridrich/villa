# Villa SDK Version Compatibility

This document tracks version compatibility between Villa SDK packages and the main monorepo.

## Current Versions

| Package                       | Current Version | Monorepo Version | Release Date |
| ----------------------------- | --------------- | ---------------- | ------------ |
| villa (monorepo)              | 0.3.0-beta.1    | -                | Current      |
| @rockfridrich/villa-sdk       | 0.3.0-beta.1    | 0.3.0-beta.1     | Current      |
| @rockfridrich/villa-sdk-react | 0.3.0-beta.1    | 0.3.0-beta.1     | Current      |

## Compatibility Matrix

### SDK Core → Hub Compatibility

| SDK Version | Min Hub Version | Max Hub Version | Status  | Notes                    |
| ----------- | --------------- | --------------- | ------- | ------------------------ |
| 2.x.x       | 0.4.0           | latest          | Future  | Breaking changes planned |
| 1.x.x       | 0.3.0           | 0.3.x           | Future  | Stable API               |
| 0.3.x-beta  | 0.3.0-beta.1    | latest          | Current | Beta testing             |
| 0.2.x       | 0.2.0           | 0.2.x           | Legacy  | Deprecated               |

### SDK React → SDK Core Compatibility

| SDK React Version | Min SDK Version | Max SDK Version | Status  |
| ----------------- | --------------- | --------------- | ------- |
| 2.x.x             | 2.0.0           | 2.x.x           | Future  |
| 1.x.x             | 1.0.0           | 1.x.x           | Future  |
| 0.3.x-beta        | 0.3.0-beta.1    | 0.3.x           | Current |
| 0.2.x             | 0.2.0           | 0.2.x           | Legacy  |

## Release Schedule

### Independent Release Cycles

- **SDK Core**: Released independently when API changes or bug fixes
- **SDK React**: Released when React-specific features added or SDK core updates require changes
- **Monorepo**: Released when Hub/Key/Docs apps have new features

### Breaking Change Policy

| Change Type          | SDK Version Bump | Monorepo Impact          |
| -------------------- | ---------------- | ------------------------ |
| New features         | Minor            | None                     |
| Bug fixes            | Patch            | None                     |
| Breaking API changes | Major            | Requires Hub updates     |
| Security fixes       | Patch            | Immediate Hub deployment |

## Migration Guides

### From 0.2.x to 0.3.x

**SDK Changes:**

- New `villa` singleton API
- Improved error handling with result types
- TypeScript strict mode support

**Required Hub Updates:**

- Update iframe bridge validation
- New postMessage format
- Enhanced security checks

### From 0.3.x to 1.0.0 (Planned)

**Breaking Changes:**

- Stable API freeze
- Remove deprecated methods
- New session format

**Timeline:** Q2 2026

## Version Commands

### Release SDK Core

```bash
# Patch release (bug fixes)
cd packages/sdk && bun run version:patch

# Minor release (new features)
cd packages/sdk && bun run version:minor

# Major release (breaking changes)
cd packages/sdk && bun run version:major

# Pre-release (alpha/beta)
cd packages/sdk && bun run version:prerelease
```

### Release SDK React

```bash
# Patch release
cd packages/sdk-react && bun run version:patch

# Minor release
cd packages/sdk-react && bun run version:minor

# Major release
cd packages/sdk-react && bun run version:major

# Pre-release
cd packages/sdk-react && bun run version:prerelease
```

### Release Both Packages

```bash
# Release both with same version bump
./scripts/sdk-release.sh all minor

# Dry run to preview changes
./scripts/sdk-release.sh all minor --dry-run
```

## Monitoring Compatibility

### Automated Checks

- **CI Pipeline**: Tests SDK against multiple Hub versions
- **E2E Tests**: Full auth flow validation
- **Version Validation**: Ensures compatibility declarations are accurate

### Manual Verification

```bash
# Test SDK compatibility
bun verify

# Test specific version compatibility
VILLA_HUB_VERSION=0.3.0 bun test

# Test with different React versions
npm test --react-version=18.0.0
npm test --react-version=19.0.0
```

## Support Policy

| Version    | Support Level       | End of Life |
| ---------- | ------------------- | ----------- |
| 0.3.x-beta | Active development  | TBD         |
| 0.2.x      | Security fixes only | 2026-06-01  |
| 0.1.x      | Unsupported         | 2026-03-01  |

## Contact

For version compatibility questions:

- Create issue: [GitHub Issues](https://github.com/rockfridrich/villa/issues)
- Documentation: [docs.villa.cash](https://docs.villa.cash)
- AI Context: [CLAUDE.txt](https://docs.villa.cash/CLAUDE.txt)
