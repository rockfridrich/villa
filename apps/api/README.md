# Villa API Service

Standalone API service for Villa identity and storage operations.

## Overview

The API service provides:

- Profile management endpoints
- Nickname resolution (ENS-style)
- Avatar management
- Developer API keys and rate limiting
- Health monitoring

## Architecture

Built with:

- **Hono** - Lightweight web framework
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Bun** - Runtime and package manager (development)
- **Node.js** - Production runtime (Railway deployment)

## Development

```bash
# Install dependencies
bun install

# Start local development server
bun dev

# Run with Docker PostgreSQL
bun run dev:docker

# Build for production
bun run build

# Start production build
bun start
```

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Health check
bun run health
```

## Railway Deployment

### Configuration

The service is configured for Railway deployment with:

- **Domain**: `api.villa.cash`
- **Port**: 3001 (configurable via `PORT` env var)
- **Health Check**: `/health`
- **Build**: Multi-stage Docker build with Bun → Node.js
- **Database**: Connects to shared Railway PostgreSQL instance

### Environment Variables

Required environment variables for Railway:

```bash
# Automatically provided by Railway
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
PORT=3001
NODE_ENV=production

# Optional tuning
DATABASE_SSL=require
DB_MAX_CONNECTIONS=10
LOG_LEVEL=info
```

### Health Endpoints

- `GET /health` - Basic service health and database status
- `GET /health/ready` - Readiness check for load balancer
- `GET /health/live` - Liveness check (always returns 200)
- `GET /health/details` - Detailed diagnostics

### Build Process

1. **Stage 1 (deps)**: Install dependencies with Bun
2. **Stage 2 (builder)**: Build TypeScript → JavaScript with Turbo
3. **Stage 3 (runner)**: Minimal Node.js runtime image

### Database

The service connects to the shared Railway PostgreSQL database using the `DATABASE_URL` environment variable. In production, it requires a healthy database connection to serve traffic.

Development mode includes an in-memory fallback for local testing without database setup.

## API Endpoints

| Method | Endpoint               | Description                           |
| ------ | ---------------------- | ------------------------------------- |
| GET    | `/`                    | Service information and endpoint list |
| GET    | `/health`              | Health check and service status       |
| GET    | `/nicknames/:nickname` | Resolve nickname to address           |
| POST   | `/profiles`            | Create/update user profile            |
| GET    | `/profiles/:address`   | Get profile by address                |
| GET    | `/avatars/:address`    | Get avatar by address                 |
| GET    | `/ens/resolve`         | Resolve ENS names                     |
| POST   | `/developers/apps`     | Create developer app                  |
| GET    | `/developers/apps`     | List developer apps                   |

See `docs/developers-api.md` for full API documentation.
