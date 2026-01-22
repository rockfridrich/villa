# OpenCode Guide for Villa

A guide to using OpenCode for AI-assisted development on Villa.

## What is OpenCode?

OpenCode is an AI coding assistant that runs in your terminal. It understands the Villa codebase, can read/write files, run commands, and help with everything from exploring code to implementing features.

## Getting Started

### Installation

```bash
# Install OpenCode
npm install -g opencode

# Navigate to Villa
cd villa

# Start a session
opencode
```

### Your First Session

```
$ opencode

Welcome to OpenCode. How can I help?

> What is Villa?

Villa is a privacy-first passkey authentication system for pop-up villages...

> Show me the main app structure

[Agent explores apps/hub/ and explains the structure]
```

## Core Concepts

### Agents

OpenCode uses specialized agents for different tasks:

| Agent      | Use For                           |
| ---------- | --------------------------------- |
| `@explore` | Search and understand code        |
| `@product` | Product specs, user stories       |
| `@design`  | UI/UX review and improvements     |
| `@oracle`  | Deep technical analysis           |
| `@ops`     | Deployment, CI/CD, infrastructure |

### Invoking Agents

```
> @explore How does authentication work?

[Explore agent searches codebase for auth-related code]

> @product Create a spec for nickname marketplace

[Product agent creates detailed product specification]
```

### Background Tasks

For long-running tasks, agents run in the background:

```
> @explore Find all uses of Porto SDK (runs in background)

[You can continue working while agent searches]

> What did you find?

[Agent reports results]
```

## Common Workflows

### Understanding Code

```
> How does the settings page work?

> @explore Find where ProfileSettings is used

> Show me the data flow for profile updates
```

### Creating Features

```
> I want to add a dark mode toggle

[Agent asks clarifying questions]

> Users should be able to toggle in settings, persisted in localStorage

[Agent creates implementation plan]

> Implement it

[Agent writes the code]
```

### Fixing Bugs

```
> The settings modal appears transparent

> @explore Find the ProfileSettings modal styling

[Agent finds the issue]

> Fix it

[Agent applies the fix]
```

### Reviewing Changes

```
> What changed in the last commit?

> Review PR #48 for product alignment

> @design Review the new settings UI
```

## Working with Issues

### From Issue to Implementation

```
> Look at issue #47

[Agent reads the issue]

> Create a plan to implement the first item

[Agent creates implementation plan]

> Let's start with step 1

[Agent begins implementation]
```

### Creating Issues

```
> Create an issue for adding biometric recovery

[Agent drafts issue with problem, solution, acceptance criteria]

> Post it to GitHub

[Agent creates the issue]
```

## Best Practices

### Be Specific

```
# Good
> Add a logout button to the header that calls signOut() and redirects to /

# Less Good
> Add logout
```

### Provide Context

```
# Good
> In ProfileSettings.tsx, the backdrop is transparent.
> It should use bg-ink/60 like other modals.

# Less Good
> Fix the modal
```

### Iterate

```
> Create a dark mode toggle

[Reviews output]

> Good, but also add a system preference option

[Agent updates]

> Now add smooth transition animation

[Agent updates]
```

### Use the Right Agent

```
# For understanding code
> @explore How does X work?

# For product decisions
> @product Should we use modal or page for settings?

# For complex technical decisions
> @oracle What's the best approach for offline sync?
```

## Contributor Preferences

Your preferences customize how agents work with you.

### Setting Up

1. Copy the template:

   ```bash
   cp .opencode/contributors/_template.md .opencode/contributors/yourname.md
   ```

2. Edit with your preferences

3. Optionally add local settings:
   ```bash
   touch .opencode/contributors/yourname.local.md
   ```

### What Preferences Control

- **Role**: Affects depth of technical detail
- **Focus Areas**: Prioritizes relevant code
- **Working Style**: Adapts communication
- **Agent Preferences**: Default agents for your tasks

## Tips for Non-Engineers

### You Don't Need to Code

OpenCode can:

- Explain code in plain language
- Create product specs
- Review implementations for user impact
- Draft documentation

### Useful Prompts

```
> Explain what this feature does for users

> What would users see if we implemented #47?

> Review this PR - does it match the product vision?

> Create a user story for nickname trading
```

### Focus on Outcomes

```
# Good - focuses on user value
> Users need to recover their account if they lose their phone

# Less useful - jumps to solution
> Implement biometric backup with WebAuthn
```

## Troubleshooting

### Agent Not Responding

```
> /status

[Shows current agent status]

> /cancel

[Cancels stuck operation]
```

### Wrong Results

```
> That's not what I meant. I want X, not Y.

[Agent corrects]
```

### Context Lost

```
> Let me remind you: we're working on the settings modal in ProfileSettings.tsx

[Reestablishes context]
```

## Quick Reference

| Command         | Action                       |
| --------------- | ---------------------------- |
| `opencode`      | Start session                |
| `@agent`        | Invoke specific agent        |
| `/status`       | Check agent status           |
| `/cancel`       | Cancel current operation     |
| `/context name` | Load contributor preferences |
| `Ctrl+C`        | Exit session                 |

## Resources

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution workflow
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [AGENTS.md](../AGENTS.md) - Full agent documentation
- [.opencode/OPENCODE.md](../.opencode/OPENCODE.md) - Agent protocols
