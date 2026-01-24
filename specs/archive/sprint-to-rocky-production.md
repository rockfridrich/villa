# Sprint: To Rocky Production

**Created:** 2026-01-08
**Status:** Active
**Goal:** Get ecosystem integration back, enjoy SDK, share with Popup Village communities

---

## Why This Sprint

Villa beta works. SDK is published. But we're not having fun with it yet.

**The problem:** We've been heads-down building infrastructure. Now it's time to:
1. Actually use what we built
2. Share it with communities who want it
3. Get real-world feedback before mainnet

**The opportunity:** Popup Village communities (Proof of Retreat, etc.) need simple auth. We have it. Let's connect them.

---

## Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Partner apps using SDK | 2+ | 0 |
| SDK weekly downloads | 50+ | ~10 |
| Demo apps live | 2+ | 1 (sdk-demo) |
| React hooks package | Published | Not started |
| Community feedback sessions | 2+ | 0 |

---

## Workstreams

### W1: SDK Distribution (P0)

**Goal:** Make SDK dead-simple for external devs

| Task | Owner | Status |
|------|-------|--------|
| Publish `@rockfridrich/villa-sdk-react` | @build | TODO |
| Create 3-minute quickstart video | Human | TODO |
| Add "Copy code" buttons to docs | @build | TODO |
| SDK example: Next.js app | @build | TODO |
| SDK example: Plain HTML/JS | @build | TODO |

**React Hooks Package MVP:**
```typescript
// Target API
import { VillaProvider, useVilla, useIdentity } from '@rockfridrich/villa-sdk-react'

function App() {
  return (
    <VillaProvider appId="my-app">
      <LoginButton />
    </VillaProvider>
  )
}

function LoginButton() {
  const { signIn, signOut, isAuthenticated } = useVilla()
  const identity = useIdentity()

  if (identity) {
    return <button onClick={signOut}>Logout @{identity.nickname}</button>
  }
  return <button onClick={signIn}>Sign in with Villa</button>
}
```

### W2: Ecosystem Integrations (P0)

**Goal:** Get 2+ partner apps live

| Partner | Contact | Status | Notes |
|---------|---------|--------|-------|
| Proof of Retreat - Residents | Rocky | TODO | Simple member directory |
| Proof of Retreat - Map | Rocky | TODO | Location check-ins |
| Popup Village Network | TBD | TODO | Community discovery |
| Gitcoin Passport | TBD | Backlog | Credential aggregation |

**Integration Template:**
```markdown
## Partner: [Name]
- Contact: [Person]
- Use case: [Brief description]
- SDK scopes needed: [profile | wallet | both]
- Timeline: [Week of...]
- Blockers: [None | List]
```

### W3: Developer Portal Polish (P1)

**Goal:** developers.villa.cash is the best Web3 auth docs

| Task | Owner | Status |
|------|-------|--------|
| Add live code playground | @build | TODO |
| Improve mobile navigation | @design | TODO |
| Add "Apps using Villa" showcase | @build | TODO |
| SDK changelog page | @build | TODO |
| Community Discord/Telegram link | Human | TODO |

### W4: Demo Apps (P1)

**Goal:** Show don't tell

| Demo | Purpose | Status |
|------|---------|--------|
| sdk-demo (existing) | Basic auth flow | Live |
| guestbook | Simple CRUD with identity | TODO |
| tipping | Send ETH to @nicknames | TODO |
| polls | Anonymous voting with Villa ID | Backlog |

**Guestbook Demo Spec:**
- Sign in with Villa
- Post a message (stored in Supabase or similar)
- See who posted (nickname + avatar)
- < 200 lines of code
- Deploy to Vercel

### W5: Glide Integration (P2)

**Goal:** Cross-chain deposits working

| Task | Owner | Status |
|------|-------|--------|
| Get Glide project ID | Human | BLOCKED |
| Replace villa-dev placeholder | @build | TODO |
| Test with real tokens (testnet) | @test | TODO |
| Production launch | @ship | TODO |

**Blocker:** Need to sign up at buildwithglide.com and get project ID

---

## Non-Goals (This Sprint)

- Mainnet deployment (blocked by security audit)
- Custom passkey domain (Phase 2)
- TinyCloud custom avatars
- CCIP-Read full implementation
- Solana support

---

## Timeline

**Week 1: Foundation**
- [ ] Publish villa-sdk-react
- [ ] Create Next.js example app
- [ ] Reach out to Proof of Retreat team

**Week 2: Integration**
- [ ] First partner app live with SDK
- [ ] Guestbook demo deployed
- [ ] Developer portal improvements

**Week 3: Expansion**
- [ ] Second partner app live
- [ ] Community feedback session
- [ ] Iterate based on feedback

**Week 4: Polish**
- [ ] All demos polished
- [ ] Documentation complete
- [ ] Glide integration (if ID obtained)

---

## Decisions Needed (Human Input)

1. **Proof of Retreat contact:** Who to reach out to for integration?
2. **Community channel:** Discord or Telegram for SDK users?
3. **Demo hosting:** Vercel free tier OK or need dedicated?
4. **Glide signup:** Who signs up for Glide project?

---

## Resources

- SDK: https://www.npmjs.com/package/@rockfridrich/villa-sdk
- Developer Portal: https://developers.villa.cash
- Beta App: https://beta.villa.cash
- Production Roadmap: specs/active/production-roadmap.md

---

## Daily Check-in

```
Morning:
- [ ] Which workstream am I focusing on?
- [ ] Any blockers from yesterday?
- [ ] Who do I need to sync with?

Evening:
- [ ] What shipped today?
- [ ] Any new blockers discovered?
- [ ] What's tomorrow's focus?
```

---

*Sprint motto: "Ship joy, not just features"*
