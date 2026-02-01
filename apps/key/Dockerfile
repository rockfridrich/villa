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

RUN bun turbo run build --filter=@villa/key

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

COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /tmp/next ./node_modules/next
COPY --from=builder --chown=nextjs:nodejs /tmp/react ./node_modules/react
COPY --from=builder --chown=nextjs:nodejs /tmp/react-dom ./node_modules/react-dom
COPY --from=builder --chown=nextjs:nodejs /app/apps/key/.next/static ./.next/static

RUN mkdir -p ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
