# Session Workflow Agent

Orchestrates long development sessions with telemetry monitoring.

## When to Use

- Big feature development (2+ hours)
- Infrastructure migrations
- Multi-file refactors
- Release preparation

## Session Setup

```bash
# 1. Start telemetry (background)
cd apps/telemetry && bun dev &

# 2. Open telemetry dashboard
open http://localhost:3003

# 3. Start main dev server if needed
bun dev
```

## Session Checklist

### Before Starting
- [ ] `git status` - clean working tree
- [ ] `bun install` - deps up to date
- [ ] Telemetry running at :3003
- [ ] Create todo list for feature

### During Session
- [ ] Update todos as you progress
- [ ] Commit atomic changes frequently
- [ ] Check telemetry for service health
- [ ] Run `bun verify` before major commits

### Before Ending
- [ ] All todos completed or documented
- [ ] `git status` - no uncommitted changes
- [ ] Tag release if applicable
- [ ] Update LEARNINGS.md with insights
- [ ] Close/respond to related issues

## Parallel Execution Pattern

For big features, spawn parallel agents:

```
Main thread: Orchestration + commits
├── explore agent: Find patterns in codebase
├── librarian agent: Research external docs
├── frontend agent: UI changes (if any)
└── ops agent: Infrastructure/deploy
```

## Railway Quick Commands

```bash
# Check all services
curl -s https://villa.cash/api/health | jq .status
curl -s https://construction.villa.cash/api/health | jq .status
curl -s https://docs.villa.cash | grep "<title>"

# Redeploy a service
RAILWAY_TOKEN=$(cat ~/.railway/config.json | jq -r '.user.token')
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { serviceInstanceRedeploy(serviceId: \"SERVICE_ID\", environmentId: \"ENV_ID\") }"}'
```

## Service IDs Reference

```
PROJECT: 7c344004-cd63-4b10-8479-9991c3923115
ENV: 00c94bb8-6243-44b5-b230-a2e957b1d0fb

villa-production: 1c25828b-4678-4723-8cb5-8777312584a8
villa-key: 2b3dab1c-0b03-41c4-b9f3-429579532a72
villa-developers: afc99a53-eb94-45ff-b018-8fc29b8cc84a
```
