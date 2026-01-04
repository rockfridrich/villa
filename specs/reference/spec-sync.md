# Spec Sync Workflow

**Problem:** User writes specs in Claude GUI (web interface) because it's easier for conversational development. Repo needs specs for AI agents to implement features.

**Solution:** Simple copy-paste workflow with clear conventions and merge patterns.

---

## Quick Start

```
Claude GUI (spec writing)
       ↓ copy-paste
This repo (implementation)
```

---

## Workflow: New Feature Spec

### 1. Draft in Claude GUI

**User:**
```
@spec "Create passkey onboarding flow"
```

**Claude GUI produces:**
- Full feature spec with Why, UI Boundaries, Acceptance Criteria, Tasks
- Conversational iteration until approved

### 2. Copy to Repo

**Copy entire spec content from Claude GUI**, then:

```bash
# Create spec file (use kebab-case)
touch specs/passkey-onboarding.md

# Paste content
# Add metadata header:
```

```markdown
# Feature: Passkey Onboarding

**Created:** 2026-01-04
**Source:** Claude GUI (Project: Villa)
**Status:** DRAFT → APPROVED → BUILDING → DONE
**Design:** [Figma link if exists]

[paste spec content from Claude GUI]
```

### 3. Commit

```bash
git add specs/passkey-onboarding.md
git commit -m "spec: add passkey onboarding flow"
```

### 4. Implement

```bash
# In repo terminal
@build "Implement specs/passkey-onboarding.md"
```

---

## Workflow: Update Existing Spec

### Scenario: Agent Discovers Edge Case

**Build agent (in repo):**
```
"Spec doesn't cover what happens if passkey creation fails after wallet exists"
```

**Options:**

#### Option A: Quick Fix (Minor Update)

Agent adds note to spec directly:

```markdown
## Edge Cases

### Passkey Creation Failure
- If wallet created but passkey fails → retry with same wallet
- Store wallet address before passkey creation
- [Discovered: 2026-01-04]
```

```bash
git commit -m "spec: add edge case for passkey failure"
```

#### Option B: Proper Revision (Major Update)

1. Copy updated requirement to Claude GUI
2. Iterate with @spec agent
3. Copy revised section back to repo
4. Update "Modified" metadata

```markdown
**Created:** 2026-01-04
**Modified:** 2026-01-04 (passkey failure handling)
```

---

## File Naming Conventions

| Spec Type | Naming | Example |
|-----------|--------|---------|
| Feature spec | `{feature-name}.md` | `passkey-onboarding.md` |
| Product spec | `product/{name}.product.md` | `product/identity-system.product.md` |
| Work breakdown | `{feature-name}.wbs.md` | `passkey-onboarding.wbs.md` |
| Tech spec | `tech/{name}.tech.md` | `tech/avatar-system.tech.md` |

**Rules:**
- Kebab-case for all file names
- No version numbers in file names (use git history)
- Suffix indicates spec type (`.product.md`, `.wbs.md`, `.tech.md`)

---

## Metadata Header Template

Every spec copied from Claude GUI should have:

```markdown
# {Spec Title}

**Created:** YYYY-MM-DD
**Source:** Claude GUI (Project: Villa)
**Status:** DRAFT | APPROVED | BUILDING | DONE
**Modified:** [if updated after creation]
**Design:** [Figma link]

[spec content]
```

---

## Example: Full Feature Lifecycle

### Phase 1: Specification (Claude GUI)

**User in Claude GUI:**
```
I want users to sign in with Face ID. Write a spec.
```

**@spec produces:**
```markdown
# Feature: Passkey Login

## Goal
Let users create or sign in using Face ID...

## Why This Approach
Porto SDK handles passkeys...

## UI Boundaries
- We control: Welcome screen, button styles
- Porto controls: Passkey prompts

## Acceptance Criteria
- AC-1: User can create passkey with biometric
- AC-2: User can sign in with existing passkey

## Out of Scope
- Custom biometric prompt styling
```

### Phase 2: Copy to Repo

**User copies spec, adds metadata:**

```markdown
# Feature: Passkey Login

**Created:** 2026-01-04
**Source:** Claude GUI (Project: Villa)
**Status:** APPROVED
**Design:** https://figma.com/...

[paste rest of spec]
```

**Commit:**
```bash
git add specs/passkey-login.md
git commit -m "spec: add passkey login flow"
```

### Phase 3: Implementation (Repo)

**User in repo terminal:**
```
@build "Implement specs/passkey-login.md"
```

**Agent works, discovers issue:**
```
"Spec doesn't handle offline passkey creation"
```

**Agent adds note directly in spec:**
```markdown
## Edge Cases

### Offline Creation
- Queue passkey, sync when online
- [Discovered: 2026-01-04 during implementation]
```

### Phase 4: Iterate (Back to Claude GUI if needed)

**If edge case requires major rework:**

1. Copy issue to Claude GUI
2. Iterate solution with @spec
3. Copy revised spec section back
4. Update metadata

```markdown
**Modified:** 2026-01-04 (offline handling)
```

---

## When to Use Which Environment

| Task | Environment | Why |
|------|-------------|-----|
| **New spec from scratch** | Claude GUI | Conversational iteration |
| **Spec revision (major)** | Claude GUI | Architecture decisions |
| **Implementation** | Repo | Access to codebase |
| **Quick spec fix** | Repo | No context switching |
| **Add edge case** | Repo | Discovered during build |
| **Review spec** | Either | Wherever it's open |

---

## Sync Anti-Patterns (Don't Do This)

### ❌ Don't: Maintain Duplicate Specs

**Problem:** Spec exists in both places, gets out of sync

**Solution:** Repo is source of truth. Claude GUI is drafting tool.

### ❌ Don't: Version Specs in File Names

**Problem:** `passkey-login-v1.md`, `passkey-login-v2.md`

**Solution:** Use git history. One file per feature.

### ❌ Don't: Commit Half-Baked Specs

**Problem:** Spec incomplete but committed to repo

**Solution:** Only commit when Status = APPROVED

### ❌ Don't: Forget Metadata Header

**Problem:** Spec has no creation date, source, or status

**Solution:** Always add metadata when copying from Claude GUI

---

## Merge Patterns

### Pattern 1: Spec First, Code Second

```
Claude GUI: Write spec
    ↓ copy-paste
Repo: Commit spec
    ↓
Repo: @build implements
    ↓
Repo: @ops commits code
```

### Pattern 2: Discover While Building

```
Repo: @build working
    ↓
Repo: Discovers edge case
    ↓ (if minor)
Repo: Add note to spec
    ↓ (if major)
Claude GUI: Iterate solution
    ↓
Repo: Update spec, continue build
```

### Pattern 3: Product + Tech Specs

```
Claude GUI: Write product spec (JTBD, UX)
    ↓ copy-paste
Repo: specs/product/{name}.product.md
    ↓
Claude GUI: Write tech spec (API, data model)
    ↓ copy-paste
Repo: specs/tech/{name}.tech.md
    ↓
Repo: @architect creates WBS
    ↓
Repo: Multiple @build agents implement
```

---

## Tools for Syncing

### Copy-Paste (Primary Method)

**Pros:**
- Simple, no tools required
- Works with any Claude interface
- Human reviews content during transfer

**Cons:**
- Manual process
- Can forget metadata

### Future: Automated Export (Not Yet Built)

Possible future improvements:
- Claude GUI export button → markdown file
- GitHub Action to validate spec format
- Auto-generate WBS from product spec

**For now:** Copy-paste is fine. Don't over-engineer.

---

## Validation Checklist

Before committing spec from Claude GUI, check:

- [ ] Metadata header present (Created, Source, Status)
- [ ] File name is kebab-case
- [ ] Status is APPROVED (not DRAFT)
- [ ] Design link added (if exists)
- [ ] "Why This Approach" section present
- [ ] "UI Boundaries" section present
- [ ] "Out of Scope" section present
- [ ] Language Guidelines defined (if external systems involved)

---

## Related Documents

- **specs/tech/README.md** - Tech spec structure and purpose
- **specs/product/{feature}.product.md** - Product spec examples
- **.claude/agents/spec.md** - @spec agent definition
- **.claude/agents/architect.md** - @architect agent (creates WBS)

---

## TL;DR

1. **Draft in Claude GUI** - Easier for conversation
2. **Copy-paste to repo** - Add metadata header
3. **Commit when APPROVED** - Not before
4. **Minor updates in repo** - No need to go back to GUI
5. **Major revisions in GUI** - Then copy updated section back
6. **Repo is source of truth** - Claude GUI is drafting tool

**Workflow:**
```
Claude GUI (draft) → Repo (commit) → Build (implement) → Discover (update)
                                                              ↓
                                               If major: back to Claude GUI
                                               If minor: update in repo
```
