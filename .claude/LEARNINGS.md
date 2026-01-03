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

---

## Session: 2026-01-03 — Docker Setup & Security Hardening

### What Happened

1. **Docker testing blocked** — Colima VM download (~500MB) repeatedly failed due to network
2. **Pivoted to productive work** — Used blocked time for Caddy security review
3. **Applied security headers** — Enhanced Caddyfile with HSTS, CSP, etc.
4. **Generated debugging guide** — Created comprehensive Docker/Colima guide in-chat
5. **Token inefficiency identified** — Background task output consumed 500KB+ of context

### Time & Token Cost

| Task | Time | Token Impact |
|------|------|--------------|
| Colima download attempts | 30+ min | **High** (verbose progress output) |
| Caddy security research | 10 min | Medium (web fetches) |
| Security headers | 5 min | Low |
| Docker guide generation | 15 min | **High** (regenerated in-chat) |

### Root Causes of Inefficiency

1. **No quiet mode for Colima** — Progress output flooded context
2. **Guides generated per-session** — Same content repeated across sessions
3. **No pre-flight checks** — Discovered Docker issues mid-task
4. **Context switching** — Jumped between Docker/Security/Docs

### Learnings Applied

#### 1. Use Quiet Commands for Background Tasks

**Before:**
```bash
colima start  # Outputs 500KB of progress
```

**After:**
```bash
colima start 2>&1 | tail -5  # Only final status
# Or check status separately
colima status
```

#### 2. Persist Guides in Repo, Not Chat

**Before:** Generate Docker debugging guide in conversation (high token cost, lost after session)

**After:** Create `.claude/workflows/docker-debug.md` once, reference thereafter

#### 3. Pre-flight Checks Before Docker Work

```bash
# Add to scripts/preflight.sh
colima status > /dev/null 2>&1 || { echo "Start Colima first: colima start"; exit 1; }
docker info > /dev/null 2>&1 || { echo "Docker not connected"; exit 1; }
```

#### 4. Batch Related Tasks

**Before:** Docker → Security → Docker → Commit (context switches)

**After:**
- All Docker tasks together
- All security tasks together
- Single commit per logical change

### Security Discoveries

**Caddy Artifact Signing:**
- Uses Sigstore (since v2.6.0)
- Verify with: `cosign verify-blob`
- Check transparency log with: `rekor-cli`

**Security Headers Added:**
- HSTS with preload
- X-Content-Type-Options
- X-Frame-Options DENY
- Permissions-Policy (disable unused APIs)
- Remove Server header

### Workflow Optimizations

| Optimization | Benefit |
|--------------|---------|
| `.claude/workflows/` directory | Persistent guides, lower token cost |
| `scripts/preflight.sh` | Catch issues before work starts |
| Quiet background commands | Reduce context pollution |
| Batch similar tasks | Fewer context switches |

---

## Patterns to Apply

### For Docker/Infra Work

1. Run pre-flight checks first
2. Use quiet/minimal output modes
3. Document solutions in repo, not chat
4. Test incrementally, not all-at-once

### For Token Efficiency

1. Reference existing docs instead of regenerating
2. Use `tail -n` for long outputs
3. Kill background tasks that produce verbose output
4. Prefer haiku for research, opus for implementation

---

---

## Session: 2026-01-03 — Session Behavior & UX Patterns

### What Happened

1. **Sign-out didn't force re-auth** — Porto caches session, passkey auto-selects
2. **User expected passkey prompt** — but got seamless re-authentication
3. **Researched Porto TTLs** — not documented, server-side controlled
4. **Reframed as feature** — "Switch Account" with helper text explaining persistence

### Key Insight

Passkey sessions behave like biometric unlock on mobile apps—the device "remembers" you. This is good UX, but needs clear communication.

### Learnings Applied

#### 1. Specs Must Document Session Behavior

Added to spec template:
- Session Persistence table (what, TTL, who controls)
- Copy Standards table (button text + helper text)
- "What We Cannot Control" section

#### 2. Copy Should Match Mental Model

| Wrong | Right | Why |
|-------|-------|-----|
| "Sign Out" | "Switch Account" | Passkey stays active |
| (no helper) | "Your passkey stays active for quick sign-in" | Set expectations |

#### 3. When External System Controls Behavior, Document Limits

Porto controls:
- Session TTL (~24h+, not configurable)
- Passkey credential lifetime (device OS)
- Dialog labels (not yet in SDK types)

### Files Updated

- `specs/v1-passkey-login.md` — Added Session Behavior section
- `.claude/agents/spec.md` — Added Section 8: Session & UX Patterns
- `src/lib/porto.ts` — Documented session behavior in code
- `src/app/home/page.tsx` — "Sign Out" → "Switch Account" + helper text

---

## Session: 2026-01-03 — Successful Agent Workflow (Reference)

### What Went Well

This session demonstrated the ideal agent workflow with minimal pivots:

```
1. User clarified UX intent → "Villa ID", Sign In primary
2. @spec updated with Language Guidelines, Copy Standards
3. @build implemented changes (4 tasks in one pass)
4. @review approved with 1 non-blocking item
5. Cleanup applied immediately
6. All 14 tests pass
```

**Time: ~15 min from spec to shipped code**

### Workflow That Worked

| Step | Action | Result |
|------|--------|--------|
| 1. Clarify intent first | User said "Sign In primary, Villa ID branding" | Clear direction |
| 2. Update spec before code | Added Language Guidelines table | Build agent had exact copy |
| 3. Build agent does implementation | Single pass, 4 tasks | No back-and-forth |
| 4. Review agent catches cleanup | Unused prop flagged | Immediate fix |
| 5. Commit after each phase | spec → build → cleanup | Clear git history |

### Patterns to Repeat

1. **Language Guidelines table in spec** — Maps internal terms to user-facing copy
2. **Copy Standards table** — Exact button text + helper text
3. **Sign In always primary** — Don't over-engineer detection logic
4. **Review agent catches dead code** — Use it after every build

### Spec Template Addition

```markdown
### Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| [Technical term] | [User term] |
```

This prevents "Porto" leaking into UI, or other internal jargon.

---

## Remaining Work: Deployment

### Blocked
- Docker testing (Colima download issues)
- DigitalOcean App Platform setup

### Next Session Priorities
1. Get Colima/Docker working
2. Set up DigitalOcean App Platform
3. Configure GitHub → DO deployment hooks
4. Feature branch → preview deployments
5. Main branch → production deployment

### DigitalOcean Setup Needed
- App Platform app creation
- GitHub integration
- Environment variables (none for v1, but structure needed)
- Domain configuration (proofofretreat.me?)
- Auto-deploy on push

---

*Last updated: 2026-01-03*
