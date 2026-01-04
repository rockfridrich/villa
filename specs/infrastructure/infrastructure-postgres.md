# Villa PostgreSQL Infrastructure

**Status:** Design Approved
**Date:** 2026-01-05
**Platform:** DigitalOcean Managed PostgreSQL

---

## Why DigitalOcean Managed PostgreSQL

| Factor | DO Managed | Self-hosted | Supabase |
|--------|------------|-------------|----------|
| **Backups** | Daily + PITR, included | DIY | Daily, 7-day retention |
| **Failover** | Automatic | DIY | Limited |
| **VPC** | Same network as App Platform | N/A | Public only |
| **SSL** | End-to-end | DIY | Yes |
| **Maintenance** | Automatic updates | DIY | Automatic |
| **Cost** | $15/mo minimum | $6/mo + time | Free tier |
| **Latency** | <1ms (VPC) | Varies | 50-100ms |

**Decision:** DO Managed PostgreSQL for production. Keeps entire stack in one platform with automatic backups, VPC networking, and zero maintenance overhead.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DigitalOcean Account                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    VPC: villa-vpc (10.0.0.0/16)                    │ │
│  │                                                                    │ │
│  │  ┌──────────────────┐        ┌──────────────────────────────────┐ │ │
│  │  │  App Platform    │        │  Managed PostgreSQL              │ │ │
│  │  │                  │        │                                  │ │ │
│  │  │  villa-web       │◄──────►│  villa-db                        │ │ │
│  │  │  villa-api       │  VPC   │  • PostgreSQL 17                 │ │ │
│  │  │                  │        │  • 1 vCPU / 1GB RAM              │ │ │
│  │  │                  │        │  • 10GB SSD (expandable)         │ │ │
│  │  └──────────────────┘        │  • Daily backups (7 days)        │ │ │
│  │                              │  • Point-in-time recovery        │ │ │
│  │                              │  • SSL required                  │ │ │
│  │                              └──────────────────────────────────┘ │ │
│  │                                                                    │ │
│  │  Cloudflare DNS ─────────────► villa.cash, api.villa.cash         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Backup Storage                                   │ │
│  │                                                                    │ │
│  │  • Automatic daily backups (DO managed)                            │ │
│  │  • 7-day retention (default)                                       │ │
│  │  • Point-in-time recovery (PITR) via WAL                           │ │
│  │  • Cross-region backup (optional, +$)                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Sizing

### Phase 1: Launch (0-10K users)

| Resource | Value | Cost |
|----------|-------|------|
| Plan | Basic 1GB | $15/mo |
| vCPU | 1 | included |
| RAM | 1 GB | included |
| Storage | 10 GB | included |
| Connections | 22 max | included |
| Backups | Daily + PITR | included |

**Data estimate:**
- Profile row: ~200 bytes
- 10K users = 2 MB data
- 10 GB is 5000x headroom

### Phase 2: Growth (10K-100K users)

| Resource | Value | Cost |
|----------|-------|------|
| Plan | Basic 2GB | $30/mo |
| vCPU | 1 | included |
| RAM | 2 GB | included |
| Storage | 30 GB | included |
| Connections | 47 max | included |

### Phase 3: Scale (100K+ users)

| Resource | Value | Cost |
|----------|-------|------|
| Plan | Basic 4GB | $60/mo |
| vCPU | 2 | included |
| RAM | 4 GB | included |
| Storage | 60 GB | included |
| Connections | 97 max | included |
| Read replica | Optional | +$15/mo |

---

## Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (main identity store)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(42) NOT NULL UNIQUE,
  nickname VARCHAR(32) UNIQUE,
  nickname_normalized VARCHAR(32) UNIQUE,
  avatar_style VARCHAR(20) DEFAULT 'bottts',
  avatar_seed VARCHAR(64),
  avatar_gender VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nickname reservations (temporary holds)
CREATE TABLE nickname_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname_normalized VARCHAR(32) NOT NULL UNIQUE,
  address VARCHAR(42) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENS registrations (track on-chain names)
CREATE TABLE ens_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(42) NOT NULL UNIQUE,
  ens_name VARCHAR(255) NOT NULL,
  chain_id INTEGER NOT NULL,
  tx_hash VARCHAR(66),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Audit log (for debugging and compliance)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(42),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_profiles_address ON profiles(address);
CREATE INDEX idx_profiles_nickname ON profiles(nickname_normalized);
CREATE INDEX idx_reservations_expires ON nickname_reservations(expires_at);
CREATE INDEX idx_audit_address ON audit_log(address);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Drizzle ORM Schema

```typescript
// apps/api/src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  inet,
  integer,
} from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  nickname: varchar('nickname', { length: 32 }).unique(),
  nicknameNormalized: varchar('nickname_normalized', { length: 32 }).unique(),
  avatarStyle: varchar('avatar_style', { length: 20 }).default('bottts'),
  avatarSeed: varchar('avatar_seed', { length: 64 }),
  avatarGender: varchar('avatar_gender', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const nicknameReservations = pgTable('nickname_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  nicknameNormalized: varchar('nickname_normalized', { length: 32 }).notNull().unique(),
  address: varchar('address', { length: 42 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const ensRegistrations = pgTable('ens_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  ensName: varchar('ens_name', { length: 255 }).notNull(),
  chainId: integer('chain_id').notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: varchar('address', { length: 42 }),
  action: varchar('action', { length: 50 }).notNull(),
  details: jsonb('details'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type NicknameReservation = typeof nicknameReservations.$inferSelect
export type AuditEntry = typeof auditLog.$inferSelect
```

---

## Backup Strategy

### Automatic Backups (Included)

| Type | Frequency | Retention | Recovery Time |
|------|-----------|-----------|---------------|
| Full backup | Daily | 7 days | ~5 min |
| WAL (PITR) | Continuous | 7 days | ~2 min |

**Point-in-time recovery:** Can restore to any second within the 7-day window.

### Manual Backup (Before Major Changes)

```bash
# Create manual backup via doctl
doctl databases backups create $DB_ID

# List backups
doctl databases backups list $DB_ID
```

### Backup Verification

```bash
# Weekly: Restore to test cluster
doctl databases create temp-restore \
  --restore-from $DB_ID \
  --restore-timestamp "2026-01-05T12:00:00Z"

# Verify data integrity
psql $TEMP_RESTORE_URL -c "SELECT COUNT(*) FROM profiles;"

# Cleanup
doctl databases delete temp-restore
```

### Extended Retention (Optional)

For compliance or archival:

```bash
# Export to Spaces (S3-compatible)
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
doctl spaces put villa-backups backup-$(date +%Y%m%d).sql.gz
```

---

## Connection Configuration

### Environment Variables

```bash
# .env (development)
DATABASE_URL=postgresql://user:pass@localhost:5432/villa_dev

# .env.production
DATABASE_URL=postgresql://doadmin:${DB_PASSWORD}@villa-db-do-user-xxx.db.ondigitalocean.com:25060/villa?sslmode=require
```

### App Platform Config

```yaml
# .do/app.yaml
services:
  - name: villa-api
    environment_slug: node-js
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${villa-db.DATABASE_URL}
      - key: DATABASE_CA_CERT
        scope: RUN_TIME
        value: ${villa-db.CA_CERT}

databases:
  - name: villa-db
    engine: PG
    version: "17"
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

### Connection Pooling

DigitalOcean managed databases include connection pooling:

```bash
# Direct connection (25060)
postgresql://user:pass@host:25060/villa?sslmode=require

# Connection pooler (25061) - recommended for serverless
postgresql://user:pass@host:25061/villa?sslmode=require
```

**Use pooler (port 25061)** for:
- Serverless functions
- High-concurrency APIs
- Connection-limited plans

---

## Security Configuration

### Network Access

```bash
# Restrict to VPC only (recommended)
doctl databases firewalls append $DB_ID \
  --rule vpc:$VPC_UUID

# Or allow specific App Platform app
doctl databases firewalls append $DB_ID \
  --rule app:$APP_ID
```

### SSL/TLS

```typescript
// Require SSL in connection
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT,
  },
})

export const db = drizzle(pool)
```

### Credentials Rotation

```bash
# Rotate credentials (zero-downtime)
doctl databases user reset $DB_ID doadmin

# Update secrets in App Platform
doctl apps update $APP_ID --spec .do/app.yaml
```

---

## Monitoring & Alerts

### Built-in Metrics

DO provides these metrics automatically:
- CPU utilization
- Memory usage
- Disk I/O
- Active connections
- Replication lag (if standby)

### Alert Configuration

```bash
# Create alert for high CPU
doctl monitoring alert create \
  --type v1/insights/droplet/cpu \
  --compare GreaterThan \
  --value 80 \
  --window 5m \
  --entities $DB_DROPLET_ID \
  --emails ops@villa.cash

# Create alert for connection saturation
doctl monitoring alert create \
  --type v1/insights/database/connections \
  --compare GreaterThan \
  --value 20 \
  --window 5m \
  --entities $DB_ID \
  --emails ops@villa.cash
```

### Query Performance

```sql
-- Enable query stats (already on by DO)
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
WHERE mean_time > 100  -- > 100ms
ORDER BY mean_time DESC;
```

---

## Deployment Commands

### Create Database

```bash
# Create managed PostgreSQL cluster
doctl databases create villa-db \
  --engine pg \
  --version 17 \
  --size db-s-1vcpu-1gb \
  --region nyc1 \
  --num-nodes 1 \
  --private-network-uuid $VPC_UUID

# Get connection details
doctl databases connection villa-db --format Host,Port,User,Password,Database
```

### Run Migrations

```bash
# Install drizzle-kit
pnpm add -D drizzle-kit

# Generate migration
pnpm drizzle-kit generate:pg

# Run migration
pnpm drizzle-kit migrate

# Or via npm script
pnpm --filter @villa/api db:migrate
```

### Verify Setup

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check tables
psql $DATABASE_URL -c "\dt"

# Insert test profile
psql $DATABASE_URL -c "
INSERT INTO profiles (address, nickname, nickname_normalized)
VALUES ('0x1234567890abcdef1234567890abcdef12345678', 'test', 'test')
RETURNING *;
"
```

---

## Cost Summary

| Phase | Users | Plan | Monthly Cost |
|-------|-------|------|--------------|
| Launch | 0-10K | Basic 1GB | **$15** |
| Growth | 10K-100K | Basic 2GB | **$30** |
| Scale | 100K+ | Basic 4GB + replica | **$75** |

**Includes:**
- Daily backups (7-day retention)
- Point-in-time recovery
- SSL encryption
- Automatic failover
- Software updates
- 24/7 monitoring

**No additional charges for:**
- Backup storage
- Network transfer (within DO)
- Connection pooling

---

## Migration from In-Memory

Current API uses in-memory Maps. Migration steps:

1. **Create database** (doctl command above)
2. **Update schema** (expand existing `apps/api/src/db/schema.ts`)
3. **Add drizzle client** (`apps/api/src/db/client.ts`)
4. **Update routes** (replace Map operations with Drizzle queries)
5. **Add connection to App Platform** (link database component)
6. **Deploy** (migrations run automatically)

```typescript
// Before (in-memory)
const nicknameStore = new Map<string, string>()
nicknameStore.set(normalized, address)

// After (PostgreSQL)
import { db } from '../db/client'
import { profiles } from '../db/schema'

await db.insert(profiles).values({
  address,
  nickname: normalized,
  nicknameNormalized: normalized,
})
```

---

## Next Steps

1. [ ] Create DigitalOcean managed database
2. [ ] Set up VPC and firewall rules
3. [ ] Update Drizzle schema with full tables
4. [ ] Create database client with connection pooling
5. [ ] Update API routes to use PostgreSQL
6. [ ] Add App Platform database binding
7. [ ] Run initial migration
8. [ ] Test backup/restore procedure
9. [ ] Configure monitoring alerts

---

## Sources

- [DigitalOcean Managed Database Pricing](https://www.digitalocean.com/pricing/managed-databases)
- [PostgreSQL Pricing Details](https://docs.digitalocean.com/products/databases/postgresql/details/pricing/)
- [DigitalOcean Managed PostgreSQL](https://www.digitalocean.com/products/managed-databases-postgresql)
