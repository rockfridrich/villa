# Cost Tracking

Track tokens and cost per PR to optimize development efficiency.

## Session: 2026-01-05 (SDK + Developers Portal)

### Token Usage (Estimated)

| Agent | Task | Input Tokens | Output Tokens | Est. Cost |
|-------|------|--------------|---------------|-----------|
| Orchestrator | Planning + coordination | ~50K | ~10K | ~$0.50 |
| @build (a7b3a52) | SDK demo page | ~300K | ~50K | ~$3.00 |
| @design (ad38704) | Avatar UX improvements | ~200K | ~30K | ~$2.00 |
| @build (aed2921) | Validation UX | ~400K | ~40K | ~$3.50 |
| **TOTAL** | | ~950K | ~130K | **~$9.00** |

### Efficiency Notes

- **Waste identified**: SDK demo page had type errors requiring multiple iterations
- **Improvement**: Run `pnpm verify` before committing any agent work
- **Pattern**: Spec-first approach reduces iterations

### Cost Per Feature

| Feature | Tokens | Cost | Efficiency |
|---------|--------|------|------------|
| VillaAuth component | ~20K | ~$0.15 | Good - single pass |
| SDK demo page | ~400K | ~$3.50 | Poor - type errors |
| Avatar improvements | ~200K | ~$2.00 | Medium |
| Residents example | ~15K | ~$0.10 | Good |

### Optimization Goals

1. **Pre-flight checks**: Always run typecheck before large edits
2. **Type-first**: Read type definitions before implementing
3. **Spec approval**: Get spec approved before building
4. **Parallel efficiency**: Launch independent agents simultaneously
5. **Early termination**: Kill agents hitting type errors repeatedly

---

## Tracking Template

```markdown
## PR #XX: [Title]

**Date:** YYYY-MM-DD
**Agents Used:** @build, @design, @test

| Phase | Tokens | Cost |
|-------|--------|------|
| Planning | | |
| Implementation | | |
| Review/Fix | | |
| **Total** | | |

**Lessons:**
-
```
