# Specifications

## Directory Structure

```
specs/
├── active/         # Current sprint - SDK delivery
├── done/           # Completed and shipped
├── backlog/        # Future work (not current priority)
├── infrastructure/ # Infra, DB, security specs
└── reference/      # Design principles, templates
```

---

## Active (Sprint 2 Focus)

| Spec | Description |
|------|-------------|
| [identity-sdk.md](active/identity-sdk.md) | SDK architecture and API |
| [sdk-mlp-roadmap.md](active/sdk-mlp-roadmap.md) | Sprint tracking |
| [auth-flow.md](active/auth-flow.md) | Authentication UX |
| [nickname.md](active/nickname.md) | Nickname claiming |

**Goal:** Ship SDK for external app integration

---

## Done

| Spec | Shipped |
|------|---------|
| [v1-passkey-login.md](done/v1-passkey-login.md) | 2026-01 |
| [avatar-system.md](done/avatar-system.md) | 2026-01 |
| [v2-architecture.md](done/v2-architecture.md) | 2026-01 |

---

## Backlog

| Spec | Priority |
|------|----------|
| [villa-biometric-recovery-spec.md](backlog/villa-biometric-recovery-spec.md) | P2 |
| [ui-component-rebuild.md](backlog/ui-component-rebuild.md) | P3 |
| [returning-user-flow.md](backlog/returning-user-flow.md) | P2 |

---

## Infrastructure

| Spec | Status |
|------|--------|
| [infrastructure-postgres.md](infrastructure/infrastructure-postgres.md) | Done |
| [database-security.md](infrastructure/database-security.md) | Done |
| [secrets-management.md](infrastructure/secrets-management.md) | Done |
| [contracts-production-readiness.md](infrastructure/contracts-production-readiness.md) | Review |

---

## Reference

| Doc | Purpose |
|-----|---------|
| [vision.md](reference/vision.md) | Product vision |
| [design-system.md](reference/design-system.md) | UI patterns |
| [design-principles.md](reference/design-principles.md) | UX philosophy |
