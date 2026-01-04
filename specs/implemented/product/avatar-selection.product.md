# Product Spec: Avatar Selection

**Source:** `/specs/villa-identity-sdk-and-storage.md` (Section 4)
**Created:** 2026-01-04
**Product Lead:** @product

---

## Executive Summary

The Avatar Selection experience lets new users pick a visual identity through a playful, time-limited interaction. Users select a gender/style preference (Male, Female, or Other), see a generated avatar based on their wallet address, and can randomize to explore variants. A 30-second countdown timer adds urgency and prevents overthinking — when time runs out, the current avatar is automatically selected. The result is a unique, deterministic avatar that looks the same everywhere.

**Who it's for:** New Villa users completing their identity setup after claiming a nickname.

**Why it matters:** Visual identity matters in communities. Avatars make users recognizable and add personality to interactions. The timer gamifies the selection to make it fun and fast.

---

## Jobs to Be Done

### Primary Job: Get a Visual Identity

**When I...** am setting up my Villa identity
**I want to...** pick an avatar that represents me
**So I can...** be visually recognized across Village apps and feel like "me"

**Success Criteria:**
- [ ] Avatar selected in <30 seconds (timer enforces this)
- [ ] User feels represented by their avatar
- [ ] Same avatar displays consistently across all apps
- [ ] Selection is fun, not stressful

### Secondary Jobs

| Job | Context | Desired Outcome | Priority |
|-----|---------|-----------------|----------|
| Explore options | Want to see what's possible | "Randomize" shows variety | P1 |
| Express identity | Gender/style matters to me | Three distinct style options | P1 |
| Avoid decision fatigue | Too many choices is paralyzing | Timer limits overthinking | P2 |
| Consistency | Want same avatar everywhere | Deterministic generation | P1 |

---

## User Value Matrix

| Feature | User Sees | User Gets | User Never Knows |
|---------|-----------|-----------|------------------|
| Style selector | Male / Female / Other buttons | Style that fits their identity | DiceBear style mapping |
| Avatar display | Visual avatar preview | See what others will see | SVG generation, seed algorithm |
| Randomize | "Randomize" button | Explore variants | Variant counter, deterministic seeds |
| Timer | 30-second countdown | Urgency without stress | Auto-select logic |
| Auto-select | Avatar locked at 0:00 | Decision made for them | Storage optimization |

---

## User Flows

### Flow 1: Happy Path (Quick Selection)

**Entry Point:** User claimed nickname, proceeds to avatar
**Happy Path:**
1. User sees avatar screen with timer at 0:30
2. User selects a style (Male/Female/Other)
3. Avatar generates based on wallet + style
4. User optionally taps "Randomize" to see variants
5. User taps "Select" before timer ends
6. Proceeds to completion screen

**Flow Duration Target:** 5-30 seconds (timer caps it)

```
┌─────────────────────────────────────┐
│          Pick your look             │ ← text-2xl font-semibold
│                                     │
│   [Male]  [Female]  [Other]         │ ← 3 toggle buttons
│                                     │
│        ┌───────────────┐            │
│        │               │            │
│        │   (avatar)    │            │ ← 128x128 preview
│        │               │            │
│        └───────────────┘            │
│                                     │
│     [Randomize]          0:25       │ ← Ghost button + timer
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Select]             │   │ ← Primary CTA
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Flow 2: Timer Auto-Select

**Entry Point:** User doesn't tap "Select" in time
**Path:**
1. Timer reaches 0:00
2. Current avatar is automatically selected
3. Brief "Avatar selected!" confirmation
4. Proceeds to completion screen

```
Timer: 0:03 → 0:02 → 0:01 → 0:00

┌─────────────────────────────────────┐
│                                     │
│        [Success Check]              │
│                                     │
│       Avatar selected!              │
│                                     │
│                                     │
└─────────────────────────────────────┘

            │ (auto-advance after 1s)
            ▼

[Proceeds to Completion]
```

### Flow 3: Exploring Variants

**Entry Point:** User wants to see more options
**Path:**
1. User taps "Randomize" repeatedly
2. Each tap shows new variant (same style)
3. Timer continues counting down
4. User eventually selects or timer runs out

```
Tap 1:
┌─────────────────────────────────────┐
│          Pick your look             │
│                                     │
│   [Male]  [Female]  [Other]         │
│                                     │
│        ┌───────────────┐            │
│        │  (variant 1)  │            │
│        └───────────────┘            │
│                                     │
│     [Randomize]          0:22       │
│                                     │
└─────────────────────────────────────┘

Tap 2:
┌─────────────────────────────────────┐
│          Pick your look             │
│                                     │
│   [Male]  [Female]  [Other]         │
│                                     │
│        ┌───────────────┐            │
│        │  (variant 2)  │            │ ← New avatar
│        └───────────────┘            │
│                                     │
│     [Randomize]          0:19       │
│                                     │
└─────────────────────────────────────┘
```

### Flow 4: Switching Styles

**Entry Point:** User wants different style category
**Path:**
1. User initially sees default style (neutral)
2. User taps "Female" button
3. Avatar regenerates in female style
4. Variant resets to 0

```
Before:
   [Male]  [Female]  [Other]
      ↑ selected (default)

After tapping "Female":
   [Male]  [Female]  [Other]
              ↑ selected

   Avatar regenerates with anime-female style
```

---

## Screen Specifications

### Screen: Avatar Selection

**Purpose:** Choose visual identity
**Entry conditions:** Nickname claimed
**Exit conditions:** User taps "Select" OR timer reaches 0:00

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│          Pick your look             │ ← Headline (24px gap below)
│                                     │
│   ┌───────┐ ┌───────┐ ┌───────┐    │
│   │ Male  │ │Female │ │ Other │    │ ← Toggle group, 8px gap
│   └───────┘ └───────┘ └───────┘    │
│                                     │ (16px gap)
│        ┌───────────────┐            │
│        │               │            │
│        │   128x128     │            │ ← Avatar preview
│        │               │            │
│        └───────────────┘            │
│                                     │ (16px gap)
│   [Randomize]          0:25         │ ← Ghost button + timer
│                                     │ (24px gap)
│   ┌─────────────────────────────┐   │
│   │        [Select]             │   │ ← Primary CTA, 44px
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Copy Standards:**

| Element | Text | Notes |
|---------|------|-------|
| Headline | "Pick your look" | Casual, fun tone |
| Style: Male | "Male" | Generates anime-male style |
| Style: Female | "Female" | Generates anime-female style |
| Style: Other | "Other" | Generates neutral/Vietnamese style |
| Randomize | "Randomize" | Ghost button, icon optional |
| Timer | "0:25" | MM:SS format, red when <10s |
| Select CTA | "Select" | Always enabled |
| Auto-select toast | "Avatar selected!" | Brief confirmation |

**States:**

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Timer at 0:30, default style selected | User can interact |
| Style changing | Brief fade transition | Avatar regenerates |
| Randomizing | Brief pulse animation | Variant increments |
| Timer warning | Timer turns red at <10s | Urgency signal |
| Timer critical | Timer pulses at <5s | Strong urgency |
| Selecting | Button shows spinner | Avatar being saved |
| Auto-selected | Toast notification | Timer hit 0:00 |

**Timer Behavior:**

| Time | Visual | Audio (optional) |
|------|--------|------------------|
| 30-11s | White/default timer | None |
| 10-6s | Red timer | None |
| 5-1s | Red pulsing timer | Tick sound (if enabled) |
| 0s | Auto-select triggered | Success sound (if enabled) |

---

## Analytics Requirements

### Key Metrics

| Metric | Definition | Target | Tracking Method |
|--------|------------|--------|-----------------|
| Selection rate | Selected / Shown | >98% (timer guarantees) | Events |
| Manual selection rate | Tapped Select / Total | >70% | Events |
| Style distribution | % each style chosen | Balanced | Events |
| Randomize usage | Users who tapped Randomize | Monitor | Events |
| Time to select | Screen shown to selected | <15s avg | Event timestamps |

### Events to Track

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `avatar_screen_shown` | Screen displayed | `timer_start: 30` | Funnel start |
| `avatar_style_selected` | User tapped style | `style`, `previous_style` | Style preference |
| `avatar_randomized` | User tapped Randomize | `randomize_count`, `timer_remaining` | Engagement |
| `avatar_selected_manual` | User tapped Select | `style`, `variant`, `timer_remaining`, `randomize_count` | Manual selection |
| `avatar_selected_auto` | Timer reached 0:00 | `style`, `variant`, `randomize_count` | Auto-selection |
| `avatar_saved` | Successfully stored | `duration_ms` | Completion |

---

## Test Scenarios (User Perspective)

### Scenario 1: Quick selection

**Given** I am on the avatar selection screen
**When** I tap "Select" within 5 seconds
**Then** my avatar is saved
**And** I proceed to the completion screen

### Scenario 2: Style selection

**Given** I am on the avatar selection screen with Male selected
**When** I tap "Female"
**Then** my avatar regenerates in the female style
**And** the timer continues from where it was

### Scenario 3: Randomize variants

**Given** I am on the avatar selection screen
**When** I tap "Randomize" three times
**Then** I see three different avatars in the same style
**And** each avatar is distinct

### Scenario 4: Timer auto-select

**Given** I am on the avatar selection screen
**When** I don't tap "Select" and the timer reaches 0:00
**Then** my current avatar is automatically selected
**And** I see "Avatar selected!" briefly
**And** I proceed to the completion screen

### Scenario 5: Timer warning

**Given** I am on the avatar selection screen
**When** the timer reaches 10 seconds
**Then** the timer text turns red
**And** at 5 seconds, it begins pulsing

### Scenario 6: Consistent avatar across devices

**Given** I selected avatar style "Female" variant 5
**When** I sign in on another device
**Then** I see the exact same avatar
**Because** it's generated from my wallet address + variant

---

## UX Components (21st.dev / Shadcn)

| Component | Use Case | Customization |
|-----------|----------|---------------|
| Toggle Group | Style selector (Male/Female/Other) | 3 items, exclusive selection |
| Avatar | Preview display | 128x128, rounded-full |
| Button (ghost) | "Randomize" | Icon + text |
| Button (primary) | "Select" | Yellow, full-width, 44px |
| Timer | Countdown display | Font-mono, color changes |
| Toast | "Avatar selected!" | Success variant, auto-dismiss |

---

## Scope Boundaries

### In Scope (v1)

- Three style categories (Male, Female, Other)
- Randomize to explore variants
- 30-second timer with auto-select
- Deterministic avatar generation
- SVG output for display
- Minimal storage (style + variant only)

### Out of Scope (v1)

- Custom avatar builder (pick hair, eyes, etc.) — future
- Avatar uploads — future
- NFT avatar imports — future
- Timer skip/pause — by design
- Animated avatars — future
- PNG export from picker (SDK handles on demand)

### Dependencies

- DiceBear library (`@dicebear/core`)
- Style configurations (lorelei for male/female, notionistsNeutral for other)
- TinyCloud (storing style + variant)

---

## Success Definition

**This feature is successful when:**
1. 98%+ of users get an avatar (timer guarantees completion)
2. >70% of users manually select (vs. auto-select)
3. Style distribution is reasonably balanced (no style >60%)
4. Users report the experience as "fun" not "stressful"

**We will validate by:**
- Funnel completion rate (should be ~100%)
- Manual vs. auto-select ratio
- Style distribution analytics
- User feedback on avatar selection experience

---

## Implementation Notes

### Avatar Generation

```typescript
function generateAvatar(
  walletAddress: string,
  style: 'anime-male' | 'anime-female' | 'vietnam' | 'neutral',
  variant: number
): string {
  const seed = `${walletAddress.toLowerCase()}-${variant}`;
  const avatar = createAvatar(STYLE_MAP[style], {
    seed,
    size: 128
  });
  return avatar.toString(); // SVG string
}
```

**Deterministic:** Same wallet + variant = same avatar forever.

### Storage

Only store the minimal data needed:
```typescript
// TinyCloud profile
{
  avatar: {
    style: 'anime-female',
    variant: 42
  }
}
// ~30 bytes, not the 5-15KB SVG
```

### Style Mapping

| User Selection | Internal Style | DiceBear Collection |
|----------------|----------------|---------------------|
| Male | `anime-male` | lorelei (male config) |
| Female | `anime-female` | lorelei (female config) |
| Other | `vietnam` / `neutral` | notionistsNeutral |

### Timer Implementation

```typescript
// Start at 30, count down every second
const [timer, setTimer] = useState(30);

useEffect(() => {
  if (timer <= 0) {
    handleAutoSelect();
    return;
  }
  const interval = setInterval(() => {
    setTimer(t => t - 1);
  }, 1000);
  return () => clearInterval(interval);
}, [timer]);
```

### Variant Counter

```typescript
const [variant, setVariant] = useState(0);

const handleRandomize = () => {
  setVariant(v => v + 1);
  track('avatar_randomized', {
    randomize_count: variant + 1,
    timer_remaining: timer
  });
};
```

### Performance

- SVG generation: <20ms (target)
- Style switch: <50ms total (including regeneration)
- No network calls during selection (all client-side)
- Avatar saved to TinyCloud only on selection

### Accessibility

- Style buttons keyboard navigable
- Timer has aria-live for screen readers
- Randomize announces "New avatar generated"
- Color contrast on timer warning states
