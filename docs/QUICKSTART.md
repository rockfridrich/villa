# Villa Quick Start

Get up and running in 5 minutes.

## Prerequisites

- Node.js 20+
- Bun 1.3+
- Docker (optional, for database)

## Setup

```bash
# Clone the repo
git clone https://github.com/rockfridrich/villa.git
cd villa

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local
cp apps/hub/.env.example apps/hub/.env.local

# Start database (optional - uses SQLite fallback otherwise)
bun run db:start

# Start development server
bun run dev
```

Open http://localhost:3000

## Common Tasks

### Run the Hub (main app)

```bash
bun run dev              # Start villa.cash locally
bun run dev:https        # With HTTPS (for passkey testing)
```

### Run Developers Portal

```bash
bun run dev:developers   # Start developers.villa.cash locally
```

### Run Tests

```bash
bun run test             # Unit tests
bun run test:e2e         # E2E tests (requires Playwright)
```

### Build

```bash
bun run build            # Build all packages
bun run typecheck        # Type check
bun run lint             # Lint
```

### Database

```bash
bun run db:start         # Start PostgreSQL
bun run db:stop          # Stop PostgreSQL
bun run db:studio        # Open Drizzle Studio (DB viewer)
```

## Project Structure

```
villa/
├── apps/
│   ├── hub/           # Main app (villa.cash)
│   └── developers/    # Docs (developers.villa.cash)
├── packages/
│   ├── sdk/           # Villa SDK
│   └── sdk-react/     # React bindings
├── specs/             # Feature specs
└── docs/              # Documentation
```

## Key URLs

| Environment | URL                           |
| ----------- | ----------------------------- |
| Production  | https://villa.cash            |
| Staging     | https://beta.villa.cash       |
| Developers  | https://developers.villa.cash |
| Local       | http://localhost:3000         |

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the codebase
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for workflow guidelines
- Check [Issue #47](https://github.com/rockfridrich/villa/issues/47) for the roadmap

## Troubleshooting

### Passkeys not working locally

Passkeys require HTTPS or localhost. Use:

```bash
bun run dev:https
```

### Database connection errors

Make sure Docker is running:

```bash
bun run db:start
```

### Build errors

Try cleaning and reinstalling:

```bash
bun run clean
bun install
```
