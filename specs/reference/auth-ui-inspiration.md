# Villa Auth UI Design Inspiration Research

**Research Date:** 2026-01-07
**Target:** key.villa.cash authentication interface
**Sources:** Zerion, Peanut Protocol, Rainbow Wallet, Uniswap

---

## Executive Summary

Villa's auth UI should balance **crypto-native trust signals** with **consumer-friendly approachability**. Research reveals three key patterns:

1. **Full-screen immersive onboarding** with generous whitespace
2. **Playful gradients** paired with restrained typography
3. **Mobile-first touch targets** with spring physics animations

### Design Direction for Villa

**Maintain:** Proof of Retreat aesthetic (cream backgrounds, yellow accents, serif headlines)
**Add:** Gradient overlays for depth, spring-based button animations, trust badges
**Avoid:** Dark mode (conflicts with cream palette), excessive decoration, slow transitions

---

## Competitive Analysis

### 1. Rainbow Wallet — Playfulness + Professionalism

**What Works:**
- **Gradient magic:** Uses vibrant color transitions (cyan → magenta → yellow) to create energy without chaos
- **Spring physics:** Button animations with `damping:40, stiffness:300` feel responsive, not sluggish
- **SF Pro Rounded typography:** Friendly while maintaining credibility
- **"Experience Crypto in Color" positioning:** Makes complex tech feel approachable

**Design Tokens to Adapt:**
```typescript
// Rainbow-inspired spring animation config
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 40,
}

// Gradient accent (adapt to Villa yellow)
background: 'linear-gradient(135deg, #ffe047 0%, #f5d63d 50%, #e6c733 100%)'
```

**Villa Application:**
- Add subtle yellow→gold gradient to primary buttons
- Use spring physics on button press (currently using basic scale)
- Consider gradient overlay on auth hero section

---

### 2. Zerion — Trust Through Minimalism

**What Works:**
- **Dark theme with gradient text:** Pink/magenta gradients on headlines create hierarchy
- **Anti-flicker optimization:** Prioritizes perceived performance
- **Prominent CTAs:** "Download" and "Get Extension" never compete—clear primary action
- **QR code for mobile:** Seamless cross-device handoff

**Design Tokens to Adapt:**
```typescript
// Gradient text for emphasis (adapt to Villa colors)
className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent"

// Trust badge pattern
<div className="flex items-center gap-2 text-sm text-ink-muted">
  <ShieldCheck className="w-4 h-4" />
  <span>Secured by passkeys</span>
</div>
```

**Villa Application:**
- Add gradient to "Your identity. No passwords." headline
- Expand "Secured by passkeys" footer with icon
- Consider QR code for desktop→mobile handoff (future feature)

---

### 3. Peanut Protocol — Clarity for Emerging Markets

**What Works:**
- **System font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI'` (fast, accessible)
- **Extensive color system:** Teal/blue for finance trust, semantic colors for states
- **Chakra UI spacing:** Consistent 4px grid (aligns with Villa's 8px grid)

**Design Tokens to Adapt:**
```typescript
// Semantic state colors (Villa already has these)
success: { bg: '#f0f9f0', border: '#d4e8d4', text: '#698f69' }
error: { bg: '#fef0f0', border: '#fecaca', text: '#dc2626' }
warning: { bg: '#fffbeb', border: '#ffe047', text: '#382207' }

// Touch-friendly spacing
spacing: { sm: '8px', md: '16px', lg: '24px', xl: '32px' }
```

**Villa Application:**
- Villa already uses semantic colors correctly
- Maintain 8px grid (stricter than Chakra's 4px)
- Add visual feedback for loading/error states during auth

---

### 4. Uniswap — Performance-First Design

**What Works:**
- **Custom typeface:** "Basel" font (485 book, 535 medium) creates brand distinction
- **Minimal pink accent:** `rgba(255, 184, 226)` for emphasis only
- **Mobile-first overflow handling:** Prevents scroll issues on smaller screens
- **`font-display: block`:** Content prioritized over font loading

**Design Tokens to Adapt:**
```typescript
// Performance-conscious font loading
fontFamily: {
  serif: ['DM Serif Display', 'Georgia', 'serif'], // Villa already uses
  sans: ['Inter', 'system-ui', 'sans-serif'], // Add system-ui fallback
}

// Accent restraint: max 2 per screen
- Primary CTA: accent-yellow
- Active indicator: accent-green (if needed)
```

**Villa Application:**
- Verify font-display strategy in Next.js config
- Limit accent-yellow usage to 1-2 elements per auth screen
- Add system font fallbacks for instant rendering

---

## Key Patterns for Villa Auth UI

### Layout Architecture

**Full-Screen Immersive** (Recommended for key.villa.cash)
```tsx
<div className="flex flex-col min-h-screen justify-between p-6">
  {/* Top: Logo/Brand */}
  <div className="pt-20">
    <VillaLogo />
  </div>

  {/* Center: Headline + CTAs */}
  <div className="w-full max-w-sm mx-auto space-y-8">
    <h1 className="text-3xl font-serif text-ink text-center">
      Your identity. No passwords.
    </h1>
    {/* Buttons */}
  </div>

  {/* Bottom: Trust Badge */}
  <div className="pb-8 flex items-center justify-center gap-2">
    <ShieldCheck className="w-4 h-4 text-accent-green" />
    <span className="text-sm text-ink-muted">Secured by passkeys</span>
  </div>
</div>
```

**Why full-screen?**
- Eliminates distractions (no nav, no footer)
- Mobile-first (no desktop chrome)
- Puts focus on single decision: Sign In or Create

---

### Button Hierarchy

**Current Villa Pattern:**
```tsx
// Primary: Yellow background, brown text
bg-accent-yellow text-accent-brown hover:bg-villa-600 active:bg-villa-700

// Secondary: Cream background, ink text
bg-cream-100 text-ink hover:bg-cream-200 border border-neutral-100
```

**Enhanced with Spring Physics:**
```tsx
import { motion } from 'framer-motion'

<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 40 }}
  className="bg-accent-yellow text-accent-brown ..."
>
  Sign In
</motion.button>
```

**Enhanced with Gradient:**
```tsx
className="bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
           hover:from-villa-600 hover:to-villa-700
           text-accent-brown font-medium"
```

**Touch Targets:**
- Minimum: `min-h-14` (56px) for auth CTAs
- Spacing between: `gap-4` (16px)
- Full width on mobile: `w-full`

---

### Typography Scale for Auth

| Element | Tailwind | Villa Token | Size |
|---------|----------|-------------|------|
| Headline | `text-3xl font-serif` | DM Serif Display | 30px |
| Subheadline | `text-lg font-sans` | Inter | 18px |
| Button text | `text-base font-medium` | Inter Medium | 16px |
| Footer | `text-sm` | Inter | 14px |
| Legal | `text-xs` | Inter | 12px |

**Hierarchy Rules:**
- Max 3 sizes per screen (headline, button, footer)
- Serif for emotional copy ("Your identity. No passwords.")
- Sans-serif for actions ("Sign In", "Create Villa ID")

---

### Color Applications

**Backgrounds:**
```tsx
// Primary background
className="bg-cream-50" // #fffcf8 (warm white)

// Card backgrounds (if needed)
className="bg-white border border-neutral-100"

// Gradient overlay (subtle)
className="bg-gradient-to-b from-cream-50 to-cream-100"
```

**Text:**
```tsx
// Headline
className="text-ink" // #0d0d17 (near-black)

// Body/buttons
className="text-ink-light" // #45454f (charcoal)

// Secondary/footer
className="text-ink-muted" // #61616b (gray)
```

**Accents (Max 2 per screen):**
```tsx
// Primary CTA
className="bg-accent-yellow" // #ffe047 (lemon yellow)

// Trust indicator
className="text-accent-green" // #698f69 (sage green)
```

**Avoid:**
- Multiple accent colors competing
- Pure black (`#000`) — use `text-ink` instead
- Hardcoded hex values — use design tokens

---

### Animation Timing

| Action | Duration | Easing | Implementation |
|--------|----------|--------|----------------|
| Button press | 100ms | Spring | `whileTap={{ scale: 0.98 }}` |
| Screen entrance | 300ms | Ease-out | `animate={{ opacity: 1, y: 0 }}` |
| Loading spinner | Infinite | Linear | `animate-spin` |
| Success check | 500ms | Spring | Lottie animation |
| Error shake | 200ms | Ease-in-out | `x: [-10, 10, -10, 0]` |

**Respect reduced motion:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const variants = prefersReducedMotion ? undefined : {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}
```

---

### Trust Indicators

**Passkey Badge (Footer):**
```tsx
<div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
  <ShieldCheck className="w-4 h-4 text-accent-green" />
  <span>Secured by passkeys</span>
</div>
```

**Loading State (During auth):**
```tsx
{isLoading && (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Authenticating...</span>
  </div>
)}
```

**Error State (Auth failure):**
```tsx
{error && (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-2 text-error-text bg-error-bg border border-error-border p-3 rounded-md"
  >
    <AlertCircle className="w-4 h-4" />
    <span className="text-sm">{error.message}</span>
  </motion.div>
)}
```

---

## Component Structure Recommendations

### File: `apps/key/src/components/AuthScreen.tsx`

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)

  const handleSignIn = async () => {
    setIsLoading(true)
    setLoadingAction('signin')
    // Porto SDK auth logic
    // ...
    setIsLoading(false)
  }

  const handleCreateAccount = async () => {
    setIsLoading(true)
    setLoadingAction('create')
    // Porto SDK registration logic
    // ...
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen justify-between p-6 bg-cream-50"
    >
      {/* Top: Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pt-20"
      >
        {/* Logo component */}
      </motion.div>

      {/* Center: Content */}
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Headline with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-serif text-ink">
            Your identity.{' '}
            <span className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent">
              No passwords.
            </span>
          </h1>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Primary: Sign In */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="primary"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow"
            >
              {isLoading && loadingAction === 'signin' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </motion.div>

          {/* Secondary: Create Villa ID */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && loadingAction === 'create' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Villa ID'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom: Trust Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pb-8 flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-4 h-4 text-accent-green" />
        <span className="text-sm text-ink-muted">Secured by passkeys</span>
      </motion.div>
    </motion.div>
  )
}
```

---

## Mobile-First Considerations

### Touch Targets
- **Minimum:** 56px (`min-h-14`) for primary actions
- **Recommended:** 64px for elderly/accessibility
- **Spacing:** 16px vertical gap between buttons

### Viewport Units
```tsx
// Full-screen auth (no browser chrome)
className="min-h-[100dvh]" // Dynamic viewport height (iOS Safari safe)

// Safe area padding
className="p-6 pb-safe" // Tailwind safe-area plugin
```

### Keyboard Avoidance
```tsx
// For input fields (future nickname entry)
<div className="pb-[env(keyboard-inset-height)]">
  <Input />
</div>
```

### Gesture Navigation
```tsx
// Swipe-to-dismiss (future modals)
import { motion } from 'framer-motion'

<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.y > 100) onDismiss()
  }}
>
  {/* Modal content */}
</motion.div>
```

---

## Animation Libraries

### Framer Motion (Interactive Animations)
```bash
# Already installed in Villa
pnpm add framer-motion
```

**Use for:**
- Button press springs
- Screen transitions
- Gesture interactions
- Layout animations

**Config:**
```tsx
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 40,
}

const easingConfig = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3,
}
```

---

### Lottie (Complex Vector Animations)
```bash
# Already installed in Villa
pnpm add lottie-react
```

**Use for:**
- Success checkmarks (auth confirmation)
- Loading states (more engaging than spinners)
- Empty states (future error screens)
- Celebration moments (account created)

**Example:**
```tsx
import Lottie from 'lottie-react'
import successAnimation from '@/animations/success.json'

<Lottie
  animationData={successAnimation}
  loop={false}
  className="w-24 h-24"
/>
```

**Asset Sources:**
- LottieFiles: https://lottiefiles.com/
- Villa-specific: Commission from designer or create in After Effects

---

## Implementation Checklist

### Phase 1: Core Auth UI (MVP)
- [ ] Full-screen layout with 3-section structure
- [ ] Primary/secondary button styles with gradient
- [ ] Spring physics on button press
- [ ] Headline with gradient text
- [ ] Trust badge in footer
- [ ] Loading states during auth
- [ ] Error states with motion

### Phase 2: Polish
- [ ] Lottie success animation
- [ ] Entrance transitions for all elements
- [ ] Reduced motion support
- [ ] Safe area padding for iOS
- [ ] Keyboard avoidance for inputs

### Phase 3: Advanced
- [ ] QR code for desktop handoff
- [ ] Biometric prompt customization
- [ ] Multi-language support
- [ ] Dark mode exploration (optional)

---

## Anti-Patterns to Avoid

**Token Burners:**
- ❌ Multiple competing accents (yellow + green + pink)
- ❌ Slow animations (>300ms for micro-interactions)
- ❌ Hardcoded colors (`#ffe047` instead of `accent-yellow`)
- ❌ Complex auth flows (keep it 2 screens max)
- ❌ Desktop-first layouts (mobile gets 80% of traffic)
- ❌ Animations without reduced motion checks

**Design Violations:**
- ❌ Touch targets <44px
- ❌ Body text <16px
- ❌ Off-grid spacing (use 8pt grid)
- ❌ Missing loading states
- ❌ Color-only state indicators

---

## External Resources

### Component Sources
- **shadcn/ui:** https://ui.shadcn.com/docs/components/button
- **21st.dev:** https://21st.dev/ (check for auth patterns)
- **Magic UI:** https://magicui.design/ (animated buttons, gradients)
- **Aceternity UI:** https://ui.aceternity.com/ (advanced effects)

### Inspiration
- **Rainbow:** https://rainbow.me (playful crypto UX)
- **Zerion:** https://zerion.io (trust-focused minimalism)
- **Uniswap:** https://app.uniswap.org (performance-first)
- **Coinbase Wallet:** https://www.coinbase.com/wallet (mainstream appeal)

### Design Systems
- **Apple HIG:** https://developer.apple.com/design/human-interface-guidelines/
- **Telegram Design:** https://core.telegram.org/api/design
- **Villa Design Principles:** `/specs/reference/design-principles.md`

---

## Next Steps

1. **Review with stakeholders** — Validate design direction
2. **Create Figma mockups** (optional) — Visualize before coding
3. **Bootstrap component structure** — Use existing Villa patterns
4. **Iterate with @build** — Implement in `apps/key/src/`
5. **Test on real devices** — iOS Safari, Android Chrome
6. **Document learnings** — Update `LEARNINGS.md`

---

**Last Updated:** 2026-01-07
**Maintained By:** @design agent
**Related Files:**
- `/specs/reference/design-principles.md`
- `/apps/web/tailwind.config.ts`
- `/apps/web/src/components/ui/button.tsx`
- `/apps/web/src/components/sdk/SignInWelcome.tsx`
