# Contributor Preferences System

This document defines how contributor preferences are managed and passed to AI agents.

## Overview

Each contributor has two preference files:

1. **Public** (`.opencode/contributors/{name}.md`) - Shared with the team, committed to repo
2. **Local** (`.opencode/contributors/{name}.local.md`) - Personal settings, gitignored

## Directory Structure

```
.opencode/
├── OPENCODE.md           # Agent protocols
├── CONTRIBUTORS.md       # This file (system docs)
├── contributors/
│   ├── .gitignore        # Ignores *.local.md files
│   ├── abu.md            # Abu's public preferences
│   ├── abu.local.md      # Abu's local preferences (gitignored)
│   ├── fred.md           # Fred's public preferences
│   └── fred.local.md     # Fred's local preferences (gitignored)
```

## Preference File Format

### Public Preferences (`{name}.md`)

```markdown
# {Name}'s Contributor Profile

## Role

[Primary role: product, engineering, design, etc.]

## Focus Areas

- [Area 1]
- [Area 2]

## Working Style

[How they prefer to work, communicate, receive feedback]

## Expertise

- [Domain 1]
- [Domain 2]

## Preferred Tools

- [Tool/Agent preferences]

## Communication

- [Timezone]
- [Availability]
- [Preferred channels]
```

### Local Preferences (`{name}.local.md`)

```markdown
# {Name}'s Local Settings

## Current Focus

[What they're currently working on]

## Do Not Disturb

[Topics/areas to avoid or defer]

## Quick Access

[Frequently used commands, shortcuts]

## Notes

[Personal notes, reminders]
```

## Agent Protocol

When an agent is invoked, it should:

1. **Check for contributor context** in the prompt or session
2. **Load public preferences** from `.opencode/contributors/{name}.md`
3. **Load local preferences** from `.opencode/contributors/{name}.local.md` (if exists)
4. **Merge preferences** (local overrides public)
5. **Adapt behavior** based on role, focus areas, and working style

### Example Agent Prompt Injection

```
## Contributor Context
Loading preferences for: Abu

Role: Product & Vision Lead
Focus: User experience, feature prioritization
Style: High-level vision, no code details
Current Focus: Settings UI redesign

Adapting responses accordingly...
```

## Creating Your Profile

1. Copy the template:

   ```bash
   cp .opencode/contributors/_template.md .opencode/contributors/yourname.md
   ```

2. Edit your public preferences

3. Optionally create local preferences:

   ```bash
   cp .opencode/contributors/_template.local.md .opencode/contributors/yourname.local.md
   ```

4. Commit your public file (local is gitignored)

## Updating Preferences

- **Public**: Create a PR with your changes
- **Local**: Edit directly, no commit needed

## Integration with OpenCode

OpenCode automatically loads contributor preferences when:

- You start a session (`opencode`)
- An agent is invoked with your name
- You're mentioned in an issue/PR

To explicitly set context:

```bash
opencode --contributor abu "Review this PR"
```

Or in a session:

```
/context abu
```
