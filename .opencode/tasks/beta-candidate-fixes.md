# Beta Candidate Fixes - QA Feedback

## Version Note
**NOT v2.0.0** - This is a beta candidate. Revert to proper semver:
- Current: Should be `v0.x.x` or `v1.0.0-beta.1`
- Production mainnet = `v1.0.0`
- Until then: `v0.x.x` or `beta` tags

---

## Critical UX Fixes

### 1. SDK Popup Loading Screen [P0]
**Issue:** Splash popup is fullscreen, should be popup-sized loading
**Fix:**
- Loading state should match popup dimensions (380×520px)
- Protect user attention - no fullscreen takeover
- Accessibility: focus trap, escape to close

### 2. Iframe Content Centering [P0]
**Issue:** Content not centered properly in iframe
**Fix:** Center content vertically and horizontally in 380×520 container

### 3. Passkey Naming [P0]
**Issue:** Multiple passkeys hard to identify
**Fix:**
- Name: "Your Villa Key"
- RP Name: "Villa" (shows in password managers)
- Domain: key.villa.cash
- Add metadata: timestamp, device info if available

### 4. Prevent Double Passkey Creation [P0]
**Issue:** Can create duplicate passkeys for same address
**Fix:**
- Check Porto `wallet_getAccounts` before creation
- If existing account found → show "Sign In" instead
- Add explainer stage before passkey creation
- Keep it lean - one screen, clear choice

### 5. Post-Creation Flow [P0]
**Issue:** Nothing happens after account creation sign-in
**Fix:**
- Redirect to success → then callback to parent
- Show brief "Welcome!" then auto-close popup
- Ensure postMessage fires correctly

### 6. Random Name Generation [P1]
**Issue:** Names should be Vietnam animals + adjective
**Fix:**
- Format: `{Adjective}{VietnamAnimal}` (PascalCase)
- Examples: SwiftBuffalo, GentlePangolin, BraveMacaque
- Editable later in settings

### 7. Avatar Generation Explainer [P1]
**Issue:** No explanation of how avatar is created
**Fix:**
- Brief tooltip or text: "Generated from your unique key"
- Deterministic from address (reproducible)

### 8. Settings Popup UX & Persistence [P0]
**Issue:** Settings popup needs proper design, UX, and persistence
**Fix:**
- Match Porto-identical design (380×520px, centered)
- Nickname editing with validation
- Avatar selection/regeneration
- Persist changes to database immediately
- Sync state between popup and parent window
- Loading states for save operations
- Error handling with retry

---

## Nickname & Domain Architecture [P0]

### 9. ENS-Compatible Nickname System
**Architecture:**
```
Nickname Storage (Two-Tier):

1. Database (Default - Free)
   - nickname stored in Villa DB
   - domain: nickname.villa.cash (resolved via API)
   - integrity via DB + backup storage
   - can be changed anytime

2. On-Chain ENS (Claimed - Paid)
   - nickname.villa.cash registered on Base ENS
   - immutable, user owns it
   - resolved via ENS protocol
   - "Claim Nickname" = pay to register on-chain
```

**Flow:**
```typescript
// Check nickname availability
villa.nickname.check('SwiftBuffalo')
// → { available: true, claimable: true }

// Reserve in DB (free, default)
villa.nickname.reserve('SwiftBuffalo')
// → stored in DB, domain works via API

// Claim on-chain (paid, permanent) - COMING SOON
villa.nickname.claim('SwiftBuffalo')
// → triggers ENS registration on Base
// → user pays gas + registration fee
```

**Domain Resolution:**
```typescript
villa.profile.domain // "swiftbuffalo.villa.cash"

// Resolution priority:
// 1. Check on-chain ENS first
// 2. Fallback to DB lookup
// 3. Return null if not found
```

**Database + Backup Strategy:**
- Primary: PostgreSQL (Railway)
- Backup: TinyCloud (user-controlled, encrypted)
- Sync: Write to both, read from fastest
- Integrity: Hash verification on read

**UI for "Claim Nickname" (Coming Soon):**
- Show "Reserved" badge for DB nicknames
- Show "Claimed ✓" badge for on-chain
- "Claim Forever" button → payment flow
- Price: TBD (gas + small fee)

---

## Docs Site Fixes

### 8. Settings Not Opening [P0]
**Issue:** Settings button on docs page doesn't work
**Fix:** Debug click handler, ensure modal opens

### 9. Search Overlap [P0]
**Issue:** Search UI overlaps, unusable
**Fix:** Z-index, positioning, ensure full functionality

### 10. Read Docs 404 [P0]
**Issue:** Playground "Read docs" link broken
**Fix:** Update href to correct path

### 11. Architecture Page [P1]
**Issue:** Should be nerdy technical deep-dive
**Content:**
- All apps (hub, key, docs, sdk)
- Design guidelines and why they matter
- Pop-up villages philosophy
- Web3 perspective and Base network choice
- Passkey security model

### 12. Ecosystem Page [P1]
**Issue:** Too many links
**Fix:** Keep only Proof of Retreat main website for now

### 13. Remove Contributors & Metrics [P1]
**Fix:** Delete these pages from navigation and routes

### 14. Examples Improvement [P2]
**Issue:** Not interactive enough
**Fix:**
- Direct code references
- Ability to trigger SDK actions inline
- Live playground integration

### 15. SDK Reference [P2]
**Issue:** Needs diagrams, versions, better type docs
**Fix:**
- Add architecture diagrams
- Show package versions with links
- Improve TypeScript JSDoc comments
- Better exports documentation

---

## SDK API Redesign

### 16. Remove appId Requirement [P0]
**Current:** `villa.init({ appId: '...' })`
**New:** Auto-detect from HTTPS origin, attach security hash
```typescript
// No appId needed
const user = await villa.signIn()
```

### 17. Network Abstraction [P0]
**Issue:** Users shouldn't know about Base/Sepolia
**Fix:**
- Hide chain details completely
- SDK target: 'beta' | 'production'
- Beta = Sepolia, Production = Mainnet
- No user-facing network switching

### 18. API URL Abstraction [P0]
**Issue:** API URL shouldn't be configurable
**Fix:**
```typescript
// Only this config
Villa.init({ target: 'beta' }) // or 'production'
// URLs determined internally
```

### 19. Login Tracking [P1]
**Issue:** Need local login history
**Fix:**
- Track last 50 logins in TinyCloud
- Per-user, encrypted
- Useful for security audit

### 20. Debug Mode Review [P1]
**Issue:** Debug logs need security review
**Fix:**
- Never log sensitive data (keys, signatures)
- AI-friendly log format
- Easy to enable/disable
- Consider log levels: error, warn, info, debug

### 21. Profile Scope Design [P1]
**Design:**
```typescript
// Nickname Scope (public)
villa.profile.nickname
villa.profile.avatar
villa.profile.domain // nickname.villa.cash

// Wallet Scope (requires permission)
villa.wallet.address // read-only
villa.wallet.proposeTransaction(tx) // returns signature request
```

### 22. Avatar Abstraction [P1]
**Issue:** Seed exposed, storage unclear
**Fix:**
```typescript
// Returns URL only
villa.profile.avatar // "https://cdn.villa.cash/avatars/0x..."

// Internal: SVG/PNG stored in TinyCloud, CDN proxied
// Seed abstracted - deterministic from address
```

### 23. Nickname + Domain [P1]
**Design:**
```typescript
villa.profile.nickname // "SwiftBuffalo"
villa.profile.domain   // "swiftbuffalo.villa.cash"

// If user claims ENS on Base:
villa.profile.domain   // "custom.villa.cash" (on-chain)
```

### 24. Social Features [P2]
**Principle:** Nickname is unique identifier for social
```typescript
// Lookup by nickname
const profile = await villa.getProfile({ nickname: 'SwiftBuffalo' })

// Address is secondary, nickname is primary
```

---

## Developer Experience

### 25. Avatar Config Optimization [P2]
**Review:** Current avatar config for efficiency

### 26. Hooks for Developers [P2]
**Design based on debugging learnings:**
```typescript
villa.on('auth:start', () => {})
villa.on('auth:success', (user) => {})
villa.on('auth:error', (error) => {})
villa.on('auth:cancel', () => {})
villa.on('session:expired', () => {})
```

### 27. Migration Guides [P2]
**Create:**
- Porto → Villa migration
- Privy → Villa migration
- Reown → Villa migration

---

## Task Breakdown

### Phase 1: Critical UX (P0) - 8 items
1. Popup loading size
2. Iframe centering
3. Passkey naming
4. Prevent double creation
5. Post-creation flow
6. Settings not opening
7. Search overlap
8. Read docs 404

### Phase 2: SDK API (P0-P1) - 9 items
9. Remove appId
10. Network abstraction
11. API URL abstraction
12. Login tracking
13. Debug mode review
14. Profile scope design
15. Avatar abstraction
16. Nickname + domain
17. Social features design

### Phase 3: Docs Content (P1-P2) - 6 items
18. Architecture page
19. Ecosystem cleanup
20. Remove contributors/metrics
21. Examples improvement
22. SDK reference diagrams
23. Migration guides

### Phase 4: Names & Polish (P1) - 3 items
24. Vietnam animal names
25. Avatar explainer
26. Hooks design

---

## Semantic Versioning Fix

```bash
# Delete incorrect tag
git tag -d v2.0.0
git push origin :refs/tags/v2.0.0

# Create correct beta tag
git tag v0.9.0-beta.1 -m "Beta candidate - Villa ID Revamp"
git push --tags
```

**Version Strategy:**
- `v0.9.x-beta.x` - Current (Sepolia, testing)
- `v1.0.0-rc.x` - Release candidates
- `v1.0.0` - Production mainnet launch
