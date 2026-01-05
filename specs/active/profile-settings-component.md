# ProfileSettings Component Spec

**Status:** Draft
**Parent:** near-terminal-integration.md
**Component:** `apps/web/src/components/sdk/ProfileSettings.tsx`

## Overview

A modal/sheet component for editing user profile after onboarding. Reuses existing components where possible.

## User Stories

1. As a user, I want to change my avatar style after I've signed up
2. As a user, I want to edit my display name
3. As a user, I want to see what apps have access to my data
4. As a user, I want to understand that my nickname is permanent

## Component API

```tsx
interface ProfileSettingsProps {
  /** User's current identity */
  identity: Identity

  /** Callback when profile is updated */
  onUpdate: (updates: ProfileUpdate) => Promise<void>

  /** Optional: close handler for modal mode */
  onClose?: () => void

  /** Feature flag: enable avatar upload (Phase 3) */
  allowAvatarUpload?: boolean

  /** Feature flag: show connected apps section */
  showConnectedApps?: boolean
}

interface ProfileUpdate {
  displayName?: string
  avatar?: AvatarConfig | CustomAvatar
}

// Usage
<ProfileSettings
  identity={user.identity}
  onUpdate={async (updates) => {
    await api.updateProfile(updates)
    refreshUser()
  }}
  onClose={() => setShowSettings(false)}
/>
```

## State Machine

```
                    ┌────────────────┐
                    │    overview    │ (default)
                    └───────┬────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
   ┌───────────────┐ ┌─────────────┐ ┌──────────────┐
   │  edit-avatar  │ │ edit-name   │ │ upload-avatar│
   └───────┬───────┘ └──────┬──────┘ └───────┬──────┘
           │                │                 │
           └────────────────┴─────────────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │    overview    │ (return)
                    └────────────────┘
```

## Layout Specification

### Overview View (Default)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Profile Settings                          [✕]  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│              ┌────────────┐                     │
│              │            │                     │
│              │   Avatar   │                     │
│              │   128x128  │                     │
│              │            │                     │
│              └────────────┘                     │
│                                                 │
│            [ Change Avatar ]                    │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  Nickname                                       │
│  ┌─────────────────────────────────────────┐    │
│  │  alice                          🔒      │    │
│  └─────────────────────────────────────────┘    │
│  Your nickname is permanent and cannot be       │
│  changed. It's how others find you.             │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  Display Name                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Alice Johnson                    [✎]   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│  Connected Apps                        [→]      │
│  3 apps have access to your profile             │
│                                                 │
│  ───────────────────────────────────────────    │
│                                                 │
│                                                 │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Delete Account                   │    │
│  └─────────────────────────────────────────┘    │
│  This action cannot be undone.                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Edit Avatar View

Reuses `AvatarSelection` component with modifications:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [← Back]    Change Avatar                      │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │         [AvatarSelection]               │    │
│  │         (existing component)            │    │
│  │         timerDuration={0}  // No timer  │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ─── OR upload your own (Phase 3) ──────────   │
│                                                 │
│  [ Upload Photo ]  (if allowAvatarUpload)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Edit Display Name View

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [← Back]    Edit Display Name                  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Display Name                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Alice Johnson                          │    │
│  └─────────────────────────────────────────┘    │
│  0-50 characters. This is shown to other users. │
│                                                 │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │              Save Changes               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Component Tree

```
ProfileSettings
├── ProfileHeader (avatar + close)
├── ProfileSection (avatar change)
│   └── AvatarPreview
│   └── Button "Change Avatar"
├── ProfileSection (nickname - read only)
│   └── Input (disabled)
│   └── HelperText
├── ProfileSection (display name)
│   └── EditableField
│       └── Input
│       └── EditButton
├── ProfileSection (connected apps) [optional]
│   └── AppList (summary)
│   └── ChevronRight
├── Divider
└── DangerZone
    └── Button "Delete Account" (destructive)
```

## Reuse Strategy

| Need | Existing | Reuse? |
|------|----------|--------|
| Avatar picker | `AvatarSelection` | Yes, add `timerDuration={0}` prop |
| Avatar display | `AvatarPreview` | Yes, as-is |
| Input validation | `displayNameSchema` | Yes, from validation.ts |
| State persistence | `useIdentityStore` | Yes, `updateProfile()` |
| Sheet/Modal | (none) | Build or use Radix Dialog |

## New Components Needed

### 1. ProfileSection
```tsx
interface ProfileSectionProps {
  label: string
  children: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}
```

### 2. EditableField
```tsx
interface EditableFieldProps {
  value: string
  onChange: (value: string) => void
  onSave: () => Promise<void>
  schema: z.ZodSchema
  placeholder?: string
}
```

### 3. DangerZone
```tsx
interface DangerZoneProps {
  onDelete: () => Promise<void>
  confirmationText: string  // User must type to confirm
}
```

## Animations

| Transition | Animation |
|------------|-----------|
| Open modal | Fade in + slide up (150ms) |
| Close modal | Fade out + slide down (100ms) |
| View change | Cross-fade (150ms) |
| Save success | Checkmark pulse (300ms) |
| Error shake | X shake (200ms) |

Use Framer Motion:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.15 }}
>
```

## Accessibility

- Focus trap inside modal
- ESC to close
- ARIA labels on all interactive elements
- `aria-live="polite"` for save confirmations
- Reduced motion: instant transitions

## Mobile Considerations

- Full-height sheet on mobile (not centered modal)
- 44px minimum touch targets
- Keyboard-aware (input stays visible when typing)
- Safe area insets respected

## Error States

| Error | Display |
|-------|---------|
| Save failed | Inline error + retry button |
| Network error | Toast notification |
| Validation error | Field-level error message |
| Delete failed | Modal stays open, shows error |

## Test Coverage

```
ProfileSettings.test.tsx
├── renders current identity
├── avatar change triggers AvatarSelection
├── display name validates on save
├── nickname field is disabled
├── delete shows confirmation
├── onUpdate called with correct data
├── loading states display correctly
└── error states recoverable
```

## Implementation Order

1. ProfileSection wrapper component
2. Overview view with read-only display
3. Display name editing (extract from home page)
4. Avatar change integration (wire to AvatarSelection)
5. Delete account flow
6. Connected apps section (if scope includes)
7. Export from SDK index

## File Structure

```
apps/web/src/components/sdk/
├── ProfileSettings.tsx       # Main component
├── ProfileSettings.test.tsx  # Tests
├── profile/                  # Sub-components
│   ├── ProfileSection.tsx
│   ├── EditableField.tsx
│   ├── DangerZone.tsx
│   └── index.ts
└── index.ts                  # Export ProfileSettings
```

## Dependencies

```json
{
  "@radix-ui/react-dialog": "^1.0.0",  // Modal foundation
  "framer-motion": "^10.0.0",          // Already installed
  "zod": "^3.22.0"                     // Already installed
}
```

## Open Questions

1. Should "Connected Apps" be in scope for v1?
2. Delete account: soft delete or hard delete?
3. Confirmation flow: type nickname or just button?
