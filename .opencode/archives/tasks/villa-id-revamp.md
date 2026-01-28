# Villa ID Revamp - Autonomous Run

## Tasks
```
villa-393: Self-hosted Porto dialog (P0) ← START
    ↓
villa-6jq: Unified UI package
    ↓
villa-23p: Porto-identical dialog UX
    ↓
villa-2uj: Docs landing page
```
Parallel: villa-7bc (SDK abstraction) after villa-393

---

## Phase 1: Passkey Bulletproofing [villa-393]

**Architecture:**
```
villa.cash → Mode.dialog({ host: 'key.villa.cash/auth' })
                  ↓
key.villa.cash/auth → Mode.rpcServer({ keystoreHost: 'key.villa.cash' })
                  ↓
            1Password intercepts ✓
```

**Files:**
- `apps/hub/src/lib/porto.ts` → dialog host to key.villa.cash/auth
- `apps/key/src/lib/porto.ts` → Mode.rpcServer
- `apps/key/src/app/auth/page.tsx` → handle RPC

---

## Phase 2: UI Package [villa-6jq]

```
packages/ui/src/
├── theme/colors.ts
├── components/Button.tsx, Dialog.tsx, PasskeyPrompt.tsx, Logo.tsx
└── index.ts
```

Theme: `accent: '#ffe047'`, `baseBackground: '#fffcf8'`, `frameRadius: 14`

---

## Phase 3: Dialog UX [villa-23p]

- Size: 380×520px (Porto exact)
- States: idle → loading → passkey → success/error
- Minimal: white bg, logo top, simple spinner

---

## Phase 4: Docs Landing [villa-2uj]

Delete all pages. Single landing:
1. Hero: "Sign in with superpowers"
2. npm install + 3-line code
3. 4 feature cards
4. CTA footer

---

## Phase 5: SDK Abstraction [villa-7bc]

```typescript
villa.signIn()       // hides wallet_connect
villa.getProfile()   // hides ENS
villa.uploadAvatar() // hides TinyCloud
```

---

## Per-Phase
```bash
bun typecheck && bun lint && bun build
git commit -m "feat(<scope>): <msg>"
bd close villa-xxx
```

## If Stuck 2x
```bash
bd update villa-xxx --assignee=claude-code --notes="Stuck: ..."
```
