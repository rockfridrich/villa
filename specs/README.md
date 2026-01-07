# Specifications

## Directory Structure

```
specs/
├── active/         # Current sprint work
├── done/           # Completed and shipped
├── infrastructure/ # Infra, DB, security specs
└── reference/      # Design principles, templates, backlog
```

---

## Active (Current Work)

| Spec | Description |
|------|-------------|
| [identity-sdk.md](active/identity-sdk.md) | SDK architecture and API |
| [production-roadmap.md](active/production-roadmap.md) | Mainnet deployment blockers |
| [developers-portal.md](active/developers-portal.md) | Developer portal features |
| [v2-architecture.md](active/v2-architecture.md) | V2 system architecture |

**Goal:** Ship production-ready SDK for external app integration

---

## Done

| Spec | Description |
|------|-------------|
| [v1-passkey-login.md](done/v1-passkey-login.md) | Initial passkey auth |
| [avatar-system.md](done/avatar-system.md) | Avatar selection |
| [nickname.md](done/nickname.md) | Nickname claiming |
| [auth-flow.md](done/auth-flow.md) | Authentication UX |
| [returning-user-flow.md](done/returning-user-flow.md) | Welcome back flow |
| [sdk-mlp-roadmap.md](done/sdk-mlp-roadmap.md) | Sprint 1-2 tracking |

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
| [villa-biometric-recovery-spec.md](reference/villa-biometric-recovery-spec.md) | Future: biometric recovery |
| [ui-component-rebuild.md](reference/ui-component-rebuild.md) | Future: component refresh |
