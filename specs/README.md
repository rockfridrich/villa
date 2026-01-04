# Specifications

**Look in `active/` first** - that's what's being built now.

```
specs/
├── active/       Currently developing - START HERE
├── done/         Implemented - reference only
├── reference/    Evergreen guides (vision, design)
└── templates/    For creating new specs
```

---

## Active Specs

| Spec | Description | Priority |
|------|-------------|----------|
| [identity-sdk.md](active/identity-sdk.md) | Villa Identity SDK architecture | P0 |
| [auth-flow.md](active/auth-flow.md) | SDK authentication UX flows | P0 |
| [nickname.md](active/nickname.md) | Nickname registry and claiming | P1 |

---

## Done Specs

| Spec | Description | Shipped |
|------|-------------|---------|
| [v1-passkey-login.md](done/v1-passkey-login.md) | Phase 1 passkey authentication | 2026-01 |
| [avatar-system.md](done/avatar-system.md) | DiceBear avatar generation | 2026-01 |
| [avatar-selection.md](done/avatar-selection.md) | Avatar picker product spec | 2026-01 |
| [identity-system.product.md](done/identity-system.product.md) | Identity system product spec | 2026-01 |
| [identity-system.wbs.md](done/identity-system.wbs.md) | Work breakdown structure | 2026-01 |

---

## Reference

| Doc | Purpose |
|-----|---------|
| [vision.md](reference/vision.md) | Product vision and principles |
| [design-system.md](reference/design-system.md) | UI patterns and Tailwind tokens |
| [spec-sync.md](reference/spec-sync.md) | Claude GUI ↔ Repo sync workflow |
| [tech-spec-guide.md](reference/tech-spec-guide.md) | How to write tech specs |

---

## Creating New Specs

1. Draft in Claude GUI (conversational iteration)
2. Copy to `specs/active/` with metadata header
3. Implement with `@build` agent
4. Move to `specs/done/` when shipped

See [spec-sync.md](reference/spec-sync.md) for full workflow.
