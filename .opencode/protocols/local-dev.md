# Local Development Protocol

## TL;DR

```bash
./scripts/preflight.sh   # Verify Docker ready
pnpm dev:local           # Start hybrid mode (HTTPS + passkeys)
```

---

## Why HTTPS Required

Passkeys (WebAuthn) require a secure context. HTTP will silently fail:

- Passkey creation fails silently
- "NotAllowedError" in console
- Porto dialog appears but biometric never triggers
- 1Password doesn't intercept

---

## Modes

### 1. Hybrid Mode (Recommended)

Native Next.js + Docker HTTPS proxy. Fast HMR, passkeys work.

```bash
pnpm dev:local
# Opens https://local.villa.cash (if /etc/hosts configured)
# Or https://localhost:443
```

**Prerequisites:**

- Colima running: `colima start`
- Docker available: `docker info`
- Port 443 free: `lsof -i :443`

### 2. Native Mode (No Passkeys)

Just Next.js on HTTP. Fastest startup, no passkey support.

```bash
pnpm dev
# Opens http://localhost:3000
```

Use for: API-only testing, static page development.

---

## Troubleshooting

| Problem              | Fix                                               |
| -------------------- | ------------------------------------------------- |
| Port 443 in use      | `docker-compose -f docker-compose.local.yml down` |
| Colima not running   | `colima start`                                    |
| Docker not connected | `colima status`, then `colima start`              |
| Passkeys fail        | Use `pnpm dev:local` not `pnpm dev`               |
| Blank page           | Clear cache: `rm -rf apps/web/.next && pnpm dev`  |

---

## Setup /etc/hosts (Optional)

For `local.villa.cash` domain:

```bash
sudo ./scripts/setup-hosts.sh
# Adds: 127.0.0.1 local.villa.cash
```

This makes the local dev URL match production patterns.
