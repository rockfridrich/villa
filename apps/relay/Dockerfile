FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@latest

FROM base AS deps
WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/relay/package.json ./apps/relay/
COPY packages/config/package.json ./packages/config/
COPY packages/config/tsconfig ./packages/config/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @villa/relay...

FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/relay/node_modules ./apps/relay/node_modules

# Copy source files
COPY packages/config ./packages/config
COPY apps/relay ./apps/relay

# Build
WORKDIR /app/apps/relay
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy built application
COPY --from=builder /app/apps/relay/dist ./dist
COPY --from=builder /app/apps/relay/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/index.js"]
