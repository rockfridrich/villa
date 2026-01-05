# Spec: developers.villa.cash Portal

**Status:** DRAFT
**Created:** 2026-01-05
**Inspired by:** [porto.sh](https://porto.sh), [porto.sh/sdk](https://porto.sh/sdk)

---

## Executive Summary

Developer documentation and SDK playground for Villa identity integration.
One domain, one mission: make Villa ID integration take <10 minutes.

**Domain:** `developers.villa.cash`
**Hosting:** DigitalOcean App Platform (same as villa.cash)
**DNS:** Cloudflare CNAME

---

## Information Architecture

```
developers.villa.cash/
├── /                    # Landing + hero + quickstart
├── /sdk                 # SDK reference (Porto-style sidebar)
├── /playground          # Live SDK demo (current sdk-demo page)
├── /examples            # Integration examples
└── /changelog           # Release notes
```

---

## Page Specifications

### 1. Landing Page (/)

**Hero Section**
```
┌─────────────────────────────────────────────────────────┐
│  Villa SDK                                              │
│                                                         │
│  One-prompt authentication for pop-up villages.         │
│  Passkeys. No passwords. Privacy-first.                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  > pnpm add @villa/sdk                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Get Started]  [View on GitHub]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Quickstart (4 steps)**
```
1. Install
   pnpm add @villa/sdk

2. Initialize
   import { Villa } from '@villa/sdk'
   const villa = new Villa({ appId: 'your-app' })

3. Authenticate
   const result = await villa.signIn()
   if (result.success) {
     console.log('Welcome,', result.identity.nickname)
   }

4. Ship it
   Your users now have Villa IDs. No passwords. Just passkeys.
```

**Feature Pillars (3 cards)**
| Feature | Description |
|---------|-------------|
| Privacy-first | Passkeys stay on device. We never see private keys. |
| One prompt | Full auth flow in a single `signIn()` call. |
| ENS compatible | Nicknames resolve like ENS. `alice.villa.eth` |

---

### 2. SDK Reference (/sdk)

**Sidebar Navigation (Porto-style)**
```
Getting Started
├── Installation
├── Quickstart
└── TypeScript

Guides
├── Authentication
├── Nicknames
├── Avatars
└── ENS Resolution

API Reference
├── Villa
│   ├── constructor
│   ├── signIn()
│   ├── signOut()
│   ├── getIdentity()
│   └── isAuthenticated()
├── ENS
│   ├── resolveEns()
│   └── reverseEns()
└── Avatar
    └── getAvatarUrl()

Components (React)
├── VillaAuth
├── NicknameSelection
└── AvatarSelection
```

**Code Block Style**
- Dark theme with syntax highlighting
- Copy button on hover
- Language label (tsx, bash)
- Tab variants for different frameworks

---

### 3. Playground (/playground)

**Split view layout**
```
┌──────────────────────┬──────────────────────┐
│  Interactive Demo    │  Console / Logs      │
│                      │                      │
│  [Auth] [Nickname]   │  > villa.signIn()    │
│  [Avatar] [ENS]      │  { success: true,    │
│                      │    identity: {...}   │
│  ┌────────────────┐  │  }                   │
│  │                │  │                      │
│  │  Component     │  │  > villa.signOut()   │
│  │  renders here  │  │  { ok: true }        │
│  │                │  │                      │
│  └────────────────┘  │                      │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

---

## Design System

**Colors (inherit from villa.cash)**
- Background: cream-50 (#fffcf8)
- Text: ink (#0d0d17)
- Accent: yellow (#ffe047)
- Code bg: ink (#0d0d17)

**Typography**
- Headlines: Serif (same as villa.cash)
- Body: Sans-serif
- Code: Monospace

**Spacing**
- Section padding: 64px (desktop), 32px (mobile)
- Card gap: 24px
- Code block padding: 16px

---

## Technical Implementation

### Routing Options

**Option A: Subdomain app (Recommended)**
- Separate Next.js app in `apps/developers/`
- Deploy to DigitalOcean as separate app
- DNS: `developers.villa.cash` → DO app

**Option B: Path-based in main app**
- Routes under `/developers/*` in `apps/web`
- Single deployment
- DNS: redirect `developers.villa.cash` → `villa.cash/developers`

**Decision: Option A** - cleaner separation, independent deploys

### DNS Setup
```bash
# Cloudflare DNS
CNAME developers villa-developers-xxxxx.ondigitalocean.app
```

### Package Exports
```typescript
// @villa/sdk - already exists
export { Villa } from './client'
export { VillaAuth } from './components' // move from web app
```

---

## Work Units

| WU | Description | Owner | Estimate |
|----|-------------|-------|----------|
| WU-1 | Create apps/developers scaffold | @build | S |
| WU-2 | Landing page (hero + quickstart) | @build | M |
| WU-3 | SDK reference with sidebar | @build | L |
| WU-4 | Playground (move sdk-demo) | @build | M |
| WU-5 | DNS + hosting setup | @ops | S |
| WU-6 | README + integration guide | @build | S |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first integration | <10 minutes |
| Docs page load | <2s |
| Lighthouse score | >90 |
| Bundle size | <100KB |

---

## Open Questions

1. Should playground require authentication or work with mock data?
2. Do we need versioned docs (v1, v2)?
3. API key registration for analytics?

---

## Appendix: Porto Design Patterns to Copy

1. **3-line install hero** - immediate clarity
2. **Numbered quickstart** - progressive disclosure
3. **Sidebar with chevrons** - hierarchical navigation
4. **Code tabs** - multiple framework options
5. **Live demo in docs** - try before you integrate
6. **Minimal nav** - SDK | API | Playground | GitHub
