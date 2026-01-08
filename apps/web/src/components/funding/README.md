# Funding Components - Design Documentation

## Overview

Cross-chain deposit functionality using Glide SDK. Enables users to fund their Villa ID (Base address) from any supported chain with a single click.

## Component Architecture

```
AddFundsButton (Entry Point)
    └── GlideDepositModal (Villa Chrome)
            └── Glide Widget (iframe/react component)
```

## Design Principles Applied

### Mobile-First (Apple HIG Compliance)

**Touch Targets:**
- All buttons: `min-h-11` (44px minimum)
- Icon buttons: `min-w-11` (44px minimum)
- Tested on iOS Safari, Android Chrome

**Bottom Sheet Behavior (Mobile):**
- Dialog slides up from bottom on mobile
- Swipe-to-dismiss enabled (Radix Dialog default)
- Safe area insets respected (iOS notch/home indicator)
- Content scrollable within modal
- Max height: 90vh (never covers full screen)

**Desktop Behavior:**
- Centered modal with `max-w-lg` (512px)
- Overlay backdrop with 80% opacity
- Escape key to close
- Focus trap enabled

### Color System (Design Tokens)

All colors from `tailwind.config.ts`:

| Element | Token | Hex | Usage |
|---------|-------|-----|-------|
| Primary CTA | `accent-yellow` | `#ffe047` | Add Funds button, Glide primary |
| Background | `cream-50` | `#fffcf8` | Modal background |
| Text primary | `ink` | `#0d0d17` | Headlines, body text |
| Text secondary | `ink-muted` | `#61616b` | Helper text, labels |
| Success | `accent-green` | `#698f69` | Success state, checkmarks |
| Error | `error-text` | `#dc2626` | Error messages |
| Border | `neutral-100` | `#e0e0e6` | Dividers, card borders |

**Accent Restraint:** Maximum 2 accent colors per screen
- Home page: Add Funds button (yellow) + one status indicator
- Success modal: Celebration animation + success color
- Error modal: Error icon (red) only

### Typography Scale

| Element | Class | Size | Usage |
|---------|-------|------|-------|
| Modal title | `text-lg` | 18px | DialogTitle |
| Body text | `text-sm` | 14px | DialogDescription, messages |
| Helper text | `text-xs` | 12px | Hints, timestamps |
| Button text | `text-base` | 16px | CTA labels |

**Line length:** Max 75 characters in modal content

### Spacing (8pt Grid)

| Element | Spacing | Pixels |
|---------|---------|--------|
| Modal padding | `p-6` | 24px |
| Section gaps | `space-y-6` | 24px |
| Card padding | `p-4` | 16px |
| Button gaps | `gap-2` | 8px |

All spacing on 8pt grid - no arbitrary values like `p-[15px]`.

### Animation Guidelines

**Duration:**
- Modal open/close: 200ms (`duration-200`)
- Button hover: 150ms (`duration-150`)
- Success celebration: 1000ms (Lottie)

**Easing:**
- Modal: `ease-out` (decelerate into rest)
- Hover: `ease-in-out`

**Hardware Acceleration:**
- Modal uses `transform` and `opacity` (GPU-accelerated)
- No animation of `width`, `height`, `left`, `top`

**Motion Reduction:**
```tsx
className="transition-transform motion-reduce:transition-none"
```

Respects `prefers-reduced-motion` user preference.

### States Handled

Every component implements all states:

| State | AddFundsButton | GlideDepositModal |
|-------|----------------|-------------------|
| Default | Yellow button | n/a |
| Hover | Darker yellow | n/a |
| Focus | Ring indicator | n/a |
| Disabled | 50% opacity | n/a |
| Loading | n/a | Spinner + message |
| Active | n/a | Glide widget |
| Success | n/a | Lottie + details |
| Error | n/a | Error icon + message |
| Empty | Helper text | n/a |

## User Flow

```
Home Page
    ↓ Tap "Add Funds"
Bottom Sheet Opens (mobile) / Modal Opens (desktop)
    ↓ Loading state (500ms)
Glide Widget Active
    ↓ User completes deposit in Glide
Success State
    ├── Lottie celebration (1s)
    ├── Transaction details
    ├── Block explorer link
    └── "Done" button → closes modal
```

## Component APIs

### AddFundsButton

```tsx
<AddFundsButton
  recipientAddress={identity.address}  // Required: Base address
  variant="primary"                     // Optional: 'primary' | 'secondary'
  className="mt-4"                      // Optional: Layout adjustments
/>
```

**Props:**
- `recipientAddress`: User's Porto smart account address (Base mainnet)
- `variant`: Button style - `primary` (yellow) for home page, `secondary` for Settings
- `className`: Additional Tailwind classes for positioning

### GlideDepositModal

```tsx
<GlideDepositModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  recipientAddress={identity.address}
  onSuccess={(tx) => console.log('Success:', tx)}
  onError={(err) => console.error('Error:', err)}
/>
```

**Props:**
- `isOpen`: Boolean, controlled by parent
- `onClose`: Callback when modal closes
- `recipientAddress`: User's Base address
- `onSuccess`: Optional callback with transaction details
- `onError`: Optional callback with error

## Glide Theme Configuration

**File:** `apps/web/src/lib/glide.ts`

Theme matched to Villa design tokens:

```typescript
const villaGlideTheme = {
  colors: {
    primary: '#ffe047',        // accent-yellow
    background: '#fffcf8',     // cream-50
    text: '#0d0d17',           // ink
    success: '#698f69',        // accent-green
    error: '#dc2626',          // error-text
    // ... (see file for complete mapping)
  },
  borderRadius: {
    button: '8px',
    card: '12px',
    modal: '14px',
  },
}
```

**Design boundaries:**
- Villa controls: Button placement, success/error UI, theme colors
- Glide controls: Wallet connection, token selection, fees, transaction flow (security-critical)

## Accessibility Checklist

- [x] All buttons have aria-label
- [x] Focus ring visible on all interactive elements
- [x] Keyboard navigation: Tab, Escape, Enter
- [x] Touch targets ≥44px
- [x] Color not sole indicator (icons + text)
- [x] Motion respects `prefers-reduced-motion`
- [x] Screen reader friendly (DialogTitle, DialogDescription)
- [x] Error messages specific and actionable

## Responsive Behavior

### Mobile (< 640px)

- Button: Full width (`w-full`)
- Modal: Bottom sheet with slide-up animation
- Content: Max height 90vh, scrollable
- Touch targets: Minimum 44×44px

### Desktop (≥ 640px)

- Button: Full width or inline (depends on placement)
- Modal: Centered, max-width 512px
- Content: Fixed height, scrollable if needed
- Hover states enabled

## Testing Checklist

**Visual:**
- [ ] Button renders on home page below profile card
- [ ] Modal opens on button click
- [ ] Success state shows Lottie celebration
- [ ] Error state shows error message + retry button
- [ ] Touch targets meet 44px minimum
- [ ] Colors match design tokens (no hardcoded hex)

**Interaction:**
- [ ] Button disabled when Glide not configured
- [ ] Modal closes on backdrop click
- [ ] Modal closes on Escape key
- [ ] Retry button re-initializes widget
- [ ] Block explorer link opens in new tab

**Responsive:**
- [ ] Mobile: Bottom sheet behavior
- [ ] Desktop: Centered modal
- [ ] Content scrollable on small screens
- [ ] Touch targets comfortable on mobile

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Focus trap in modal
- [ ] Screen reader announces modal title/description
- [ ] Motion reduced when user prefers

## Integration Notes

### Dependencies

```json
{
  "@paywithglide/glide-react": "^0.0.44"
}
```

### Environment Variables

```env
NEXT_PUBLIC_GLIDE_PROJECT_ID=villa-xyz
```

### Home Page Integration

```tsx
import { AddFundsButton } from '@/components/funding'

// Place after profile card, before ecosystem apps
<AddFundsButton
  recipientAddress={identity.address}
  variant="primary"
  className="my-6"
/>
```

## Future Enhancements (P2)

**Transaction History:**
- Store completed deposits in localStorage
- Show recent deposits on home page
- Sync via TinyCloud

**Headless Integration:**
- Custom UI for deposit flow
- Full animation control
- Better Villa branding

**Advanced Features:**
- QR code for receive address
- Copy address to clipboard
- Push notification when funds arrive

## References

- [Glide Documentation](https://docs.buildwithglide.com)
- [Villa Design Principles](../../../specs/reference/design-principles.md)
- [Cross-Chain Deposits Spec](../../../specs/active/cross-chain-deposits.md)
- [Apple HIG - Modals](https://developer.apple.com/design/human-interface-guidelines/modality)
- [Radix Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)

---

**Last Updated:** 2026-01-08
**Design Review:** Pending
**Implementation Status:** Components created, Glide SDK integration pending
