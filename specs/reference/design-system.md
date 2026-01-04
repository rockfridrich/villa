# Villa Design System

Visual language and component patterns for Villa. Implemented with **Tailwind CSS**.

## Design Tools

- **Figma:** Primary design tool for screens and prototypes
- **21st.dev:** React component library (Tailwind-based)
- **Lovable/v0:** Rapid prototyping

## Design Principles

### 1. Privacy-First Visual Language
- No dark patterns that trick users into sharing data
- Consent requests are prominent, not hidden
- Data destinations always visible before sharing

### 2. Calm Technology
- Minimal notifications and alerts
- Actions have clear, predictable outcomes
- No gamification or engagement hacking

### 3. Accessible by Default
- WCAG 2.1 AA compliance minimum
- High contrast text (4.5:1 ratio)
- Touch targets minimum 44x44px
- Screen reader support for all flows

### 4. Mobile-First
- Design for one-handed use
- Bottom-sheet patterns for actions
- Swipe gestures for common operations

## Color System (Tailwind)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| Primary | `#2563EB` | `#2563EB` | `villa-500` (custom) |
| Background | `#FFFFFF` | `#0F172A` | `bg-white` / `dark:bg-slate-900` |
| Surface | `#F8FAFC` | `#1E293B` | `bg-slate-50` / `dark:bg-slate-800` |
| Border | `#E2E8F0` | `#334155` | `border-slate-200` / `dark:border-slate-700` |
| Text | `#0F172A` | `#F8FAFC` | `text-slate-900` / `dark:text-slate-50` |
| Text Muted | `#64748B` | `#94A3B8` | `text-slate-500` / `dark:text-slate-400` |
| Success | `#22C55E` | `#22C55E` | `green-500` |
| Warning | `#F59E0B` | `#F59E0B` | `amber-500` |
| Error | `#EF4444` | `#EF4444` | `red-500` |

**Tailwind config extension:**
```typescript
colors: {
  villa: {
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#1e40af',
  }
}
```

## Typography (Tailwind)

| Element | Classes |
|---------|---------|
| Page title | `text-3xl font-bold tracking-tight` |
| Section title | `text-2xl font-semibold` |
| Card title | `text-lg font-medium` |
| Body | `text-base` |
| Caption | `text-sm text-slate-500` |
| Fine print | `text-xs text-slate-400` |

**Font stack:** System UI (`font-sans` default)

## Spacing

Use Tailwind's default scale: `p-4` (16px), `p-6` (24px), `gap-2` (8px), `gap-4` (16px), `space-y-4` (16px vertical rhythm)

## Core Components

| Component | Variants | Key Classes |
|-----------|----------|-------------|
| Button | Primary, Secondary, Ghost, Destructive | `min-h-11 rounded-lg font-medium` |
| Input | Text, Error, Disabled | `min-h-11 rounded-lg border` |
| Card | Elevated, Interactive | `rounded-xl shadow-sm border p-6` |
| Modal | Centered, Bottom sheet | `rounded-2xl shadow-xl` |

**Touch targets:** Always `min-h-11` (44px) for accessibility.

**Focus states:** `focus:ring-2 focus:ring-villa-500 focus:ring-offset-2`

## Screen States

Every screen must handle:
- **Default:** Normal appearance with data
- **Loading:** Spinner or skeleton (`animate-spin`, `animate-pulse`)
- **Empty:** Illustration + explanation + action
- **Error:** What went wrong + what to do + retry
- **Offline:** Clear indicator + queued actions
- **Success:** Confirmation + next step

## Animation

| Type | Duration | Tailwind |
|------|----------|----------|
| Micro-interactions | 150ms | `transition-colors duration-150` |
| Screen transitions | 300ms | `transition-all duration-300` |
| Loading spinners | 1000ms | `animate-spin` |

Respect `motion-reduce:transition-none` for accessibility.

## Icons

Use **Lucide React** (consistent with 21st.dev):
- Inline: `w-4 h-4`
- Buttons: `w-5 h-5`
- Cards: `w-6 h-6`
- Features: `w-8 h-8`

## Porto SDK Theming

Match Villa's design system in Porto dialog config:

```typescript
const portoTheme = {
  colors: {
    primary: '#2563eb',      // villa-500
    primaryHover: '#1d4ed8', // villa-600
    background: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
  },
  radii: {
    button: '0.5rem',  // rounded-lg
    card: '0.75rem',   // rounded-xl
    modal: '1rem',     // rounded-2xl
  },
}
```

## Dark Mode

Use Tailwind's `dark:` prefix. Set `darkMode: 'class'` in config.

## Responsive

Mobile-first with breakpoints: `md:` (768px), `lg:` (1024px)

## Implementation Notes

- Use 21st.dev or shadcn/ui components where possible
- Extend with Villa's custom `villa-*` colors
- Test at 320px, 375px, 414px widths
- Test with VoiceOver/TalkBack before shipping
