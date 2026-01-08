# Contributing to Villa

Welcome! Villa is a privacy-first passkey authentication provider on **Base** network. We welcome code contributions and ecosystem app integrations.

## How to Contribute Code

### 1. Fork and Branch

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/villa.git
cd villa
pnpm install

# Create a feature branch
git checkout -b feat/your-feature-name
```

### 2. Make Changes

```bash
# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start dev server
pnpm dev

# For passkey testing (requires HTTPS)
pnpm dev:https
```

### 3. Verify and Commit

```bash
# REQUIRED: Run before every push
pnpm verify  # typecheck + build + tests

# Commit with conventional format
git commit -m "feat(scope): clear description"
```

Commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### 4. Push and PR

```bash
# Push to your fork
git push origin feat/your-feature-name

# Open PR on GitHub to main branch
```

PRs automatically deploy to preview environments (dev-1/dev-2.villa.cash).

**Find work:** Check [GitHub Issues](https://github.com/rockfridrich/villa/labels/good%20first%20issue) for `good first issue` labels, or use `bd ready` if you have Beads installed.

## App Submission (Ecosystem Integration)

Villa provides authentication as a service for Base ecosystem apps. To integrate your app:

### Integration Requirements

Your app must:
- Be deployed on **Base** (8453) or **Base Sepolia** (84532)
- Implement Villa SDK for authentication
- Follow Villa security model (passkeys stay in device)
- Provide privacy policy and terms of service

### SDK Integration

Install: `npm install @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react`

See `specs/done/near-terminal-integration.md` for implementation guide.

### Submit Your App

Add your app to `apps/ecosystem/registry.json` and create a PR:

```json
{
  "id": "your-app-id",
  "name": "Your App Name",
  "description": "Brief description (max 120 chars)",
  "url": "https://your-app.com",
  "logo": "https://your-app.com/logo.png",
  "category": "defi|social|gaming|other",
  "network": "base|base-sepolia",
  "verified": false
}
```

**Include in PR:** Auth flow diagram, privacy policy URL, terms URL, support contact.

**Review:** Villa team reviews integration and security before granting `verified: true` status.

## Code Standards

### TypeScript
- **Strict mode** - No `any` types
- **Zod validation** - Validate all user input
- **Explicit types** - Type all function params and returns

### React
- **Functional components** - Use hooks, no class components
- **Clean up effects** - Return cleanup functions in `useEffect`
- **No prop drilling** - Use context for shared state

### Security
- **No passkey interception** - Passkeys stay in Porto SDK
- **Sanitize user input** - Prevent XSS attacks
- **No secrets in code** - Use environment variables
- **Validate display names** - Use Zod schemas

## PR Requirements

Before submitting:

- [ ] `pnpm verify` passes (typecheck + build + tests)
- [ ] Tests cover new/changed code
- [ ] No `console.log` or commented code
- [ ] Commit format: `type(scope): description` (types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`)
- [ ] PR description references issue/spec

## Getting Help

- **Bug reports:** [GitHub Issues](https://github.com/rockfridrich/villa/issues)
- **Feature requests:** [GitHub Discussions](https://github.com/rockfridrich/villa/discussions)
- **Security issues:** Email security@villa.cash (do not file public issues)
- **SDK integration help:** See `specs/done/near-terminal-integration.md`

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
