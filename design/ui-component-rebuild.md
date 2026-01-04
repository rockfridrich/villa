# UI Component System Rebuild

**Status:** Active  
**Owner:** @design agent + frontend team  
**Priority:** P1  
**Dependencies:** Design agent setup, external tool access  

---

## Goal

Rebuild Villa's UI component system with automated design enforcement, accessibility compliance, and external tool integration. The new system enables AI-assisted bootstrapping while maintaining human creative control over refinement.

---

## Background

Villa's current UI was built incrementally without systematic design enforcement. This creates inconsistency in spacing, typography, color usage, and accessibility. The rebuild establishes a foundation where design principles are encoded into tooling and enforced automatically, freeing humans to focus on creative decisions rather than mechanical compliance.

---

## Design Philosophy

Villa's visual language synthesizes two world-class design systems.

**Apple HIG contributions:** Clarity (single-purpose elements), deference (content over chrome), depth (layered spatial hierarchy), 8pt spacing grid, 44px touch targets, spring-based animations.

**Telegram contributions:** Speed-first interactions (<100ms feedback), information density with progressive disclosure, accent restraint (≤2 per screen), lightweight decoration.

Full encoding available in `specs/reference/design-principles.md`.

---

## Technical Approach

### Layer 1: Design Agent with External Integration

The `@design` agent (`.claude/agents/design.md`) handles UI bootstrapping, critique, and external component integration. It owns the connection between Villa and curated UI ecosystems.

Agent responsibilities include reading product specs, integrating components from 21st.dev and shadcn/ui, applying Villa's design tokens, generating all required states, recommending animations (Lottie, Framer Motion, parallax), and producing structured critique reports.

The agent should read config files in `configs/` to understand how external tools like 21st.dev connect to the repo. 21st.dev provides a GUI interface for Claude Code repositories — the agent should leverage this for visual component browsing.

### Layer 2: Primary External Sources

**shadcn/ui** is the foundation. Always check here first for any standard UI pattern. Components are copied into the repo (not installed as dependency) and customized with Villa tokens.

**21st.dev** is the inspiration layer. Human-curated React components for complex interactions and creative animations. The agent should browse 21st.dev when shadcn doesn't have the pattern needed, then adapt components to Villa's design system.

**Magic UI** and **Aceternity UI** provide animation-heavy components for high-impact moments like hero sections and onboarding.

### Layer 3: Animation & Hardware Acceleration

**Lottie** for complex vector animations (loading states, empty states, celebrations). GPU-accelerated, small file sizes, 60fps.

**Framer Motion** for interactive animations (gestures, layout animations, scroll effects, parallax). Spring physics feel natural.

**Hardware-first thinking:** Animate `transform` and `opacity` (GPU-accelerated), not `width`/`height`/`margin` (triggers layout).

### Layer 4: Automated Enforcement

**Stylelint** enforces design tokens. The `stylelint-declaration-strict-value` plugin rejects hardcoded colors.

**ESLint jsx-a11y** catches accessibility issues. Rules for alt text, form labels, keyboard handlers.

**jest-axe** runs accessibility checks at component level. **Playwright + axe-core** validates full pages in E2E.

---

## Component Inventory

### Primitives (from shadcn/ui)

These exist in `src/components/ui/` and should be audited for design compliance.

Button, Input, Label, Card, Dialog, Dropdown Menu, Avatar, Badge, Skeleton, Toast, Tooltip, Popover, Select, Checkbox, Radio Group, Switch, Tabs, Separator.

### Villa-Specific Components

These need rebuilding with new design system.

VillaIdCard (identity display), NicknameInput (with validation states), AvatarSelector (grid picker with preview), OnboardingFlow (multi-step wizard), ProfileView (identity summary), ConnectionStatus (wallet/social state), ReputationBadge (score display).

### New Components Needed

EmptyState (illustration + CTA pattern), LoadingCard (skeleton variant), ErrorBoundary (with recovery action), ConfirmDialog (destructive action pattern).

---

## Migration Strategy

### Phase 1: Foundation

Set up tooling infrastructure without breaking existing UI.

Install and configure Stylelint with design token enforcement. Add ESLint jsx-a11y rules to existing config. Create design agent file at `.claude/agents/design.md`. Add design principles reference to `specs/reference/`.

Validation: `npm run lint` passes on existing code (warnings acceptable, errors must be zero).

### Phase 2: Primitive Audit

Review and update shadcn/ui primitives for design compliance.

Audit each primitive in `src/components/ui/` against design principles. Fix spacing to 8pt grid. Ensure 44px minimum touch targets. Add missing focus states. Verify color contrast ratios. Document any intentional deviations.

Validation: `@design "Critique src/components/ui/"` produces no ❌ items.

### Phase 3: Component Rebuild

Rebuild Villa-specific components using design agent.

For each component: write or update product spec in `specs/active/`, run `@design "Bootstrap {Component} from specs/active/{spec}.md"`, review generated code and refine manually, add component tests with jest-axe assertions, update Storybook stories if applicable.

Priority order: NicknameInput (highest usage), VillaIdCard, AvatarSelector, OnboardingFlow, ProfileView.

### Phase 4: E2E Coverage

Add accessibility assertions to critical path tests.

Create Playwright accessibility fixture with axe-core integration. Add a11y checks to P0 flows: Create Villa ID, Sign In, Nickname Claim. Add a11y checks to P1 flows: Avatar Selection, Profile View. Configure CI to fail on accessibility violations.

---

## External Tool Workflows

### shadcn/ui — Always Check First

Before building any standard UI pattern, check if shadcn/ui has it:

```bash
# Add a new shadcn component
npx shadcn-ui@latest add [component]

# Check what's available
npx shadcn-ui@latest add --help
```

After adding, customize in `src/components/ui/` with Villa's design tokens. Never fight the component API; if it doesn't fit your needs, look elsewhere.

### 21st.dev — The Inspiration Layer

When shadcn doesn't have what you need, browse 21st.dev for human-curated patterns.

The 21st.dev GUI integrates with Claude Code repositories. Check `configs/` for integration settings. The @design agent should read these configs to understand available component mappings and repo-specific customizations.

When adapting 21st.dev components, always replace colors, spacing, and typography with Villa tokens. Credit original authors in code comments. Document adaptation decisions in `LEARNINGS.md`.

### Animation Integration

For animation-heavy features, pull from specialized sources:

**Magic UI** (https://magicui.design/) — Framer Motion components for hero sections, animated backgrounds, text effects. Use for onboarding and marketing surfaces.

**Aceternity UI** (https://ui.aceternity.com/) — Advanced effects, 3D transforms, particle systems. Use sparingly for premium moments.

**LottieFiles** (https://lottiefiles.com/) — Pre-made Lottie animations for loading states, empty states, success celebrations. Or export custom animations from After Effects.

### Lottie Implementation

When a spec calls for an animated loading state, empty state, or celebration:

```typescript
// Install lottie-react
npm install lottie-react

// Usage
import Lottie from 'lottie-react';
import loadingAnimation from '@/animations/loading.json';

<Lottie 
  animationData={loadingAnimation}
  loop={true}
  className="w-16 h-16"
/>
```

Store Lottie JSON files in `src/animations/`. Keep file sizes small (<50KB for UI elements).

### Parallax & Scroll Effects

For landing pages and marketing surfaces, use Framer Motion scroll effects:

```typescript
import { useScroll, useTransform, motion } from 'framer-motion';

const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

<motion.div style={{ y, opacity }}>
  Content moves up and fades as you scroll
</motion.div>
```

Test on mid-range devices. Disable for `prefers-reduced-motion`.

### v0.dev — Rapid Prototyping (Secondary)

Use v0.dev when you need a quick starting point. Prompt template: "Create a React component for [description]. Use Tailwind CSS with 8pt spacing grid. Include states: default, hover, focus, loading, disabled, error."

Always review and adapt output to Villa's design system before committing.

---

## Tasks

### Foundation Setup
- [ ] Install Stylelint and configure design token enforcement
- [ ] Add jsx-a11y rules to ESLint configuration  
- [ ] Create `.claude/agents/design.md` from spec
- [ ] Add `specs/reference/design-principles.md`
- [ ] Create `configs/21st.config.json` for 21st.dev integration
- [ ] Verify `npm run lint` passes

### Animation Infrastructure
- [ ] Install lottie-react for Lottie animations
- [ ] Install framer-motion for interactive animations
- [ ] Create `src/animations/` directory for Lottie JSON files
- [ ] Add loading.json, success.json, empty.json Lottie files
- [ ] Create motion-reduce utility hook

### Primitive Audit
- [ ] Audit Button for design compliance
- [ ] Audit Input and form controls
- [ ] Audit Card and container components
- [ ] Audit Dialog and overlay components
- [ ] Audit Avatar and Badge components
- [ ] Document findings in `LEARNINGS.md`

### Component Rebuilds
- [ ] Spec and rebuild NicknameInput with validation animations
- [ ] Spec and rebuild VillaIdCard with micro-interactions
- [ ] Spec and rebuild AvatarSelector with smooth transitions
- [ ] Spec and rebuild OnboardingFlow with Lottie illustrations
- [ ] Spec and rebuild ProfileView with parallax header
- [ ] Create EmptyState pattern with Lottie animation
- [ ] Create LoadingCard with Lottie or skeleton

### External Integration
- [ ] Document 21st.dev component adaptation workflow
- [ ] Create template for crediting external sources
- [ ] Set up 21st.dev GUI integration if available
- [ ] Curate list of useful 21st.dev components for Villa

### Testing Infrastructure
- [ ] Add jest-axe to component test setup
- [ ] Create Playwright accessibility fixture
- [ ] Add a11y tests to Create Villa ID flow
- [ ] Add a11y tests to Sign In flow
- [ ] Add a11y tests to Nickname Claim flow
- [ ] Configure CI accessibility gates

---

## Out of Scope

Screenshot regression testing (too slow for CI, brittle across environments).

Figma plugin development (use existing tools like Locofy).

Custom design tool creation (leverage existing ecosystem).

Automated design generation without human review (AI bootstraps, humans refine).

Dark mode implementation (separate spec, depends on this foundation).

---

## Success Criteria

All primitives pass design agent critique with no ❌ items. All rebuilt components have jest-axe tests passing. Critical E2E paths include accessibility assertions. CI fails on Stylelint or jsx-a11y errors. Design agent can bootstrap new components from specs in under 5 minutes. Human refinement time reduced by 50% compared to manual implementation.

---

## Dependencies

Design agent file must be in place before Phase 3. ESLint and Stylelint configs must be committed before Phase 2. Product specs for each component must exist before rebuild. CI must support new lint rules before enforcement.

---

## References

Design principles: `specs/reference/design-principles.md`

Design agent: `.claude/agents/design.md`

shadcn/ui docs: https://ui.shadcn.com/

v0.dev: https://v0.dev/

21st.dev registry: https://21st.dev/

Apple HIG: https://developer.apple.com/design/human-interface-guidelines/

Telegram design: https://core.telegram.org/api/design
