# syntax=docker/dockerfile:1.4
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ git
WORKDIR /app

# Copy package.json files for all workspaces
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/developers/package.json ./apps/developers/
COPY apps/hub/package.json ./apps/hub/
COPY apps/key/package.json ./apps/key/
COPY apps/telemetry/package.json ./apps/telemetry/
COPY contracts/package.json ./contracts/
COPY packages/config/package.json ./packages/config/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/sdk-react/package.json ./packages/sdk-react/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts || echo "Continuing"

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY . .

# Build the API service
ENV NODE_ENV=production
RUN bun turbo run build --filter=@villa/api

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apiuser

# Copy built application
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist/
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./package.json

# Copy node_modules (only the dependencies needed for production)
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules/

USER apiuser
EXPOSE 3001

# Health check using the API's health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]