# Villa Key — key.villa.cash
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

ARG NEXT_PUBLIC_CHAIN_ID=84532
ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID

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
# Bun's standalone output has empty node_modules (global store symlinks).
# Standalone package.json has workspace: refs npm can't resolve — override it.
RUN rm -rf node_modules && echo '{}' > package.json && \
    npm install --no-save --ignore-scripts next@14.2.35 react react-dom && \
    chown -R nextjs:nodejs node_modules && rm -f package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/static ./.next/static

RUN mkdir -p ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
