/**
 * Integration Example: AddFundsButton on Home Page
 *
 * This file shows how to integrate the AddFundsButton component
 * into the existing home page layout.
 *
 * Placement: After profile card, before ecosystem apps
 * Design: Full-width button with helper text
 * Mobile: Bottom sheet modal
 * Desktop: Centered modal
 */

// apps/web/src/app/home/page.tsx

// Add to imports:
// import { AddFundsButton } from '@/components/funding'

// Add after profile card (around line 311), before ecosystem apps (line 326):

/*
        </Card>

        {/* Add Funds - Cross-chain deposits via Glide */}
        <AddFundsButton
          recipientAddress={identity.address}
          variant="primary"
        />

        {/* Ecosystem Apps */}
        <Card>
*/

// Full context example:

export default function HomePageWithFunding() {
  // ... existing state and hooks

  return (
    <main className="min-h-screen p-6 bg-cream-50">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Existing header */}
        <header className="flex items-center justify-between">
          {/* ... */}
        </header>

        {/* Existing profile card */}
        <Card>
          <CardContent className="flex flex-col items-center space-y-4 py-8">
            {/* Avatar, display name, address */}
          </CardContent>
        </Card>

        {/* Existing status card */}
        <Card>
          <CardContent className="space-y-3">
            {/* Created date, status */}
          </CardContent>
        </Card>

        {/* 🆕 NEW: Add Funds Button */}
        <AddFundsButton
          recipientAddress={identity.address}
          variant="primary"
        />

        {/* Existing ecosystem apps */}
        <Card>
          <CardContent className="space-y-4">
            {/* Ecosystem apps list */}
          </CardContent>
        </Card>

        {/* Existing footer */}
        <div className="pt-4 space-y-2">
          {/* Switch account button */}
        </div>
      </div>
    </main>
  )
}

/**
 * Visual Hierarchy:
 *
 * 1. Profile Card (identity)
 *    └── Avatar, name, address
 *
 * 2. Status Card (metadata)
 *    └── Created date, status
 *
 * 3. Add Funds Button ⭐ NEW
 *    └── Primary action (yellow accent)
 *    └── Helper: "Deposit from any chain"
 *
 * 4. Ecosystem Apps Card
 *    └── Recent apps, all apps
 *
 * 5. Footer
 *    └── Switch account
 */

/**
 * Alternative Placement: Settings Page
 *
 * If you want to also add funding from settings:
 */

// apps/web/src/app/settings/page.tsx

export function SettingsPageWithFunding() {
  return (
    <main className="min-h-screen p-6 bg-cream-50">
      <div className="max-w-sm mx-auto space-y-6">
        {/* ... other settings */}

        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-medium text-ink">Wallet</h3>

            {/* Add Funds - Secondary variant for settings */}
            <AddFundsButton
              recipientAddress={identity.address}
              variant="secondary"
            />

            {/* Other wallet actions */}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

/**
 * Mobile Experience:
 *
 * 1. User taps "Add Funds" button
 * 2. Bottom sheet slides up from bottom (covers 90% of screen)
 * 3. Glide widget rendered inside Villa chrome
 * 4. User completes deposit in Glide
 * 5. Success: Lottie celebration + details
 * 6. User taps "Done" → modal slides down, closes
 *
 * Total time: ~30 seconds (fast, frequent usage model)
 */

/**
 * Desktop Experience:
 *
 * 1. User clicks "Add Funds" button
 * 2. Modal fades in center screen (512px wide)
 * 3. Backdrop darkens page (80% opacity)
 * 4. Glide widget rendered
 * 5. User completes deposit
 * 6. Success: Celebration + details
 * 7. User clicks "Done" or presses Escape → modal fades out
 */
