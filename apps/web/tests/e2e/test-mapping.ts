/**
 * Component-to-Test Mapping
 *
 * Maps source file patterns to E2E test files for intelligent test selection.
 * Used by CI to run only relevant tests when files change.
 *
 * Pattern matching:
 * - Exact paths: 'src/components/sdk/VillaAuth.tsx'
 * - Globs: 'src/components/funding/**'
 * - Multiple patterns can map to same test file
 *
 * Special cases:
 * - 'all' means run all tests (for core infra changes)
 */

export interface TestMapping {
  /** Source file patterns that trigger these tests */
  patterns: string[]
  /** E2E test files to run */
  tests: string[]
}

export const componentToTestMapping: TestMapping[] = [
  // Onboarding flow
  {
    patterns: [
      'src/app/onboarding/**',
      'src/components/sdk/VillaAuth.tsx',
      'src/components/sdk/VillaAuthScreen.tsx',
      'src/components/sdk/VillaAuthDialog.tsx',
      'src/components/sdk/PasskeyPrompt.tsx',
      'src/components/sdk/NicknameSelection.tsx',
      'src/components/sdk/AvatarSelection.tsx',
      'src/lib/porto.ts',
    ],
    tests: ['tests/e2e/onboarding.spec.ts'],
  },

  // Funding / Cross-chain deposits
  {
    patterns: [
      'src/components/funding/**',
      'src/app/home/**',
      'src/lib/glide.ts',
    ],
    tests: ['tests/e2e/funding.spec.ts'],
  },

  // Developer portal
  {
    patterns: [
      'src/app/developers/**',
      'src/components/developers/**',
    ],
    tests: ['tests/e2e/developer-portal.spec.ts'],
  },

  // Avatar selection
  {
    patterns: [
      'src/components/sdk/AvatarSelection.tsx',
      'src/components/sdk/AvatarImage.tsx',
      'src/components/sdk/AvatarUpload.tsx',
      'src/components/sdk/AvatarPreview.tsx',
      'src/lib/avatar/**',
    ],
    tests: ['tests/e2e/avatar-selection.spec.ts'],
  },

  // Nickname editing
  {
    patterns: [
      'src/components/sdk/profile/**',
      'src/components/sdk/ProfileSettings.tsx',
      'src/lib/nickname.ts',
    ],
    tests: ['tests/e2e/nickname-edit.spec.ts'],
  },

  // Guestbook
  {
    patterns: ['src/app/guestbook/**'],
    tests: ['tests/e2e/guestbook.spec.ts'],
  },

  // SDK integration tests
  {
    patterns: [
      'src/components/sdk/AuthIframe.tsx',
      'src/components/sdk/VillaBridge.tsx',
      'packages/sdk/**',
    ],
    tests: [
      'tests/e2e/sdk-bridge.spec.ts',
      'tests/e2e/sdk-iframe.spec.ts',
      'tests/e2e/sdk-live.spec.ts',
    ],
  },

  // Auth flows
  {
    patterns: [
      'src/app/auth/**',
      'src/components/sdk/SignInWelcome.tsx',
      'src/components/sdk/ConsentRequest.tsx',
      'src/lib/webauthn-errors.ts',
    ],
    tests: [
      'tests/e2e/auth-flows.spec.ts',
      'tests/e2e/passkey-live.spec.ts',
      'tests/e2e/passkey-crossplatform.spec.ts',
    ],
  },

  // Returning user flow
  {
    patterns: [
      'src/lib/store.ts',
      'src/lib/storage/**',
    ],
    tests: ['tests/e2e/returning-user.spec.ts'],
  },

  // Integration tests (cross-cutting)
  {
    patterns: [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/providers/**',
    ],
    tests: ['tests/e2e/integration.spec.ts'],
  },
]

/**
 * Core infrastructure patterns that require running ALL tests
 */
export const coreInfraPatterns = [
  'src/lib/porto.ts',
  'src/lib/store.ts',
  'src/lib/contracts/**',
  'src/lib/db/**',
  'src/app/layout.tsx',
  'src/providers/**',
  'package.json',
  'turbo.json',
  'playwright.config.ts',
]

/**
 * Get test files to run based on changed file paths
 */
export function getTestsForChanges(changedFiles: string[]): string[] | 'all' {
  // Check if any core infra file changed
  const hasCoreChange = changedFiles.some((file) =>
    coreInfraPatterns.some((pattern) => matchPattern(file, pattern))
  )

  if (hasCoreChange) {
    return 'all'
  }

  // Collect all matching test files
  const testFiles = new Set<string>()

  for (const file of changedFiles) {
    for (const mapping of componentToTestMapping) {
      if (mapping.patterns.some((pattern) => matchPattern(file, pattern))) {
        mapping.tests.forEach((test) => testFiles.add(test))
      }
    }
  }

  // If no specific tests matched, run all tests (safe default)
  if (testFiles.size === 0) {
    return 'all'
  }

  return Array.from(testFiles).sort()
}

/**
 * Simple pattern matching (supports ** glob for directories)
 */
function matchPattern(filePath: string, pattern: string): boolean {
  // Normalize paths
  const normalizedFile = filePath.replace(/\\/g, '/')
  const normalizedPattern = pattern.replace(/\\/g, '/')

  // Exact match
  if (normalizedFile === normalizedPattern) {
    return true
  }

  // Convert glob pattern to regex
  const regexPattern = normalizedPattern
    .replace(/\*\*/g, '.*') // ** matches any depth
    .replace(/\*/g, '[^/]*') // * matches within one directory level
    .replace(/\./g, '\\.') // Escape dots

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(normalizedFile)
}

/**
 * Get all E2E test files
 */
export function getAllTestFiles(): string[] {
  const allTests = new Set<string>()

  for (const mapping of componentToTestMapping) {
    mapping.tests.forEach((test) => allTests.add(test))
  }

  return Array.from(allTests).sort()
}
