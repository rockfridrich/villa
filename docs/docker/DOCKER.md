# Villa Docker Development Guide

Unified Docker setup for all development modes. Single `docker-compose.yml` with profiles for different scenarios.

## Quick Start

```bash
# Default: Just PostgreSQL (most common for local dev)
docker compose up -d

# Development mode: PostgreSQL + HTTPS proxy
pnpm docker:dev

# Run tests in Docker
pnpm docker:test

# Full stack in containers
pnpm docker:full
```

## Philosophy

Villa's Docker setup follows the **hybrid local development** pattern:

- **Host runs Next.js** - Instant HMR, no memory issues, native performance
- **Docker runs infrastructure** - PostgreSQL, HTTPS proxy, test environments
- **Tests can run either way** - Local for speed, Docker for CI parity

## Profiles

The unified `docker-compose.yml` uses profiles to activate different service combinations.

### Profile: Default (No Flag)

**Services:** `postgres` only

**Use case:** Most common local development

```bash
docker compose up -d
pnpm dev
```

Your Next.js app runs natively on your machine, connecting to Dockerized PostgreSQL.

**Database URL:** `postgresql://villa:villa_dev_password@localhost:5432/villa_dev`

---

### Profile: `dev`

**Services:** `postgres` + `caddy`

**Use case:** Local development with HTTPS (required for passkey testing)

```bash
docker compose --profile dev up -d
# or
pnpm docker:dev

# Then run Next.js natively
pnpm dev
```

Caddy provides HTTPS proxy. Access at `https://local.villa.cash` or `https://localhost`.

**Note:** Add `127.0.0.1 local.villa.cash` to `/etc/hosts` if needed.

---

### Profile: `https`

**Services:** `caddy` only

**Use case:** Just HTTPS proxy (postgres already running or using external DB)

```bash
docker compose --profile https up -d
# or
pnpm docker:https
```

Minimal setup for testing WebAuthn/passkeys without running database in Docker.

---

### Profile: `test`

**Services:** `postgres-test` + `test-unit` + `test-e2e`

**Use case:** Run full test suite in isolated Docker environment

```bash
docker compose --profile test up --abort-on-container-exit
# or
pnpm docker:test
```

Creates ephemeral test database optimized for speed (tmpfs, fsync off). Runs all tests and exits.

**Individual test runners:**

```bash
# Unit tests only
pnpm docker:test:unit

# E2E tests only
pnpm docker:test:e2e
```

---

### Profile: `full`

**Services:** `postgres` + `app` + `caddy` + `api`

**Use case:** Full containerized stack (closest to production)

```bash
docker compose --profile full up -d
# or
pnpm docker:full
```

Everything runs in containers. Useful for:
- Testing deployment configuration
- Debugging containerized builds
- Onboarding new developers (no local Node setup required)

**Note:** Slower than hybrid mode due to hot reload overhead.

---

## Environment Variables

### Default Configuration

The `.env.docker` file contains sensible defaults that work out of the box.

```bash
# Copy to .env for local overrides
cp .env.docker .env
```

### Key Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_USER` | `villa` | Development database user |
| `POSTGRES_PASSWORD` | `villa_dev_password` | Development database password |
| `POSTGRES_DB` | `villa_dev` | Development database name |
| `DATABASE_URL` | `postgresql://villa:villa_dev_password@postgres:5432/villa_dev` | Database connection string |
| `CADDYFILE` | `./Caddyfile.local` | Which Caddyfile to use |
| `APP_PORT` | `3000` | Next.js port |
| `API_PORT` | `3001` | API service port |
| `CI` | `false` | Enable CI mode (parallel tests, retries) |

### Hybrid vs Full Docker Mode

**Hybrid Mode (Recommended):**

```bash
# .env
CADDYFILE=./Caddyfile.local
DATABASE_URL=postgresql://villa:villa_dev_password@localhost:5432/villa_dev
```

Caddy uses `host.docker.internal` to reach your native Next.js.

**Full Docker Mode:**

```bash
# .env
CADDYFILE=./Caddyfile.dev
DATABASE_URL=postgresql://villa:villa_dev_password@postgres:5432/villa_dev
```

Next.js runs inside Docker container.

---

## Common Workflows

### 1. Standard Local Development

```bash
# Start database
docker compose up -d

# Run app natively
pnpm dev

# View logs
docker compose logs -f postgres

# Stop when done
docker compose down
```

---

### 2. Passkey/WebAuthn Development

Requires HTTPS (secure context).

```bash
# Start postgres + HTTPS proxy
pnpm docker:dev

# Add to /etc/hosts if not already
echo "127.0.0.1 local.villa.cash" | sudo tee -a /etc/hosts

# Run app natively
pnpm dev

# Access via HTTPS
open https://local.villa.cash
```

---

### 3. Running Tests Locally

**Option A: Native (faster)**

```bash
# Start test database
docker compose up -d postgres-test

# Run tests natively
pnpm test:e2e:chromium
```

**Option B: Fully containerized (CI parity)**

```bash
# Run all tests in Docker
pnpm docker:test

# Or specific test suite
pnpm docker:test:unit
pnpm docker:test:e2e
```

---

### 4. Full Containerized Development

Closest to production environment.

```bash
# Start everything
pnpm docker:full

# Access app
open https://localhost

# View logs
pnpm docker:logs

# Stop everything
pnpm docker:down
```

---

### 5. Database Management

```bash
# Start database only
docker compose up -d postgres

# Reset database (destroys data!)
pnpm db:reset

# View database logs
pnpm db:logs

# Connect to database
docker compose exec postgres psql -U villa -d villa_dev

# Backup database
docker compose exec postgres pg_dump -U villa villa_dev > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U villa villa_dev
```

---

## Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `pnpm docker:dev` | Start postgres + caddy (hybrid mode) |
| `pnpm docker:https` | Start HTTPS proxy only |
| `pnpm docker:full` | Start all services in containers |
| `pnpm dev:docker` | Start docker services + native Next.js |

### Testing

| Script | Description |
|--------|-------------|
| `pnpm docker:test` | Run all tests in Docker (unit + e2e) |
| `pnpm docker:test:unit` | Run unit tests only |
| `pnpm docker:test:e2e` | Run E2E tests only |

### Management

| Script | Description |
|--------|-------------|
| `pnpm docker:down` | Stop all services |
| `pnpm docker:clean` | Stop services and remove volumes |
| `pnpm docker:logs` | Follow logs from all services |
| `pnpm docker:ps` | List running containers |

### Database

| Script | Description |
|--------|-------------|
| `pnpm db:start` | Start postgres |
| `pnpm db:stop` | Stop postgres |
| `pnpm db:reset` | Reset database (deletes data!) |
| `pnpm db:logs` | View database logs |

---

## Troubleshooting

### Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Solution:**

```bash
# Find process using port 5432
lsof -i :5432

# Kill it
kill -9 <PID>

# Or stop all Docker containers
docker compose down
```

---

### Caddy Health Check Failing

**Symptom:** `villa-caddy unhealthy`

**Solution:**

```bash
# Check if Caddyfile exists
ls -la Caddyfile.local

# View Caddy logs
docker compose logs caddy

# Restart Caddy
docker compose restart caddy

# Test health endpoint directly
curl -k https://localhost/caddy-health
```

---

### Database Connection Refused

**Symptom:** `connection refused` or `ECONNREFUSED`

**Check database is running:**

```bash
docker compose ps postgres

# Should show "healthy"
```

**Check DATABASE_URL:**

```bash
# For native Next.js
echo $DATABASE_URL
# Should be: postgresql://villa:villa_dev_password@localhost:5432/villa_dev

# For Docker Next.js
# Should be: postgresql://villa:villa_dev_password@postgres:5432/villa_dev
```

**Test connection:**

```bash
docker compose exec postgres psql -U villa -d villa_dev -c "SELECT version();"
```

---

### Tests Failing in Docker

**Symptom:** Tests pass locally but fail in Docker

**Common causes:**

1. **Timing issues** - Docker networking adds latency
   - Increase timeouts in `playwright.config.ts`
   - Add `waitForLoadState('networkidle')`

2. **Database not ready** - Health check passed but migrations pending
   - Add migration step to test runner
   - Increase `start_period` in health check

3. **Memory limits** - Playwright + Next.js can use 4GB+
   - Increase Docker memory allocation (Docker Desktop → Settings → Resources)
   - Reduce parallel workers: `PLAYWRIGHT_WORKERS=1`

**Debug steps:**

```bash
# View test logs
docker compose logs test-e2e

# Run tests with verbose output
docker compose run --rm test-e2e pnpm test:e2e:chromium --debug

# Interactive debugging
docker compose run --rm test-e2e sh
# Inside container:
pnpm test:e2e:chromium --headed
```

---

### Hot Reload Not Working

**Symptom:** Changes to code don't trigger rebuild

**For hybrid mode (Next.js native):**

Should work automatically. If not:

```bash
# Kill Next.js
pkill -f "next dev"

# Clear cache
rm -rf apps/web/.next

# Restart
pnpm dev
```

**For full Docker mode:**

Enable polling in `.env`:

```bash
WATCHPACK_POLLING=true
```

Restart containers:

```bash
docker compose --profile full down
docker compose --profile full up -d
```

---

### Out of Memory (OOM)

**Symptom:** Container crashes or becomes unresponsive

**Solutions:**

1. **Increase Docker memory** (Docker Desktop → Settings → Resources)
   - Minimum: 4GB
   - Recommended: 6-8GB

2. **Reduce memory limit per service** (in `.env`):

   ```bash
   APP_MEM_LIMIT=4g
   ```

3. **Use hybrid mode** instead of full Docker:

   ```bash
   pnpm docker:dev  # Instead of docker:full
   pnpm dev         # Run Next.js natively
   ```

---

### Clean Slate Reset

Nuclear option when nothing works:

```bash
# Stop everything
docker compose down -v

# Remove all Villa containers and volumes
docker system prune -f
docker volume prune -f

# Remove node_modules and build artifacts
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/*/.next

# Reinstall
pnpm install

# Start fresh
docker compose up -d
pnpm dev
```

---

## Performance Tips

### 1. Use tmpfs for Test Database

Already configured in `postgres-test` service:

```yaml
tmpfs:
  - /var/lib/postgresql/data:size=1G
```

Test data lives in RAM. 10x faster than disk.

### 2. Optimize PostgreSQL Settings

For local dev, prioritize speed over durability:

```bash
# In .env
POSTGRES_SHARED_BUFFERS=512MB
POSTGRES_MAX_CONNECTIONS=200
```

### 3. Parallel Test Execution

```bash
# In .env
PLAYWRIGHT_WORKERS=4  # Adjust based on CPU cores
```

### 4. BuildKit Caching

Enable Docker BuildKit for faster builds:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker compose build --pull
```

### 5. Volume Mounts vs Bind Mounts

Current setup uses bind mounts for hot reload. For production builds, use volumes:

```yaml
volumes:
  - node_modules:/app/node_modules  # Volume (faster)
  - ./src:/app/src  # Bind mount (hot reload)
```

---

## CI/CD Integration

The Docker setup is designed to work in CI environments.

### GitHub Actions Example

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests in Docker
        env:
          CI: true
        run: pnpm docker:test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

### Key CI Variables

```bash
CI=true                    # Enable CI mode
BASE_URL=http://app:3000   # Use container networking
PLAYWRIGHT_WORKERS=2       # Limit parallelization
```

---

## Architecture Decisions

### Why Profiles?

Single `docker-compose.yml` reduces maintenance burden:
- No duplicate service definitions
- Easy to understand what's running
- Clear separation of concerns

### Why Hybrid Mode?

Best developer experience:
- Instant HMR (no Docker overhead)
- Native debugging (Chrome DevTools, VS Code)
- No memory issues (Next.js can use full RAM)

Infrastructure in Docker ensures consistency.

### Why Multiple PostgreSQL Services?

Separation of concerns:
- `postgres` - Persistent development data
- `postgres-test` - Ephemeral, optimized for speed, isolated from dev

Test database uses tmpfs and disabled fsync for 10x faster tests.

### Why Caddy?

Automatic HTTPS with zero configuration:
- Self-signed certs for local dev
- Let's Encrypt certs for production
- Reverse proxy handles security headers

WebAuthn/passkeys require HTTPS. Caddy makes it seamless.

---

## Related Documentation

- [.claude/CLAUDE.md](.claude/CLAUDE.md) - Villa development guide
- [.env.example](.env.example) - All environment variables
- [LEARNINGS.md](.claude/LEARNINGS.md) - Patterns and gotchas
- [Dockerfile.dev](Dockerfile.dev) - Development container definition
- [Caddyfile.local](Caddyfile.local) - HTTPS proxy config

---

## FAQ

**Q: Should I use `docker-compose` or `docker compose`?**

A: Use `docker compose` (no hyphen). It's the newer V2 CLI. V1 is deprecated.

**Q: Can I run multiple profiles at once?**

A: Yes! Profiles are additive:

```bash
docker compose --profile dev --profile api up -d
```

**Q: How do I debug inside a container?**

A:

```bash
# Get a shell
docker compose exec app sh

# Or start a one-off container
docker compose run --rm app sh
```

**Q: Where are database volumes stored?**

A:

```bash
docker volume ls
# villa-postgres-data
# villa-postgres-test-data

# Inspect
docker volume inspect villa-postgres-data
```

**Q: Can I connect to the database from a GUI?**

A: Yes! Use these settings:

- Host: `localhost`
- Port: `5432`
- User: `villa`
- Password: `villa_dev_password`
- Database: `villa_dev`

Tools: [Postico](https://eggerapps.at/postico/), [TablePlus](https://tableplus.com/), [DBeaver](https://dbeaver.io/)

**Q: How do I update the Docker images?**

A:

```bash
docker compose pull       # Pull latest base images
docker compose build      # Rebuild custom images
docker compose up -d      # Restart with new images
```

---

## Migrating from Old Setup

If you have existing docker-compose files:

### Old Files (Deprecated)

- `docker-compose.dev.yml` - Full Docker mode
- `docker-compose.local.yml` - Hybrid HTTPS mode

### Migration Steps

1. **Stop old containers:**

   ```bash
   docker compose -f docker-compose.local.yml down
   docker compose -f docker-compose.dev.yml down
   ```

2. **Use unified setup:**

   ```bash
   # Hybrid mode (replaces docker-compose.local.yml)
   docker compose --profile dev up -d

   # Full mode (replaces docker-compose.dev.yml)
   docker compose --profile full up -d
   ```

3. **Update scripts:**

   Old:
   ```bash
   pnpm dev:docker  # Used docker-compose.local.yml
   ```

   New:
   ```bash
   pnpm docker:dev  # Uses unified docker-compose.yml
   ```

4. **Database data is preserved** - Volumes use the same names.

---

## Contributing

When adding new services:

1. **Add to appropriate profile** - Don't pollute default
2. **Add health checks** - Ensure dependencies start correctly
3. **Document in DOCKER.md** - Update this file
4. **Add npm script** - Make it easy to use
5. **Test in CI** - Ensure it works in GitHub Actions

---

Made with care by the Villa team. Questions? Open an issue.
