# Sprint 4: SDK Screens & Developer Portal

**Duration:** 2026-01-07 to 2026-01-13
**Goal:** Complete SDK auth screens and developers portal navigation

---

## Sprint Objectives

1. **SDK Auth Screens** - SignInWelcome, NicknameSelection, ConsentRequest
2. **Developer Portal** - Sidebar navigation and mobile menu
3. **More shadcn/ui** - Alert, Badge, DropdownMenu components
4. **Test Stability** - Fix flaky E2E tests (navigation/redirect)

---

## Priority Matrix

| Priority | Item | Owner | Status |
|----------|------|-------|--------|
| P0 | SignInWelcome screen | @build | DONE |
| P0 | NicknameSelection screen | @build | DONE |
| P0 | ConsentRequest screen | @build | DONE |
| P1 | Sidebar navigation | @build | DONE |
| P1 | Mobile nav drawer | @build | DONE |
| P1 | Alert component | @build | DONE |
| P1 | Badge component | @build | DONE |
| P1 | DropdownMenu component | @build | DONE |
| P1 | ENS name display on home | @build | DONE |
| P1 | Design token semantic colors | @build | DONE |
| P2 | Fix flaky E2E tests | @test | BACKLOG |

---

## Work Units (Parallel Streams)

### Stream A: SDK Auth Screens
**Owner:** @build (Terminal 1)
**Files:** `apps/web/src/components/sdk/`
**Dependencies:** None - can start immediately

Components to create:
1. `SignInWelcome.tsx` - Welcome screen with sign-in/create buttons
2. `NicknameSelection.tsx` - Nickname input with validation
3. `ConsentRequest.tsx` - Permission grant screen

### Stream B: Developer Portal Navigation
**Owner:** @build (Terminal 2)
**Files:** `apps/developers/src/`
**Spec:** `specs/sprint-3/developers-polish.md`

Components to create:
1. `Sidebar.tsx` - Fixed sidebar with section links
2. `MobileNav.tsx` - Hamburger menu with drawer

### Stream C: shadcn/ui Components
**Owner:** @build (Terminal 3)
**Files:** `apps/web/src/components/ui/`

Components to add:
1. `alert.tsx` - Feedback messages
2. `badge.tsx` - Status indicators
3. `dropdown-menu.tsx` - Action menus

---

## File Ownership Matrix

| Stream | Creates | Modifies | Read-Only |
|--------|---------|----------|-----------|
| A | `SignInWelcome.tsx`, `NicknameSelection.tsx`, `ConsentRequest.tsx` | `sdk/index.ts` | - |
| B | `Sidebar.tsx`, `MobileNav.tsx` | `layout.tsx`, `page.tsx` | - |
| C | `alert.tsx`, `badge.tsx`, `dropdown-menu.tsx` | `ui/index.ts` | - |

**No conflicts** - Each stream owns distinct files.

---

## SDK Screens Spec

### SignInWelcome
```
┌──────────────────────────────────┐
│           Villa logo             │
│                                  │
│   Welcome to Villa               │
│   Your identity, your way        │
│                                  │
│   ┌────────────────────────┐     │
│   │   Create Villa ID      │     │  ← Primary CTA
│   └────────────────────────┘     │
│                                  │
│   Already have an ID?            │
│   ┌────────────────────────┐     │
│   │      Sign In           │     │  ← Secondary
│   └────────────────────────┘     │
│                                  │
│   Powered by Porto               │
└──────────────────────────────────┘
```

### NicknameSelection
```
┌──────────────────────────────────┐
│   ←  Choose your nickname        │
│                                  │
│   ┌────────────────────────────┐ │
│   │ @ |alice                   │ │  ← Input with @ prefix
│   └────────────────────────────┘ │
│   ✓ Available                    │  ← Availability check
│                                  │
│   Your nickname is your identity │
│   on Villa. Choose wisely!       │
│                                  │
│   ┌────────────────────────┐     │
│   │      Continue          │     │
│   └────────────────────────┘     │
└──────────────────────────────────┘
```

### ConsentRequest
```
┌──────────────────────────────────┐
│   AppName wants to access        │
│                                  │
│   ┌──────────────────────────┐   │
│   │ ○ Your nickname (@alice) │   │
│   │ ○ Your avatar            │   │
│   │ ○ Your address           │   │
│   └──────────────────────────┘   │
│                                  │
│   This app can read your public  │
│   profile information.           │
│                                  │
│   ┌───────────┐ ┌───────────┐    │
│   │  Deny     │ │  Allow    │    │
│   └───────────┘ └───────────┘    │
└──────────────────────────────────┘
```

---

## Success Criteria

- [x] 3 SDK auth screens implemented
- [x] Developers portal has working sidebar
- [x] Mobile nav drawer functional (synced with sidebar nav items)
- [x] 3 new shadcn components added (Alert, Badge, DropdownMenu)
- [x] Design tokens for semantic colors (error, success, warning)
- [x] ENS name display on home page with copy functionality
- [ ] E2E test pass rate >90%
- [ ] Deployed to beta.villa.cash

---

## Test-First Approach

1. Write component unit test (Vitest)
2. Write E2E test (Playwright)
3. Implement component
4. Verify tests pass
5. Commit

---

## Dependencies

| This Sprint | Depends On |
|-------------|------------|
| SDK Screens | Sprint 3 Lottie animations |
| Sidebar | Sprint 3 shadcn Tabs |
| Badge | Villa design tokens |

---

## Links

- SDK Roadmap: `specs/active/sdk-external-roadmap.md`
- Auth Flow Spec: `specs/active/auth-flow.md`
- Developers Polish: `specs/sprint-3/developers-polish.md`
- Design Principles: `specs/reference/design-principles.md`
