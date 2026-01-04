# Villa Database Security Architecture

**Status:** Implemented
**Date:** 2026-01-05
**Infrastructure:** DigitalOcean Managed PostgreSQL

---

## Security Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTERNET                                          │
│                           │                                              │
│                           ▼                                              │
│              ┌─────────────────────────┐                                │
│              │    CloudFlare CDN       │                                │
│              │    (DDoS Protection)    │                                │
│              └───────────┬─────────────┘                                │
│                          │                                              │
├──────────────────────────┼──────────────────────────────────────────────┤
│                          │  DIGITALOCEAN INFRASTRUCTURE                  │
│                          ▼                                              │
│              ┌─────────────────────────┐                                │
│              │   App Platform (Web)    │                                │
│              │   villa-production      │                                │
│              │   villa-staging         │                                │
│              └───────────┬─────────────┘                                │
│                          │                                              │
│    ┌─────────────────────┼─────────────────────────────────────────┐   │
│    │                     │  VPC: villa-vpc (10.120.0.0/20)         │   │
│    │                     │  PRIVATE NETWORK - NO INTERNET ACCESS   │   │
│    │                     ▼                                         │   │
│    │         ┌─────────────────────────┐                           │   │
│    │         │   PostgreSQL 17         │                           │   │
│    │         │   villa-db              │                           │   │
│    │         │                         │                           │   │
│    │         │   • SSL Required        │                           │   │
│    │         │   • VPC Firewall Only   │                           │   │
│    │         │   • Auto Backups        │                           │   │
│    │         │   • Encrypted at Rest   │                           │   │
│    │         └─────────────────────────┘                           │   │
│    │                     ▲                                         │   │
│    │                     │                                         │   │
│    │         ┌───────────┴───────────┐                             │   │
│    │         │   Bastion Host        │◄──── SSH Tunnel             │   │
│    │         │   (Dev Access Only)   │      (Developer Laptops)    │   │
│    │         └───────────────────────┘                             │   │
│    │                                                               │   │
│    └───────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Layers

### 1. Network Isolation (VPC)

| Layer | Protection |
|-------|------------|
| **VPC** | Database only accessible from `10.120.0.0/20` subnet |
| **Firewall** | Only VPC traffic allowed, no public internet |
| **Private DNS** | `private-villa-db-*.db.ondigitalocean.com` |

**VPC Configuration:**
- ID: `0675fc93-b3bd-4ebe-a21c-d1e9632984ee`
- Region: `nyc1`
- IP Range: `10.120.0.0/20` (4,096 addresses)

### 2. Encryption

| Type | Implementation |
|------|----------------|
| **In Transit** | TLS 1.3 required (`sslmode=require`) |
| **At Rest** | AES-256 (DigitalOcean managed) |
| **Backups** | Encrypted with same key |

### 3. Access Control

| Access Type | Method | Use Case |
|-------------|--------|----------|
| **App Platform** | VPC peering (automatic) | Production/Staging |
| **Developer** | SSH tunnel via bastion | Local development |
| **CI/CD** | GitHub Secrets + App Platform | Automated deploys |
| **Admin** | DO Console or SSH tunnel | Emergency access |

### 4. Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    CREDENTIAL MANAGEMENT                     │
├─────────────────────────────────────────────────────────────┤
│  Production     │ DO App Platform env vars (encrypted)      │
│  Staging        │ DO App Platform env vars (encrypted)      │
│  CI/CD          │ GitHub Secrets (encrypted)                │
│  Development    │ .env.local (gitignored)                   │
│  Admin (doadmin)│ DO Console only, rotate monthly           │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Configuration

### Connection Details

```bash
# Private connection (VPC only) - USE THIS
Host: private-villa-db-do-user-25748363-0.g.db.ondigitalocean.com
Port: 25060 (direct) / 25061 (pooler)

# Public connection (BLOCKED by firewall)
Host: villa-db-do-user-25748363-0.g.db.ondigitalocean.com
```

### Connection Pooling

For serverless/high-concurrency, use the pooler port:

```
postgresql://user:pass@private-host:25061/defaultdb?sslmode=require
                                    ^^^^^
                                    Pooler port
```

| Port | Mode | Use Case |
|------|------|----------|
| 25060 | Direct | Long-running connections, migrations |
| 25061 | Pooled | Serverless, high concurrency, API |

### Resource Limits

| Resource | Value | Notes |
|----------|-------|-------|
| Max Connections | 22 | Basic 1GB plan |
| Storage | 10 GB | Expandable |
| RAM | 1 GB | Sufficient for 100K users |
| CPU | 1 vCPU | Shared |

---

## Backup & Recovery

### Automatic Backups

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full backup | Daily | 7 days |
| WAL (PITR) | Continuous | 7 days |

**Point-in-Time Recovery:** Can restore to any second within 7 days.

### Manual Backup (Before Major Changes)

```bash
# Create manual backup
doctl databases backups create c906b352-d53d-4671-986e-16a785f1c913

# List backups
doctl databases backups list c906b352-d53d-4671-986e-16a785f1c913
```

### Disaster Recovery

| Scenario | Recovery Method | RTO |
|----------|-----------------|-----|
| Accidental DELETE | PITR restore | ~5 min |
| Data corruption | Full backup restore | ~10 min |
| Region failure | Restore to new region | ~30 min |
| Total loss | Recreate from backup | ~1 hour |

---

## Development Access

### SSH Tunnel Setup

For local development, use an SSH tunnel through a bastion host:

```bash
# 1. Create bastion (one-time)
doctl compute droplet create villa-bastion \
  --size s-1vcpu-512mb-10gb \
  --image ubuntu-24-04-x64 \
  --region nyc1 \
  --vpc-uuid 0675fc93-b3bd-4ebe-a21c-d1e9632984ee \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1)

# 2. Get bastion IP
export VILLA_BASTION_HOST=$(doctl compute droplet get villa-bastion --format PublicIPv4 --no-header)

# 3. Start tunnel
./scripts/db-tunnel.sh start

# 4. Connect locally
DATABASE_URL=postgresql://doadmin:PASSWORD@localhost:5433/villa?sslmode=require
```

### Direct Console Access (Admin Only)

```bash
# Via DO Console (requires 2FA)
https://cloud.digitalocean.com/databases/c906b352-d53d-4671-986e-16a785f1c913

# Via doctl (requires API token)
doctl databases connection c906b352-d53d-4671-986e-16a785f1c913
```

---

## Monitoring & Alerts

### Built-in Metrics (DO Dashboard)

- CPU utilization
- Memory usage
- Disk I/O
- Active connections
- Query performance

### Recommended Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 80% | 5 min sustained | Scale up |
| Memory > 90% | 5 min sustained | Scale up |
| Connections > 20 | Any | Check for leaks |
| Disk > 80% | Any | Add storage |

### Query Monitoring

```sql
-- Slow queries (> 100ms average)
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY total_time DESC
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Cost Optimization

### Current Configuration

| Resource | Spec | Monthly Cost |
|----------|------|--------------|
| Database | db-s-1vcpu-1gb | $15 |
| Bastion | s-1vcpu-512mb-10gb | $4 |
| **Total** | | **$19/mo** |

### Scaling Path

| Users | Database Size | Monthly Cost |
|-------|---------------|--------------|
| 0-10K | db-s-1vcpu-1gb | $15 |
| 10K-50K | db-s-1vcpu-2gb | $30 |
| 50K-100K | db-s-2vcpu-4gb | $60 |
| 100K+ | db-s-2vcpu-4gb + replica | $75 |

### Cost Saving Tips

1. **Use connection pooler (25061)** - Reduces connection overhead
2. **Index frequently queried columns** - Faster queries = less CPU
3. **Clean up old audit logs** - Less storage
4. **Schedule bastion** - Stop when not in use ($4 → $0)

---

## Compliance & Audit

### Data Stored

| Table | Data Type | Sensitivity |
|-------|-----------|-------------|
| profiles | address, nickname, avatar | Low |
| audit_log | actions, timestamps | Low |
| nickname_reservations | temp holds | Low |

**No PII stored:** Only wallet addresses (pseudonymous) and user-chosen nicknames.

### Access Audit Trail

DigitalOcean maintains audit logs for:
- Database access attempts
- Configuration changes
- Backup operations
- User management

---

## Incident Response

### Security Incident Checklist

1. **Isolate:** Pause database if compromised
   ```bash
   doctl databases maintenance-window update DB_ID --day sunday --hour 00:00:00
   ```

2. **Rotate credentials:**
   ```bash
   doctl databases user reset DB_ID doadmin
   ```

3. **Review logs:** Check DO audit trail

4. **Restore if needed:**
   ```bash
   doctl databases create villa-db-restored \
     --restore-from DB_ID \
     --restore-timestamp "2026-01-05T12:00:00Z"
   ```

5. **Update secrets:** Rotate all environment variables

---

## Quick Reference

| Item | Value |
|------|-------|
| Database ID | `c906b352-d53d-4671-986e-16a785f1c913` |
| VPC ID | `0675fc93-b3bd-4ebe-a21c-d1e9632984ee` |
| Region | `nyc1` |
| Private Host | `private-villa-db-do-user-25748363-0.g.db.ondigitalocean.com` |
| Direct Port | 25060 |
| Pooler Port | 25061 |
| Admin User | `doadmin` |
| Default DB | `defaultdb` |

### Emergency Commands

```bash
# Get connection string
doctl databases connection c906b352-d53d-4671-986e-16a785f1c913

# Create backup now
doctl databases backups create c906b352-d53d-4671-986e-16a785f1c913

# Check status
doctl databases get c906b352-d53d-4671-986e-16a785f1c913 --output json | jq '.[0].status'
```
