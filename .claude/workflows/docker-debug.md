# Docker Debugging Workflow

Quick reference for debugging Docker/Colima issues in Villa.

## Pre-flight Check

```bash
# Run before any Docker work
./scripts/preflight.sh

# Or manually:
colima status && docker info > /dev/null && echo "Ready"
```

## Common Commands

```bash
# Status
colima status
docker compose ps

# Start
colima start 2>&1 | tail -5    # Quiet start
docker compose up -d

# Logs
docker compose logs -f         # All services
docker compose logs app        # App only
docker compose logs --tail 50  # Last 50 lines

# Debug
docker compose exec app sh     # Shell into app
docker compose exec caddy sh   # Shell into Caddy

# Reset
docker compose down -v         # Stop + remove volumes
docker compose up --build      # Rebuild fresh
```

## Troubleshooting

| Problem | Command |
|---------|---------|
| Colima not running | `colima start` |
| Colima stuck | `colima delete -f && colima start` |
| Port 443 in use | `lsof -i :443 && kill <PID>` |
| Stale containers | `docker compose down && docker compose up --build` |
| Network issues | `docker network inspect villa_villa-net` |
| Check app health | `docker compose exec caddy wget -qO- http://app:3000` |

## Full Reset

```bash
docker compose down -v --remove-orphans
docker compose down --rmi all
docker system prune -a
colima delete -f && colima start
docker compose up --build
```

## E2E Tests with Docker

```bash
# Option 1: Tests against Docker app
docker compose up -d
BASE_URL=https://localhost npx playwright test

# Option 2: Native (faster)
docker compose down
npm run dev &
npm run test:e2e:chromium
```
