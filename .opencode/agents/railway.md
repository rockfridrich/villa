# Railway Operations Agent

Infrastructure operations for Railway App Platform.

## Capabilities

- Railway service management via GraphQL API
- Dockerfile configuration and deployment
- Custom domain management
- Database operations

## Railway API Reference

### Authentication
```bash
RAILWAY_TOKEN=$(cat ~/.railway/config.json | jq -r '.user.token')
RAILWAY_API="https://backboard.railway.app/graphql/v2"
```

### Common Operations

#### List Services
```graphql
query {
  project(id: "$PROJECT_ID") {
    services {
      edges {
        node { id name }
      }
    }
  }
}
```

#### Update Service Name
```graphql
mutation {
  serviceUpdate(id: "$SERVICE_ID", input: { name: "new-name" }) {
    id name
  }
}
```

#### Set Dockerfile Path
```graphql
mutation {
  serviceInstanceUpdate(
    serviceId: "$SERVICE_ID",
    environmentId: "$ENV_ID",
    input: { dockerfilePath: "apps/myapp/Dockerfile" }
  )
}
```

#### Add Custom Domain
```graphql
mutation {
  customDomainCreate(input: {
    domain: "example.com",
    serviceId: "$SERVICE_ID",
    environmentId: "$ENV_ID",
    projectId: "$PROJECT_ID"
  }) {
    id domain
  }
}
```

#### Redeploy Service
```graphql
mutation {
  serviceInstanceRedeploy(
    serviceId: "$SERVICE_ID",
    environmentId: "$ENV_ID"
  )
}
```

## Bun Workspace Dockerfile Pattern

For monorepos with bun workspaces, ALL workspace package.json files must be copied before `bun install`:

```dockerfile
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# Copy ALL workspace package.json files
COPY package.json bun.lock turbo.json ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/
COPY contracts/package.json ./contracts/

RUN bun install --frozen-lockfile --ignore-scripts || echo "Continuing"

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules/
COPY --from=deps /app/apps ./apps/
COPY --from=deps /app/packages ./packages/
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun turbo run build --filter=@myorg/myapp

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# CRITICAL: Copy standalone output AND node_modules/.bun for symlinks
COPY --from=builder --chown=nextjs:nodejs /app/apps/myapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/myapp/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/myapp/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bun /node_modules/.bun

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

### Key Learnings

1. **Workspace install fails** if any referenced workspace package.json is missing
2. **Standalone symlinks** point to `node_modules/.bun/` - MUST copy this
3. **COPY fallback syntax** (`2>/dev/null || true`) doesn't work in Dockerfile
4. **Builder enum** doesn't have DOCKERFILE - set `dockerfilePath` and Railway auto-detects

## Villa Project IDs

```
PROJECT_ID: 7c344004-cd63-4b10-8479-9991c3923115
ENV_ID: 00c94bb8-6243-44b5-b230-a2e957b1d0fb (production)

Services:
- villa-production: 1c25828b-4678-4723-8cb5-8777312584a8
- villa-key: 2b3dab1c-0b03-41c4-b9f3-429579532a72
- villa-developers: afc99a53-eb94-45ff-b018-8fc29b8cc84a
- Postgres: 360242c6-e2d4-42e2-b377-c4f9cf283bff
```

## Domains

| Service | Domain | Railway Target |
|---------|--------|----------------|
| villa-production | villa.cash | villa-staging-production.up.railway.app |
| villa-production | construction.villa.cash | villa-staging-production.up.railway.app |
| villa-key | key.villa.cash | villa-key-staging-production.up.railway.app |
| villa-developers | docs.villa.cash | villa-developers-production.up.railway.app |
