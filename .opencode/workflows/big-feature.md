# Big Feature Workflow

Standard workflow for features taking 2+ hours.

## Phase 1: Setup (5 min)

```bash
# Clean state
git checkout main && git pull

# Create feature branch
git checkout -b feat/[name]

# Start services
bun dev &
cd apps/telemetry && bun dev &
open http://localhost:3003
```

## Phase 2: Plan (10 min)

1. Create todo list with all tasks
2. Identify files to modify
3. Check for related issues/PRs
4. Spawn explore agent for codebase context

## Phase 3: Implement (iterative)

For each task:
1. Mark todo as in_progress
2. Make changes
3. Run `bun verify` on affected packages
4. Commit with descriptive message
5. Mark todo as completed

### Parallel Execution

When possible, run in parallel:
- Frontend changes → frontend-ui-ux-engineer agent
- Infrastructure → ops agent
- Documentation → document-writer agent
- Research → librarian agent (background)

## Phase 4: Verify

```bash
bun verify                    # Full verification
bun test                      # All tests
lsp_diagnostics               # Check for errors
```

## Phase 5: Ship

```bash
# Push and create PR
git push -u origin feat/[name]
gh pr create --title "feat: [description]" --body "..."

# Or merge directly if small
git checkout main
git merge feat/[name]
git push origin main
```

## Phase 6: Clean Up

1. Delete feature branch
2. Update related issues
3. Tag release if applicable
4. Update LEARNINGS.md
5. Stop telemetry server
