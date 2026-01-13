# syntax=docker/dockerfile:1.4
# Production Dockerfile for @villa/key - iframe auth at key.villa.cash

# Stage 1: Dependencies with pnpm
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy package files for key app (no internal package dependencies)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/key/package.json ./apps/key/

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

# Copy source files for key app only
COPY apps/key ./apps/key/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build key app with pnpm filter
RUN --mount=type=cache,target=/app/apps/key/.next/cache \
    pnpm --filter @villa/key build

# Stage 3: Production-optimized runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy entire standalone directory to preserve pnpm symlink structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/standalone ./

# Copy static assets and public files into the correct location
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/static ./apps/key/.next/static

RUN mkdir -p ./apps/key/public

USER nextjs
EXPOSE 3002

# Server.js is inside apps/key/ in the monorepo structure
WORKDIR /app/apps/key

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

CMD ["node", "server.js"]
