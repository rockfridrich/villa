#!/usr/bin/env tsx
/**
 * E2E Test Selection Script
 *
 * Intelligently selects which E2E tests to run based on changed files.
 * Used by CI to optimize test execution time.
 *
 * Usage:
 *   # Compare current HEAD to main
 *   tsx scripts/select-e2e-tests.ts
 *
 *   # Compare specific commit range
 *   tsx scripts/select-e2e-tests.ts HEAD~1 HEAD
 *
 *   # Compare against a branch
 *   tsx scripts/select-e2e-tests.ts origin/main HEAD
 *
 * Output:
 *   - Prints "all" if all tests should run
 *   - Prints space-separated list of test files to run
 *   - Exit code 0 on success
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Import mapping from web app
const mappingPath = resolve(
  __dirname,
  '../apps/web/tests/e2e/test-mapping.ts'
)

if (!existsSync(mappingPath)) {
  console.error('Error: test-mapping.ts not found')
  process.exit(1)
}

// Dynamic import for ESM compatibility
async function main() {
  const { getTestsForChanges, getAllTestFiles } = await import(
    mappingPath
  )

  // Get commit range from args
  const [baseRef = 'origin/main', headRef = 'HEAD'] = process.argv.slice(2)

  try {
    // Get list of changed files
    const changedFiles = getChangedFiles(baseRef, headRef)

    if (changedFiles.length === 0) {
      console.log('No files changed, running all tests')
      console.log('all')
      process.exit(0)
    }

    // Get tests to run
    const testsToRun = getTestsForChanges(changedFiles)

    if (testsToRun === 'all') {
      console.log('Core infrastructure changed, running all tests')
      console.log('all')
    } else {
      console.log(
        `Selected ${testsToRun.length} test file(s) based on ${changedFiles.length} changed file(s)`
      )
      // Output test files space-separated for CI
      console.log(testsToRun.join(' '))
    }

    process.exit(0)
  } catch (error) {
    console.error('Error selecting tests:', error)
    // On error, run all tests (safe default)
    console.log('all')
    process.exit(0)
  }
}

/**
 * Get list of changed files between two git refs
 */
function getChangedFiles(baseRef: string, headRef: string): string[] {
  try {
    // Fetch remote refs if needed
    try {
      execSync('git fetch origin --quiet', { stdio: 'ignore' })
    } catch {
      // Ignore fetch errors (e.g., in CI with shallow clones)
    }

    // Get changed files using git diff
    const output = execSync(
      `git diff --name-only ${baseRef}...${headRef}`,
      {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    )

    return output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  } catch (error) {
    console.error('Error getting changed files:', error)
    return []
  }
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error)
  console.log('all')
  process.exit(0)
})
