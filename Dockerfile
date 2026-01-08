# syntax=docker/dockerfile:1.4
# Production Dockerfile for Villa Monorepo - Optimized for Turborepo

# Stage 1: Dependencies with pnpm
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy package files for all workspaces
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/ui/package.json ./packages/ui/
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

# Next.js public env vars must be set at build time (inlined into client bundle)
ARG NEXT_PUBLIC_CHAIN_ID=84532
ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID

# Build with Turborepo (builds all dependencies first)
RUN --mount=type=cache,target=/app/apps/web/.next/cache \
    pnpm --filter @villa/web build

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

# Copy entire standalone directory to preserve pnpm symlink structure
# In monorepo, standalone has: /apps/web/ with symlinks to /node_modules/.pnpm/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets and public files into the correct location
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# Server.js is inside apps/web/ in the monorepo structure
WORKDIR /app/apps/web

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
