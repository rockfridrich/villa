# Villa Auth UI Quick Reference

**Distilled design patterns for key.villa.cash** — Copy-paste ready code snippets.

---

## Color Palette

### Existing Villa Tokens (Proof of Retreat)
```tsx
// Backgrounds
bg-cream-50    // #fffcf8 - Primary background
bg-cream-100   // #fef9f0 - Card backgrounds
bg-white       // #ffffff - Elevated cards

// Text
text-ink       // #0d0d17 - Headlines, body
text-ink-light // #45454f - Secondary text
text-ink-muted // #61616b - Captions, footer

// Accents (Max 2 per screen)
bg-accent-yellow   // #ffe047 - Primary CTA
text-accent-brown  // #382207 - CTA text
text-accent-green  // #698f69 - Trust indicators

// States
bg-error-bg border-error-border text-error-text     // Red system
bg-success-bg border-success-border text-success-text // Green system
```

### New: Gradient Overlays
```tsx
// Subtle background gradient
className="bg-gradient-to-b from-cream-50 to-cream-100"

// Button gradient (enhanced primary)
className="bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
           hover:from-villa-600 hover:to-villa-700"

// Text gradient (headline emphasis)
className="bg-gradient-to-r from-accent-yellow to-accent-green
           bg-clip-text text-transparent"
```

---

## Typography Scale

```tsx
// Headline (30px)
<h1 className="text-3xl font-serif text-ink">
  Your identity. No passwords.
</h1>

// Subheadline (18px)
<p className="text-lg font-sans text-ink-light">
  Sign in with your fingerprint or face
</p>

// Button text (16px)
<button className="text-base font-medium">
  Sign In
</button>

// Footer (14px)
<span className="text-sm text-ink-muted">
  Secured by passkeys
</span>

// Legal (12px)
<span className="text-xs text-ink-muted">
  By continuing, you agree to our Terms
</span>
```

---

## Layout Templates

### Full-Screen Auth
```tsx
<div className="flex flex-col min-h-[100dvh] justify-between p-6 bg-cream-50">
  {/* Top: Logo (20% height) */}
  <div className="pt-20">
    <Logo />
  </div>

  {/* Center: Content (60% height) */}
  <div className="w-full max-w-sm mx-auto space-y-8">
    <h1 className="text-3xl font-serif text-ink text-center">
      Headline
    </h1>
    <div className="space-y-4">
      {/* Buttons */}
    </div>
  </div>

  {/* Bottom: Trust badge (20% height) */}
  <div className="pb-8 flex items-center justify-center gap-2">
    <ShieldCheck className="w-4 h-4 text-accent-green" />
    <span className="text-sm text-ink-muted">Secured by passkeys</span>
  </div>
</div>
```

### Card-Based Auth (Alternative)
```tsx
<div className="min-h-[100dvh] flex items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-cream-100">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-6"
  >
    {/* Card content */}
  </motion.div>
</div>
```

---

## Button Patterns

### Primary CTA (Yellow Gradient)
```tsx
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 40 }}
  disabled={isLoading}
  className="w-full min-h-14 px-6 py-3 text-base font-medium
             bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
             hover:from-villa-600 hover:to-villa-700
             text-accent-brown rounded-lg
             focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-colors duration-150"
>
  {isLoading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Signing in...
    </span>
  ) : (
    'Sign In'
  )}
</motion.button>
```

### Secondary CTA (Cream Background)
```tsx
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 40 }}
  className="w-full min-h-14 px-6 py-3 text-base font-medium
             bg-cream-100 hover:bg-cream-200
             text-ink border border-neutral-100 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
             transition-colors duration-150"
>
  Create Villa ID
</motion.button>
```

### Ghost Button (Tertiary)
```tsx
<button className="px-4 py-2 text-sm font-medium
                   text-ink-light hover:text-ink hover:bg-cream-100 rounded-md
                   transition-colors duration-150">
  Learn more
</button>
```

---

## Animation Configurations

### Spring Physics (Button Press)
```tsx
const springConfig = {
  type: "spring",
  stiffness: 300,  // Rainbow-inspired
  damping: 40,     // Responsive, not bouncy
}

<motion.button
  whileTap={{ scale: 0.98 }}
  transition={springConfig}
>
  Press me
</motion.button>
```

### Screen Entrance (Staggered)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
  <motion.div variants={itemVariants}>Item 3</motion.div>
</motion.div>
```

### Error Shake
```tsx
<motion.div
  animate={{ x: [-10, 10, -10, 10, 0] }}
  transition={{ duration: 0.4 }}
  className="flex items-center gap-2 text-error-text bg-error-bg
             border border-error-border p-3 rounded-md"
>
  <AlertCircle className="w-4 h-4" />
  <span className="text-sm">Authentication failed. Try again.</span>
</motion.div>
```

---

## Trust Indicators

### Passkey Badge (Footer)
```tsx
import { ShieldCheck } from 'lucide-react'

<div className="flex items-center justify-center gap-2">
  <ShieldCheck className="w-4 h-4 text-accent-green" />
  <span className="text-sm text-ink-muted">Secured by passkeys</span>
</div>
```

### Loading Spinner
```tsx
import { Loader2 } from 'lucide-react'

<div className="flex items-center justify-center gap-2">
  <Loader2 className="w-5 h-5 animate-spin text-accent-yellow" />
  <span className="text-sm text-ink-muted">Authenticating...</span>
</div>
```

### Success Checkmark (Lottie)
```tsx
import Lottie from 'lottie-react'
import successAnimation from '@/animations/success.json'

<Lottie
  animationData={successAnimation}
  loop={false}
  className="w-24 h-24 mx-auto"
/>
```

---

## State Management

### Loading States
```tsx
const [isLoading, setIsLoading] = useState(false)
const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)

const handleSignIn = async () => {
  setIsLoading(true)
  setLoadingAction('signin')
  try {
    await portoSDK.signIn()
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false)
    setLoadingAction(null)
  }
}
```

### Error States
```tsx
const [error, setError] = useState<string | null>(null)

{error && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 text-error-text bg-error-bg
               border border-error-border p-3 rounded-md"
  >
    <AlertCircle className="w-4 h-4" />
    <span className="text-sm">{error}</span>
  </motion.div>
)}
```

---

## Accessibility

### Reduced Motion Support
```tsx
import { useReducedMotion } from 'framer-motion'

const shouldReduceMotion = useReducedMotion()

const variants = shouldReduceMotion ? undefined : {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

<motion.div variants={variants}>
  {/* Content */}
</motion.div>
```

### Focus Indicators
```tsx
// Always visible focus ring
className="focus:outline-none focus:ring-2 focus:ring-accent-yellow
           focus:ring-offset-2 focus:ring-offset-cream-50"
```

### ARIA Labels
```tsx
<button aria-label="Sign in with passkey">
  <Fingerprint className="w-5 h-5" />
</button>

<div role="alert" aria-live="polite">
  {error}
</div>
```

---

## Mobile Optimizations

### Safe Area Padding
```tsx
// iOS notch/home indicator safe area
className="p-6 pb-safe-bottom"

// Dynamic viewport height (fixes iOS Safari)
className="min-h-[100dvh]"
```

### Touch Targets
```tsx
// Minimum 44x44pt (56px recommended)
className="min-h-14 min-w-14"

// Spacing between interactive elements
className="space-y-4" // 16px vertical gap
```

### Prevent Zoom on Input Focus
```tsx
// In apps/key/src/app/layout.tsx
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

---

## Component File Structure

```
apps/key/src/
├── app/
│   ├── page.tsx              # Root redirect
│   ├── auth/
│   │   └── page.tsx          # Auth screen
│   └── layout.tsx            # Global layout
├── components/
│   ├── ui/
│   │   ├── button.tsx        # Reuse from apps/web
│   │   ├── spinner.tsx
│   │   └── error-message.tsx
│   └── auth/
│       ├── AuthScreen.tsx    # Main auth UI
│       ├── TrustBadge.tsx    # Footer badge
│       └── LoadingState.tsx  # Auth loading
└── lib/
    ├── porto.ts              # Porto SDK config
    └── store.ts              # State management
```

---

## Copy-Paste: Complete Auth Screen

```tsx
'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const springConfig = { type: "spring", stiffness: 300, damping: 40 }

  const containerVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.1 },
    },
  }

  const itemVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const handleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('signin')

    try {
      // Porto SDK auth
      // await portoSDK.signIn()
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleCreateAccount = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('create')

    try {
      // Porto SDK registration
      // await portoSDK.register()
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock
    } catch (err) {
      setError('Account creation failed. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col min-h-[100dvh] justify-between p-6 bg-cream-50"
    >
      {/* Top: Logo */}
      <motion.div variants={itemVariants} className="pt-20">
        {/* <Logo /> */}
      </motion.div>

      {/* Center: Content */}
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Headline */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-ink">
            Your identity.{' '}
            <span className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent">
              No passwords.
            </span>
          </h1>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-error-text bg-error-bg border border-error-border p-3 rounded-md"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Primary: Sign In */}
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={springConfig}
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full min-h-14 px-6 py-3 text-base font-medium
                       bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
                       hover:from-villa-600 hover:to-villa-700
                       text-accent-brown rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
          >
            {isLoading && loadingAction === 'signin' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </motion.button>

          {/* Secondary: Create Villa ID */}
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={springConfig}
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full min-h-14 px-6 py-3 text-base font-medium
                       bg-cream-100 hover:bg-cream-200
                       text-ink border border-neutral-100 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
          >
            {isLoading && loadingAction === 'create' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Villa ID'
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom: Trust Badge */}
      <motion.div
        variants={itemVariants}
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

## Next Actions

1. **Copy this component** to `apps/key/src/components/auth/AuthScreen.tsx`
2. **Update imports** for your Porto SDK integration
3. **Test on real devices** (iOS Safari, Android Chrome)
4. **Add Lottie animations** for success states
5. **Document in LEARNINGS.md** what works

---

**Quick Links:**
- Full research: `/specs/reference/auth-ui-inspiration.md`
- Design principles: `/specs/reference/design-principles.md`
- Existing button: `/apps/web/src/components/ui/button.tsx`
- Sign-in welcome: `/apps/web/src/components/sdk/SignInWelcome.tsx`
