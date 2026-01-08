# syntax=docker/dockerfile:1.4
# Production Dockerfile for Villa Developers Portal

# Stage 1: Dependencies with pnpm
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy package files for all workspaces
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/developers/package.json ./apps/developers/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 2: Build with Turborepo
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy all installed deps from deps stage
COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY --from=deps /app/packages ./packages/
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build developers app
RUN --mount=type=cache,target=/app/apps/developers/.next/cache \
    pnpm --filter @villa/developers build

# Stage 3: Production-optimized runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/static ./apps/developers/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/public ./apps/developers/public 2>/dev/null || true

# Copy beads data for roadmap API (read-only snapshot at build time)
COPY --from=builder --chown=nextjs:nodejs /app/.beads ./.beads

USER nextjs
EXPOSE 3000

WORKDIR /app/apps/developers

# Simple healthcheck (no /api/health endpoint needed for static docs)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
