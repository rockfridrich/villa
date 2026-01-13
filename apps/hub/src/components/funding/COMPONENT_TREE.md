# Cross-Chain Deposits - Component Architecture

Visual representation of component hierarchy and data flow.

---

## Component Tree

```
┌─────────────────────────────────────────────────────────────┐
│                         Home Page                           │
│                    (apps/web/src/app/home)                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌──────────────────────┐  ┌────────────────────────┐
    │    WalletCard        │  │   AddFundsButton       │
    │  (Balance Display)   │  │   (Primary CTA)        │
    └──────────────────────┘  └────────────────────────┘
                │                         │
                │                         │
                ├─ USDC Balance          └─ Opens Modal
                ├─ ETH Balance               │
                └─ AddFundsButton ◄──────────┤
                                             │
                                             ▼
                             ┌───────────────────────────┐
                             │  GlideDepositModal        │
                             │  (Villa Chrome)           │
                             └───────────────────────────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
                     ▼                   ▼                   ▼
            ┌────────────┐      ┌────────────┐     ┌────────────┐
            │  Loading   │      │   Active   │     │  Complete  │
            │  State     │      │   State    │     │  State     │
            └────────────┘      └────────────┘     └────────────┘
                 │                    │                   │
                 │                    │              ┌────┴────┐
                 ▼                    ▼              ▼         ▼
            ┌─────────┐      ┌───────────────┐  ┌────────┐ ┌──────┐
            │ Spinner │      │ Glide Widget  │  │Success │ │Error │
            └─────────┘      │  (iframe)     │  │State   │ │State │
                             └───────────────┘  └────────┘ └──────┘
                                                     │         │
                                                     ▼         ▼
                                            ┌──────────────┐ ┌────────────┐
                                            │ DepositSuccess│ │DepositError│
                                            │ - Lottie      │ │ - Icon     │
                                            │ - Details     │ │ - Message  │
                                            │ - Explorer    │ │ - Retry    │
                                            └──────────────┘ └────────────┘
```

---

## Data Flow

### 1. User Opens Modal

```
User taps "Add Funds"
        ↓
AddFundsButton.onClick()
        ↓
setIsModalOpen(true)
        ↓
GlideDepositModal opens
        ↓
State: 'loading'
        ↓
Initialize Glide SDK
        ↓
State: 'active'
```

### 2. User Completes Deposit (Success Path)

```
Glide Widget
        ↓
User completes transaction in external wallet
        ↓
Glide callback: onTransactionComplete
        ↓
handleSuccess(transaction)
        ↓
State: 'success'
        ↓
DepositSuccess renders
        ↓
- Show Lottie celebration (1s)
- Display transaction details
- Show BaseScan link
        ↓
User taps "Done"
        ↓
onClose()
        ↓
Modal closes
```

### 3. User Encounters Error (Error Path)

```
Glide Widget
        ↓
Transaction fails (rejected, timeout, etc.)
        ↓
Glide callback: onError
        ↓
handleError(error)
        ↓
State: 'error'
        ↓
DepositError renders
        ↓
- Show error icon
- Display friendly message (via getErrorMessage)
- Show retry/cancel buttons
        ↓
User chooses:
        ├─ "Try Again" → handleRetry() → State: 'loading'
        └─ "Cancel" → onClose() → Modal closes
```

---

## Component Responsibilities

### WalletCard
**Owns:**
- Balance display (USDC, ETH)
- Loading states (skeleton loaders)
- Empty state messaging
- Containing AddFundsButton

**Does NOT own:**
- Modal state
- Transaction logic
- Glide integration

---

### AddFundsButton
**Owns:**
- Button UI and states (default, hover, focus, disabled)
- Opening GlideDepositModal
- Helper text display

**Does NOT own:**
- Modal content
- Transaction flow
- Success/error handling

---

### GlideDepositModal
**Owns:**
- Modal state machine (loading → active → success/error)
- Villa chrome (DialogHeader, DialogContent)
- State transitions
- Glide SDK initialization
- Success/error delegation

**Does NOT own:**
- Glide widget internals (security-critical)
- Transaction signing
- Fee calculation

---

### DepositSuccess
**Owns:**
- Celebration animation
- Transaction detail display
- Block explorer link
- "Done" button

**Does NOT own:**
- Modal state
- Navigation logic (controlled by parent)

---

### DepositError
**Owns:**
- Error icon and styling
- User-friendly error message
- Retry/cancel buttons
- Recovery suggestions

**Does NOT own:**
- Error handling logic (controlled by parent)
- Glide re-initialization

---

## State Management

### Modal State Machine

```typescript
type ModalState = 'loading' | 'active' | 'success' | 'error'

Initial: 'loading'

Transitions:
  loading → active   (Glide SDK ready)
  active → success   (Transaction complete)
  active → error     (Transaction failed)
  error → loading    (User retries)
  * → closed         (User cancels/completes)
```

### Transaction State

```typescript
interface FundingTransaction {
  txHash: string       // On-chain transaction hash
  amount: string       // Amount deposited
  token: string        // Token symbol (USDC, ETH, etc.)
  sourceChain: string  // Source chain name
  timestamp: number    // Unix timestamp
  status: 'pending' | 'success' | 'failed'
}
```

### Parent Component State (Home Page)

```typescript
const [isModalOpen, setIsModalOpen] = useState(false)

// Optional: Track last transaction
const [lastTransaction, setLastTransaction] = useState<FundingTransaction | null>(null)

// Optional: Analytics
const handleSuccess = (tx: FundingTransaction) => {
  setLastTransaction(tx)
  trackEvent('funding_deposit_completed', {
    amount: tx.amount,
    token: tx.token,
    source_chain: tx.sourceChain,
  })
}
```

---

## UI Boundaries

### Villa Controls (Safe to customize)
- Button placement and styling
- Modal chrome (header, backdrop, close button)
- Success/error messaging
- Color theme passed to Glide
- Transaction display after completion

### Glide Controls (Security-critical, DO NOT override)
- Wallet connection flow
- Token/chain selection
- Amount input and validation
- Fee calculation and display
- Transaction signing prompts
- Transaction status tracking
- Error handling during transaction

**Rule:** Villa wraps Glide, never replaces it.

---

## Props Flow

### AddFundsButton Props
```typescript
recipientAddress: string    // From identity.address
variant: 'primary' | 'secondary'
className?: string
```

### GlideDepositModal Props
```typescript
isOpen: boolean             // From parent state
onClose: () => void         // Callback to parent
recipientAddress: string    // Passed to Glide
onSuccess?: (tx) => void    // Optional analytics
onError?: (err) => void     // Optional error tracking
```

### DepositSuccess Props
```typescript
txHash: string              // From Glide callback
amount: string              // From Glide callback
token: string               // From Glide callback
sourceChain: string         // From Glide callback
onContinue: () => void      // Callback to close modal
```

### DepositError Props
```typescript
error: Error | string       // From Glide callback
onRetry: () => void         // Re-initialize Glide
onCancel: () => void        // Close modal
```

---

## Theme Propagation

```
tailwind.config.ts (Design Tokens)
        ↓
lib/glide.ts (villaGlideTheme)
        ↓
GlideDepositModal (getGlideConfig)
        ↓
Glide Widget (theme prop)
        ↓
Rendered with Villa colors
```

All components use Tailwind classes that reference design tokens:
- `accent-yellow` → `#ffe047`
- `cream-50` → `#fffcf8`
- `ink` → `#0d0d17`
- `success.bg` → `#f0f9f0`
- `error.text` → `#dc2626`

**No hardcoded hex values in component code.**

---

## Animation Timeline

```
Modal Open
├─ 0ms: User taps button
├─ 0-200ms: Modal slides up (mobile) / fades in (desktop)
├─ 200ms: Loading spinner visible
├─ 500ms: Glide widget renders
└─ State: active

Transaction Complete (Success)
├─ 0ms: Glide callback fires
├─ 0-200ms: Transition to success state
├─ 200ms: Lottie starts (1000ms duration)
├─ 1200ms: Celebration complete, details visible
└─ User taps "Done" → Modal closes (200ms)

Total success flow: ~1.5 seconds
```

---

## Accessibility Tree

```
<button> "Add Funds"
  aria-label="Add funds to your Villa ID"
  role="button"
  tabindex="0"

<dialog>
  aria-modal="true"
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"

  <h2 id="dialog-title">Add Funds</h2>
  <p id="dialog-description">Deposit from any chain...</p>

  <button> Close
    aria-label="Close"
    tabindex="0"

  [Widget Content]
    <button>Retry</button>
    <button>Cancel</button>
```

---

## Responsive Breakpoints

```
Mobile (< 640px)
├─ Button: Full width (w-full)
├─ Modal: Bottom sheet (slide up)
├─ Content: Max height 90vh, scrollable
└─ Touch targets: 44×44px minimum

Desktop (≥ 640px)
├─ Button: Full width or inline
├─ Modal: Centered, max-w-lg (512px)
├─ Content: Fixed height, scrollable if needed
└─ Hover states: Enabled
```

---

## Integration Points

### 1. Home Page
```tsx
// After status card, before ecosystem apps
<AddFundsButton recipientAddress={identity.address} />
```

### 2. Settings Page
```tsx
// In Wallet section
<AddFundsButton
  recipientAddress={identity.address}
  variant="secondary"
/>
```

### 3. With Balance (Alternative)
```tsx
// Replace AddFundsButton with WalletCard
<WalletCard
  address={identity.address}
  balance={{ usdc: "100.00", eth: "0.0500" }}
  isLoading={isLoadingBalance}
/>
```

---

## File Dependencies

```
AddFundsButton.tsx
├─ Imports
│   ├─ @/components/ui (Button)
│   ├─ @/lib/glide (GLIDE_PROJECT_ID)
│   └─ ./GlideDepositModal
└─ Exports
    └─ AddFundsButton

GlideDepositModal.tsx
├─ Imports
│   ├─ @/components/ui (Dialog, Button, Spinner)
│   ├─ @/components/ui/success-celebration
│   ├─ @/lib/glide (getGlideConfig, getErrorMessage)
│   └─ ./DepositSuccess, ./DepositError (future)
└─ Exports
    └─ GlideDepositModal

WalletCard.tsx
├─ Imports
│   ├─ @/components/ui/card
│   └─ ./AddFundsButton
└─ Exports
    ├─ WalletCard
    ├─ WalletBalance (type)
    └─ WalletCardProps (type)

DepositSuccess.tsx
├─ Imports
│   ├─ @/components/ui/button
│   ├─ @/components/ui/success-celebration
│   └─ @/lib/glide (getExplorerUrl, formatChainName)
└─ Exports
    ├─ DepositSuccess
    └─ DepositSuccessProps (type)

DepositError.tsx
├─ Imports
│   ├─ @/components/ui/button
│   └─ @/lib/glide (getErrorMessage)
└─ Exports
    ├─ DepositError
    └─ DepositErrorProps (type)

index.ts
└─ Exports (barrel)
    ├─ AddFundsButton
    ├─ GlideDepositModal
    ├─ WalletCard + types
    ├─ DepositSuccess + types
    └─ DepositError + types
```

---

**Last Updated:** 2026-01-08
**Architecture:** Modular, composable, type-safe
**Design System:** Villa v1.0 (Proof of Retreat theme)
