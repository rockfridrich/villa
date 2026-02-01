# Villa Hub — villa.cash
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

# Bun uses hardlinks to global store — dereference for Docker COPY
# next/react may be hoisted to root or in app's node_modules
RUN NEXT_DIR=$(find /app -path "*/node_modules/next" -maxdepth 4 -type d | head -1) && \
    REACT_DIR=$(find /app -path "*/node_modules/react" -not -path "*/react-dom/*" -maxdepth 4 -type d | head -1) && \
    REACTDOM_DIR=$(find /app -path "*/node_modules/react-dom" -maxdepth 4 -type d | head -1) && \
    cp -rL "$NEXT_DIR" /tmp/next && \
    cp -rL "$REACT_DIR" /tmp/react && \
    cp -rL "$REACTDOM_DIR" /tmp/react-dom

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /tmp/next ./node_modules/next
COPY --from=builder --chown=nextjs:nodejs /tmp/react ./node_modules/react
COPY --from=builder --chown=nextjs:nodejs /tmp/react-dom ./node_modules/react-dom
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
