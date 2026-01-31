# Villa Hub — villa.cash
# GitHub sync: Railway auto-deploys on push to main

FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace root + all package.jsons for dependency resolution
COPY package.json bun.lock turbo.json ./
COPY apps/hub/package.json ./apps/hub/
COPY apps/key/package.json ./apps/key/
COPY apps/developers/package.json ./apps/developers/
COPY apps/api/package.json ./apps/api/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/sdk-react/package.json ./packages/sdk-react/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY contracts/package.json ./contracts/

RUN bun install

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy all source first, then node_modules on top.
# Bun workspaces use symlinks — Docker COPY dereferences them,
# so we re-run bun install to recreate workspace links with full source.
COPY . .
COPY --from=deps /app/node_modules ./node_modules/
RUN bun install

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG BUILD_TIME

ARG NEXT_PUBLIC_CHAIN_ID=84532
ARG NEXT_PUBLIC_PORTO_ENV=stg
ARG NEXT_PUBLIC_PORTO_DIALOG_HOST=https://id.porto.sh
ARG NEXT_PUBLIC_APP_URL=https://villa.cash
ARG NEXT_PUBLIC_ENV=production
ARG NEXT_PUBLIC_DOMAIN=villa.cash

ARG RAILWAY_GIT_COMMIT_SHA
ARG NEXT_PUBLIC_VERSION=0.1.0

ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID
ENV NEXT_PUBLIC_PORTO_ENV=$NEXT_PUBLIC_PORTO_ENV
ENV NEXT_PUBLIC_PORTO_DIALOG_HOST=$NEXT_PUBLIC_PORTO_DIALOG_HOST
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN

ENV NEXT_PUBLIC_GIT_SHA=$RAILWAY_GIT_COMMIT_SHA
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME

RUN bun turbo run build --filter=@villa/hub

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
