# syntax=docker/dockerfile:1.4
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/key/package.json ./apps/key/

RUN bun install

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun turbo run build --filter=@villa/key

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bun /node_modules/.bun 2>/dev/null || true

RUN mkdir -p ./public

USER nextjs
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

CMD ["node", "server.js"]
