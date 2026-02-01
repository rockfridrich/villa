# Villa Developers — docs.villa.cash
# GitHub sync: Railway auto-deploys on push to main

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm libc6-compat
WORKDIR /app

# Copy everything and install deps in one stage
# Bun workspace symlinks don't survive Docker COPY between stages
COPY . .
RUN bun install

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG BUILD_TIME

ARG NEXT_PUBLIC_ENV=production
ARG RAILWAY_GIT_COMMIT_SHA
ARG NEXT_PUBLIC_VERSION=0.1.0

ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_GIT_SHA=$RAILWAY_GIT_COMMIT_SHA
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME

RUN bun turbo run build --filter=@villa/developers

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/standalone ./
# Bun's node_modules uses global store symlinks that break standalone tracing.
# Install Next.js runtime deps directly with npm for reliable resolution.
RUN npm install --no-save next@14.2.35 react react-dom 2>/dev/null && \
    chown -R nextjs:nodejs node_modules && rm -rf /tmp/npm-*
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/developers/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
