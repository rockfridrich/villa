# Development Learnings

Accumulated knowledge from development sessions. Used to improve specs, agents, and workflows.

---

## Session: 2026-01-03 — Porto SDK Integration

### What Happened

1. **Initial spec** said "use Porto SDK" but didn't explain why
2. **First implementation** used Porto via Wagmi → showed web3 wallet dialog
3. **User feedback**: wanted simple passkey, not web3 wallet
4. **Pivot #1**: Switched to native WebAuthn (deleted Porto)
5. **User feedback**: wanted real wallet addresses, Porto recovery
6. **Pivot #2**: Back to Porto SDK with correct understanding
7. **Final implementation**: Porto SDK with Villa theming, separate create/sign-in flows

### Time Cost

| Phase | Time |
|-------|------|
| Initial Porto implementation | 15 min |
| Native WebAuthn detour | 20 min |
| Porto re-implementation | 15 min |
| Theming + UX improvements | 20 min |
| **Total** | **70 min** |
| **Optimal (no pivots)** | **~35 min** |

### Root Causes of Pivots

1. **Spec didn't explain "Why Porto"** — alternatives not considered
2. **UI boundaries unclear** — what Porto controls vs Villa
3. **Assumed user intent** — implemented before clarifying

### Learnings Applied

#### 1. Specs Must Include "Why This Approach"

**Before:**
```markdown
## Technical Approach
Use Porto SDK for passkey authentication.
```

**After:**
```markdown
## Why Porto SDK (Not Native WebAuthn)

1. **Real wallet addresses** — Porto creates actual Ethereum accounts
2. **Passkey management** — Porto handles storage, sync, recovery
3. **Single canonical ID** — Wallet address is user ID across services
4. **Recovery built-in** — Social, email, OAuth recovery paths
```

#### 2. Specs Must Define UI Boundaries

Added to spec:
```markdown
### UI Boundaries

**Villa controls:**
- Welcome screen, profile setup, home screen
- Error messages and retry flows

**Porto controls (security-critical):**
- Passkey creation/authentication prompts
- Transaction signing UI
- Key management
```

#### 3. Ask Before Pivoting

When user says "I want X instead of Y":
- Ask: "You want X because...?"
- Update spec first
- Get approval
- Then implement

#### 4. Minimal Implementation First

Instead of building full flow:
1. Implement core connection only
2. Test: Does it meet expectations?
3. Then add UI, error handling, etc.

### Porto SDK Discoveries

**Theming:**
- `ThemeFragment` with 60+ color tokens
- Supports `light`, `dark`, `light dark` schemes
- `Dialog.createThemeController()` for runtime updates

**Flows:**
- `wallet_connect` — Porto decides create vs sign-in
- `eth_requestAccounts` — Prompts passkey selection
- No explicit "create account" RPC, but Porto shows create UI for new users

**Dialog modes:**
- `Dialog.popup()` — Separate window
- `Dialog.iframe()` — Embedded iframe
- `Dialog.experimental_inline()` — Inline in page element

**Security boundaries:**
- Passkey operations must go through Porto
- Can customize colors/labels, not security-critical UI
- Never intercept private key operations

---

## Patterns to Apply

### For Future Specs

```markdown
## Why [Approach]

Explain why this approach over alternatives:
- Alternative A: [why not]
- Alternative B: [why not]
- Chosen approach: [why yes]

## UI Boundaries

What we control:
- [list]

What external system controls:
- [list]

## Out of Scope

Explicitly list what this spec does NOT cover.
```

### For Implementation

1. Read spec completely before writing code
2. If spec is unclear, ask questions or update spec first
3. Implement minimal version, validate, then expand
4. When pivoting, update spec before changing code

### For Agents

- **spec agent**: Must include "Why" and "UI Boundaries" sections
- **build agent**: Must check spec clarity before implementing
- **review agent**: Must verify implementation matches spec intent, not just letter

---

## Metrics to Track

| Metric | Target | This Session |
|--------|--------|--------------|
| Pivots per feature | 0-1 | 2 |
| Time to first working version | <30 min | 50 min |
| Spec clarity score (1-5) | 5 | 3 (missing Why) |
| Rework percentage | <20% | 40% |

---

## Open Questions

1. Should we use `Dialog.experimental_inline()` for more integrated UX?
2. How to handle Porto being unavailable (network issues)?
3. Should we capture email during account creation for recovery?

---

*Last updated: 2026-01-03*
