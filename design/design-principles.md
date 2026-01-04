# Villa Design Principles

Authoritative reference for Villa's visual language. Synthesizes Apple Human Interface Guidelines and Telegram's design philosophy with a bias toward experimentation and delight.

**Use this document when:** Bootstrapping UI, critiquing implementations, integrating external components, or resolving design debates.

---

## Design Philosophy

Villa's design language combines Apple's obsession with clarity and polish with Telegram's commitment to speed and restraint. But we add a third ingredient: **experimentation**. The best mobile experiences feel alive — they respond, animate, and reward interaction. We pursue that feeling while keeping the app clean and useful.

### Core Principle: Less Time, More Often

Users should spend **less time** in the app per session but return **more often**. This is the north star metric for design decisions.

Every interaction should be fast, satisfying, and complete. If a user can accomplish their goal in 10 seconds instead of 30, that's a win — even though "time in app" drops. Frequent, brief visits demonstrate we're providing value. Long, frustrated sessions indicate we're failing.

Design implications: Eliminate unnecessary steps. Front-load the most important information. Use animation to compress perceived time, not extend it. Celebrate completion, then get out of the way.

### From Apple HIG

**Clarity** — Every element serves exactly one purpose. If you can't explain what a UI element does in one sentence, it's doing too much.

**Deference** — The interface exists to support content, never to compete with it. UI chrome fades into the background.

**Depth** — Layering and motion create spatial relationships that help users understand hierarchy without thinking.

### From Telegram

**Speed** — Interactions feel instant. Users never wait for the interface to catch up with their intentions.

**Restraint** — Decoration without purpose is noise. Every visual element justifies its existence.

**Density** — Information is accessible, not hidden. Progressive disclosure keeps complexity manageable.

### Villa's Addition: Experimentation

**Try new patterns** — The design ecosystem evolves rapidly. We actively experiment with emerging interaction patterns, animation techniques, and visual styles. What feels novel today becomes standard tomorrow.

**Hardware-first thinking** — Modern devices have powerful GPUs, smooth displays, and haptic feedback. We leverage these capabilities rather than designing for lowest-common-denominator hardware.

**Delight through motion** — Animation isn't decoration; it's communication. Well-crafted motion guides attention, provides feedback, and creates emotional connection. We invest in making interactions feel alive.

---

## Primary Sources: 21st.dev & shadcn/ui

Villa relies heavily on two curated component ecosystems. These are human-vetted, production-quality sources that save us from reinventing patterns poorly.

### shadcn/ui — The Foundation

shadcn/ui is our primary component library. Components are copied into the repo (not installed as a dependency), giving us full control while inheriting excellent defaults.

**When to use:** Always check shadcn/ui first for any standard UI pattern. Buttons, inputs, dialogs, dropdowns, cards, tabs — start here.

**How to use:** Copy components via CLI (`npx shadcn-ui@latest add [component]`), then customize for Villa's design tokens. Never fight the component API; if it doesn't fit, look for alternatives.

**Documentation:** https://ui.shadcn.com/

### 21st.dev — The Inspiration Layer

21st.dev is a community registry of React components curated for quality. It's our primary source for complex interaction patterns, creative animations, and novel UI ideas.

**When to use:** When shadcn/ui doesn't have the pattern you need. When you want inspiration for how to implement something with more polish. When exploring new interaction paradigms.

**How to use:** Browse the registry for relevant patterns. Review code quality and accessibility. Adapt to Villa's design system rather than copying verbatim. Credit original authors in code comments.

**Claude Code Integration:** 21st.dev provides a GUI interface for Claude Code repositories. The integration configuration lives in `configs/21st.config.json` or similar config files in the repo root. Before using 21st.dev components, the @design agent should read relevant config files in `configs/` to understand how 21st.dev connects to the development workflow, available component mappings, and any repo-specific customizations.

**Documentation:** https://21st.dev/

### Magic UI — Animation Patterns

Magic UI provides animated components built on Framer Motion. Use for hero sections, landing pages, and moments that deserve extra polish.

**When to use:** Onboarding flows, empty states, celebration moments, marketing surfaces.

**Documentation:** https://magicui.design/

### Aceternity UI — Advanced Effects

Aceternity offers more experimental effects: 3D transforms, complex gradients, particle systems. Use sparingly for high-impact moments.

**When to use:** Hero sections, feature showcases, premium experiences. Not for everyday UI.

**Documentation:** https://ui.aceternity.com/

---

## Animation & Motion

Animation is a first-class design concern at Villa. We invest in motion because it makes interactions feel responsive, guides user attention, and creates emotional connection.

### Duration Guidelines

| Type | Duration | Tailwind | Use Case |
|------|----------|----------|----------|
| Micro | 100-150ms | `duration-100`, `duration-150` | Hover, focus, button press |
| Standard | 200-300ms | `duration-200`, `duration-300` | Panel expand, slide transitions |
| Emphasis | 300-500ms | `duration-300`, `duration-500` | Modal open, page transitions |
| Celebration | 500-1000ms | Custom | Success states, achievements |

### Easing

Use `ease-out` for elements entering the screen (decelerating into rest). Use `ease-in` for elements leaving. Use `ease-in-out` for elements that move while staying on screen. Avoid `linear` except for continuous animations like spinners.

Spring physics (via Framer Motion) feel more natural than cubic beziers for interactive elements.

### Hardware Acceleration

Modern devices have powerful GPUs. Leverage them.

**GPU-accelerated properties:** `transform`, `opacity`, `filter`. These animate on the compositor thread without triggering layout recalculation.

**Avoid animating:** `width`, `height`, `top`, `left`, `margin`, `padding`. These trigger expensive layout recalculations.

```typescript
// ✅ Good: GPU-accelerated
className="transition-transform duration-200 hover:scale-105"
style={{ transform: 'translateX(100px)' }}

// ❌ Bad: Triggers layout
className="transition-all duration-200 hover:w-64"
style={{ left: '100px' }}
```

### Lottie Animations

Lottie renders After Effects animations as JSON, enabling complex vector animations at 60fps with tiny file sizes. Use for:

- **Loading states:** More engaging than spinners
- **Empty states:** Illustrations that breathe
- **Success celebrations:** Confetti, checkmarks, rewards
- **Onboarding:** Explainer animations
- **Brand moments:** Logo animations, transitions

**Implementation:**
```typescript
import Lottie from 'lottie-react';
import successAnimation from '@/animations/success.json';

<Lottie 
  animationData={successAnimation}
  loop={false}
  className="w-24 h-24"
/>
```

**Library:** `lottie-react` (React wrapper) or `lottie-web` (vanilla)

**Asset sources:** LottieFiles (https://lottiefiles.com/), custom After Effects exports

**Performance:** Lottie animations are GPU-accelerated and typically use less CPU than CSS animations for complex sequences.

### Parallax & Scroll Effects

Parallax creates depth by moving elements at different speeds during scroll. Use for landing pages and marketing surfaces — sparingly in core app flows.

**Implementation options:**

- **Framer Motion:** `useScroll()` + `useTransform()` for React-native parallax
- **GSAP ScrollTrigger:** For complex scroll-linked animations
- **CSS `scroll-timeline`:** Native browser support (check compatibility)

```typescript
// Framer Motion parallax example
const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

<motion.div style={{ y }}>
  Parallax content
</motion.div>
```

**Performance rules:**
- Use `will-change: transform` sparingly (hints GPU allocation)
- Throttle scroll handlers or use `IntersectionObserver`
- Test on mid-range devices, not just flagship phones

### Motion Reduction

Always respect user preferences. Some users experience motion sickness or have vestibular disorders.

```typescript
// CSS
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

// Tailwind
className="transition-transform motion-reduce:transition-none"

// React
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Haptic Feedback

On supported devices, pair animations with haptic feedback for tactile confirmation.

```typescript
// Trigger haptic on important actions
if ('vibrate' in navigator) {
  navigator.vibrate(10); // Light tap
}
```

---

## Spacing System (8pt Grid)

All spacing uses 8pt base grid with 4pt fine adjustments.

| Tailwind | Pixels | When to Use |
|----------|--------|-------------|
| `p-1`, `gap-1` | 4px | Icon padding, fine adjustments |
| `p-2`, `gap-2` | 8px | Between related items in a group |
| `p-4`, `gap-4` | 16px | Standard spacing (most common) |
| `p-5`, `gap-5` | 20px | Screen edge margins on mobile |
| `p-6`, `gap-6` | 24px | Card padding, section spacing |
| `p-8`, `gap-8` | 32px | Large section breaks |

**Invalid values:** `p-[15px]`, `gap-[7px]`, `mt-[22px]` — not on grid

**Screen margins:** 16-20pt horizontal (`px-4` or `px-5`)

---

## Typography

| Tailwind | Pixels | Purpose |
|----------|--------|---------|
| `text-xs` | 12px | Legal text, footnotes only |
| `text-sm` | 14px | Captions, helper text, timestamps |
| `text-base` | 16px | Body text — the default |
| `text-lg` | 18px | Emphasized body, small headlines |
| `text-xl` | 20px | Section headlines |
| `text-2xl` | 24px | Page headlines |

**Rules:**
- Minimum body text: 16px (`text-base`)
- Maximum sizes per screen: 3-4 distinct sizes
- Line length: ≤75 characters (`max-w-prose`)
- Headlines: `font-semibold`, Body: `font-normal`, UI: `font-medium`

---

## Color System

### Token-Only Rule

All colors must come from design tokens. Never hardcode hex values.

```typescript
// ✅ Valid
className="text-slate-900 bg-white border-slate-200"
className="text-villa-500 hover:text-villa-600"

// ❌ Invalid
style={{ color: '#1a1a1a' }}
className="text-[#3b82f6]"
```

### Accent Restraint

**Maximum 2 accent-colored elements per screen** — primary CTA and one active state indicator.

### Contrast Requirements

| Combination | Ratio | Status |
|-------------|-------|--------|
| `text-slate-900` on white | 15.5:1 | ✅ Excellent |
| `text-slate-600` on white | 5.7:1 | ✅ Good |
| `text-slate-500` on white | 4.5:1 | ⚠️ Minimum |
| `text-slate-400` on white | 3.0:1 | ❌ Fails |

**Rule:** Never use color alone to convey information. Always pair with icons or text.

---

## Touch Targets

**Minimum size: 44×44 pixels** (`min-h-11 min-w-11`)

Every interactive element must be comfortable to tap with a finger.

---

## Component States

Every interactive component handles these states:

| State | Visual Pattern |
|-------|----------------|
| Default | Standard appearance |
| Hover | `hover:bg-slate-100` |
| Focus | `focus:ring-2 focus:ring-villa-500 focus:ring-offset-2` |
| Active | `active:bg-slate-200` + optional haptic |
| Loading | Lottie animation or `animate-pulse` skeleton |
| Disabled | `opacity-50 pointer-events-none` |
| Error | Red border + specific error message |
| Empty | Lottie illustration + call-to-action |
| Success | Celebration animation (brief) |

### Error Messages

Specific and actionable:
```
✅ "Nickname must be 3-30 characters. You entered 2."
❌ "Invalid input"
```

---

## Elevation

| Level | Shadow | Use For |
|-------|--------|---------|
| 0 | `shadow-none` | Flat elements |
| 1 | `shadow-sm` | Cards |
| 2 | `shadow` | Dropdowns |
| 3 | `shadow-lg` | Modals |
| 4 | `shadow-xl` | Critical overlays |

**Chrome ratio:** UI chrome ≤20% of viewport height.

---

## Accessibility Checklist

- **Images:** All have alt text (empty string for decorative)
- **Forms:** Every input has a label (placeholder is not a label)
- **Keyboard:** All interactive elements focusable and activatable
- **Focus:** Visible ring indicator on all focusable elements
- **Color:** Never sole indicator of state
- **Motion:** Respects `prefers-reduced-motion`

---

## Experimentation Guidelines

### When to Experiment

- **Onboarding flows:** First impressions matter. Invest in delight.
- **Empty states:** Turn dead ends into engaging moments.
- **Success celebrations:** Reward completion with satisfying feedback.
- **Marketing surfaces:** Landing pages, feature announcements.
- **Low-stakes UI:** Settings screens, about pages.

### When NOT to Experiment

- **Critical paths:** Login, payments, core workflows. Clarity over novelty.
- **Error states:** Frustration + experimentation = rage. Keep it simple.
- **High-frequency actions:** Things users do constantly should be invisible.
- **Accessibility-critical flows:** Stick to proven patterns.

### How to Experiment Safely

1. **Start in a branch** — Don't experiment in production code
2. **A/B test when possible** — Measure impact on key metrics
3. **Get design review** — Fresh eyes catch problems
4. **Test on real devices** — Simulators lie about performance
5. **Have a rollback plan** — If it doesn't work, revert quickly

### Tracking What Works

Document successful experiments in `LEARNINGS.md`. What worked, what didn't, and why. This builds institutional knowledge about what resonates with users.

---

## Quick Reference

| Property | Value | Tailwind |
|----------|-------|----------|
| Touch target min | 44px | `min-h-11` |
| Body text | 16px | `text-base` |
| Base spacing | 8px | `p-2` |
| Screen margins | 16-20px | `px-4` |
| Animation micro | 100-150ms | `duration-150` |
| Animation standard | 200-300ms | `duration-200` |
| Max accents | 2/screen | — |
| Contrast ratio | ≥4.5:1 | — |

---

## Animation Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| Tailwind transitions | Simple state changes | Hover, focus, basic reveals |
| Framer Motion | Interactive animations | Gestures, layout animations, scroll effects |
| Lottie | Complex vector animations | Loading, empty states, celebrations |
| GSAP | Advanced timeline control | Complex sequences, scroll-triggered |

---

## References

**Primary Sources:**
- shadcn/ui: https://ui.shadcn.com/
- 21st.dev: https://21st.dev/

**Animation:**
- Framer Motion: https://www.framer.com/motion/
- Lottie: https://lottiefiles.com/
- GSAP: https://greensock.com/gsap/

**Design Systems:**
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- Telegram: https://core.telegram.org/api/design

**Accessibility:**
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

**Inspiration:**
- Magic UI: https://magicui.design/
- Aceternity UI: https://ui.aceternity.com/
