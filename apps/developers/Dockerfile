# syntax=docker/dockerfile:1.4
# Production Dockerfile for Villa Developers Portal

FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# Copy all workspace package.json files for bun install
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/developers/package.json ./apps/developers/
COPY apps/hub/package.json ./apps/hub/
COPY apps/key/package.json ./apps/key/
COPY apps/relay/package.json ./apps/relay/
COPY apps/telemetry/package.json ./apps/telemetry/
COPY contracts/package.json ./contracts/
COPY packages/config/package.json ./packages/config/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/sdk-react/package.json ./packages/sdk-react/
COPY packages/ui/package.json ./packages/ui/

RUN bun install --frozen-lockfile --ignore-scripts || echo "Continuing despite prepare script failure"

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
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bun /node_modules/.bun

USER nextjs
EXPOSE 3000

# server.js is at root of standalone output
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
