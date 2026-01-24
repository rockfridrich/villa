# Development Guide

Quick reference for running and debugging Villa.

## Quick Start

### Option 1: Shell Scripts (Recommended)

```bash
# Native development (fastest)
./scripts/dev.sh

# With HTTPS for passkey testing
./scripts/dev.sh --https

# With Docker + automatic HTTPS
./scripts/dev.sh --docker
```

### Option 2: npm commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:https    # https://localhost:3000
npm run dev:clean    # Clear cache and start
```

### Option 3: Docker

```bash
docker compose up    # https://localhost (with Caddy)
```

## Commands Reference

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run dev:https` | Start with HTTPS (for passkey/WebAuthn) |
| `npm run dev:clean` | Clear cache and start fresh |
| `npm run dev:share` | Share locally via ngrok (test on mobile devices) |
| `npm run qa` | Full QA session (typecheck → share) |
| `npm run qa:end` | End QA session, show changes summary |

### Quality Checks

| Command | Description |
|---------|-------------|
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run check` | Run typecheck + lint together |
| `npm run format` | Format code with Prettier |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all Playwright E2E tests |
| `npm run test:e2e:chromium` | Run E2E tests on Chromium only (fastest) |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |
| `npm run test:e2e:ui` | Open Playwright UI for debugging |
| `npm run test:unit` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |

### Build & Deploy

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run verify` | Full verification (typecheck + build + e2e) |

### Cleanup

| Command | Description |
|---------|-------------|
| `npm run clean` | Clear .next cache |
| `npm run clean:all` | Clear all caches and build artifacts |

## Troubleshooting

### Page shows blank / no styles

```bash
# Clear cache and restart
npm run dev:clean
```

### Port 3000 already in use

```bash
# Kill existing process
pkill -f "next dev"
# Or use different port
npm run dev -- -p 3001
```

### Passkeys not working

Passkeys require HTTPS. Use:
```bash
npm run dev:https
```
Then visit https://localhost:3000

### Testing on mobile devices (iOS/Android)

Use ngrok to share your local server:
```bash
npm run dev:share
```

This will:
1. Start the dev server
2. Create a secure HTTPS tunnel
3. Display QR codes for easy mobile scanning
4. Show both local WiFi and ngrok URLs

**QR Codes:** Scan with your phone camera to open instantly.
- Local WiFi QR: Faster, same network only (no passkeys)
- ngrok QR: Any network, passkeys work

**Prerequisite for QR codes:**
```bash
brew install qrencode
```

Open the URL on your phone to test passkeys on real devices.

### ngrok troubleshooting

**Run diagnostics:**
```bash
npm run dev:debug
```

This checks:
- Dev server status and health
- ngrok process and tunnel status
- Authentication config
- Network connectivity
- Recent error logs

**Common issues:**

| Problem | Cause | Fix |
|---------|-------|-----|
| Empty/blank page | Dev server crashed | `npm run dev:clean && npm run dev:share` |
| "Tunnel not found" | ngrok session expired | Restart: `npm run dev:share` |
| "ERR_NGROK_*" | Auth token issue | `ngrok config add-authtoken YOUR_TOKEN` |
| Slow/timeout | Free tier limits | Wait or upgrade ngrok plan |
| Can't connect | Firewall/network | Try different network |

**Get an ngrok auth token (recommended):**
1. Sign up at https://dashboard.ngrok.com
2. Get token from https://dashboard.ngrok.com/get-started/your-authtoken
3. Run: `ngrok config add-authtoken YOUR_TOKEN`

**View ngrok dashboard:**
```bash
open http://127.0.0.1:4040
```
Shows request inspector, tunnel status, and errors.

**Manual restart:**
```bash
pkill ngrok && pkill -f "next dev"
npm run dev:share
```

### E2E tests failing

```bash
# Install browsers first
npx playwright install

# Run with UI for debugging
npm run test:e2e:ui
```

### TypeScript errors after pulling changes

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm run typecheck
```

## Project Structure

```
src/
├── app/              # Next.js pages
│   ├── page.tsx      # Entry (redirects to /onboarding or /home)
│   ├── onboarding/   # Passkey creation/sign-in flow
│   └── home/         # Profile screen after auth
├── components/ui/    # Reusable UI components
├── lib/              # Utilities
│   ├── porto.ts      # Porto SDK wrapper
│   ├── store.ts      # Zustand identity store
│   └── validation.ts # Zod schemas
└── providers/        # React context providers

tests/
├── e2e/              # Playwright E2E tests
└── security/         # Security-focused tests

specs/                # Feature specifications
.claude/              # Claude Code agent definitions
```

## Design System

Colors (Proof of Retreat theme):
- **Cream**: `bg-cream-50` (#fffcf8), `bg-cream-100` (#fef9f0)
- **Ink**: `text-ink` (#0d0d17), `text-ink-muted` (#61616b)
- **Accent Yellow**: `bg-accent-yellow` (#ffe047)
- **Accent Green**: `text-accent-green` (#698f69)

Typography:
- Headings: `font-serif` (DM Serif Display)
- Body: `font-sans` (Inter)

## Docker Development

### Local with HTTPS (recommended for passkey testing)

```bash
# Start with Docker + Caddy (automatic HTTPS)
docker compose up

# Or use the script
./scripts/dev.sh --docker
```

This gives you:
- https://localhost - Your app with valid HTTPS
- Automatic certificate generation via Caddy
- Hot reload (changes reflect immediately)

### Build production image

```bash
./scripts/build.sh --docker
# or
docker build -t villa:latest .
```

### Test production image locally

```bash
docker run -p 3000:3000 villa:latest
```

## Deployment

### Digital Ocean App Platform

1. **Install doctl CLI:**
   ```bash
   # macOS
   brew install doctl

   # Linux
   snap install doctl
   ```

2. **Authenticate:**
   ```bash
   doctl auth init
   ```

3. **Deploy:**
   ```bash
   # First time
   ./scripts/deploy.sh --create

   # Updates (auto-deploys on push to main)
   ./scripts/deploy.sh --update

   # Check status
   ./scripts/deploy.sh --status

   # View logs
   ./scripts/deploy.sh --logs
   ```

### Manual Docker Deployment

```bash
# Build and push to registry
docker build -t your-registry/villa:latest .
docker push your-registry/villa:latest

# On server
docker pull your-registry/villa:latest
docker run -d -p 3000:3000 --name villa your-registry/villa:latest
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `./scripts/dev.sh` | Start development (--native, --https, --docker) |
| `./scripts/ngrok-share.sh` | Share locally via ngrok for mobile testing |
| `./scripts/qa-start.sh` | Full QA session with pre-checks |
| `./scripts/qa-end.sh` | End QA session, summarize changes |
| `./scripts/build.sh` | Build for production (--native, --docker) |
| `./scripts/test.sh` | Run tests (--quick, --e2e, --all) |
| `./scripts/deploy.sh` | Deploy to Digital Ocean (--create, --update) |
