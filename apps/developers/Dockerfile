# syntax=docker/dockerfile:1.4
# Production Dockerfile for Villa Developers Portal

FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/developers/package.json ./apps/developers/
COPY packages/config/package.json ./packages/config/

RUN bun install

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY --from=deps /app/packages ./packages/
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build developers app using turbo
RUN bun turbo run build --filter=@villa/developers

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output puts everything at root, but public stays in original location
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.beads ./.beads 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bun /node_modules/.bun 2>/dev/null || true

USER nextjs
EXPOSE 3000

# server.js is at root of standalone output
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
