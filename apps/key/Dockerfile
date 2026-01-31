# Villa Key — key.villa.cash
# GitHub sync: Railway auto-deploys on push to main

FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

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

RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy all source first, then node_modules on top.
# Bun workspaces use symlinks — Docker COPY dereferences them,
# so we re-run bun install to recreate workspace links with full source.
COPY . .
COPY --from=deps /app/node_modules ./node_modules/
RUN bun install --frozen-lockfile

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun turbo run build --filter=@villa/key

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/static ./.next/static

RUN mkdir -p ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
