# Villa Unit Testing Setup

This document describes the unit testing infrastructure added to Villa.

## Overview

Unit tests have been created for critical code paths in the Villa application, focusing on:
1. Input validation and XSS prevention
2. State management and persistence
3. Porto SDK helper functions

## Configuration Files

### `/vitest.config.ts`
Base Vitest configuration with:
- jsdom environment for browser API mocking
- Path aliases (@/ → ./src/)
- Coverage configuration with V8 provider
- Global test setup from `/tests/setup.ts`

### `/vitest.config.unit.ts`
Specific configuration for unit tests:
- Includes only `tests/unit/**/*.test.ts`
- Coverage focused on `src/lib/**/*.ts`

### `/vitest.config.integration.ts`
Configuration for integration tests (future use)

### `/vitest.config.security.ts`
Configuration for security tests (future use)

### `/tests/setup.ts`
Global test setup that mocks:
- `window.matchMedia` (for responsive design tests)
- `localStorage` (with full Storage API implementation)
- `sessionStorage` (with full Storage API implementation)
- React Testing Library cleanup

## Test Files

### `/tests/unit/validation.test.ts`
**Purpose**: Test input validation and XSS prevention

**Coverage**:
- `displayNameSchema` validation
  - Valid names (simple, spaces, numbers, special chars, unicode, emoji)
  - Max length (50 characters)
  - Trimming whitespace
  - Empty/whitespace-only rejection
  - Too long rejection
- XSS prevention
  - Script tag removal
  - Angle bracket removal
  - Event handler removal
  - Ampersand escaping
  - JavaScript protocol handling
- `identitySchema` validation
  - Valid identity objects
  - Address format validation (0x + 40 hex chars)
  - Required field validation
  - Display name sanitization in identity

**Test Count**: 30+ tests covering all validation scenarios

### `/tests/unit/store.test.ts`
**Purpose**: Test Zustand identity store

**Coverage**:
- `setIdentity()`
  - Setting valid identity
  - Setting identity with avatar
  - Sanitizing display name on set
  - Rejecting invalid identity (bad address, missing fields, empty name)
  - Overwriting existing identity
- `updateProfile()`
  - Updating display name
  - Updating display name and avatar
  - Preserving avatar when not provided
  - Preserving address and createdAt
  - Sanitizing display name on update
  - Handling no identity case
  - Rejecting invalid names
- `clearIdentity()`
  - Clearing identity
  - Safe to call when empty
  - Setting new identity after clear
- Persistence
  - Persisting to localStorage
  - Removing from localStorage on clear
  - Persisting profile updates

**Test Count**: 25+ tests covering all store operations

### `/tests/unit/porto.test.ts`
**Purpose**: Test Porto SDK helper functions

**Coverage**:
- `isPortoSupported()`
  - Returns true when PublicKeyCredential available
  - Returns false when undefined
  - Returns false in non-browser (SSR)
- `resetPorto()`
  - Resets instance without errors
  - Forces new instance creation
- `getPorto()`
  - Creates instance in popup mode (default)
  - Creates instance in inline mode (with container)
  - Returns same instance on subsequent calls
  - Recreates when mode changes (popup ↔ inline)
  - Recreates when forceRecreate is true
- Error handling
  - ConnectResult success type
  - ConnectResult error type
  - Error wrapping for unknown types
  - Stack trace preservation
  - Common error scenarios (cancellation, no account, network)

**Test Count**: 15+ tests covering all helper functions

## Running Tests

### Quick Commands
```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npx vitest run --coverage --config vitest.config.unit.ts

# Watch mode (for development)
npm run test:watch

# Run specific test file
npx vitest run tests/unit/validation.test.ts

# Run all tests (unit + integration + security)
npm test

# Full verification (before PR)
npm run verify
```

### Debugging
```bash
# Verbose output
npx vitest run --reporter=verbose

# UI mode (interactive)
npx vitest --ui

# Run single test
# Add .only to any test:
it.only('runs only this test', () => { ... })
```

## Test Coverage Targets

Based on the spec requirements:

| Module | Target | Current | Notes |
|--------|--------|---------|-------|
| `validation.ts` | 100% | New tests | Critical security code |
| `store.ts` | 90%+ | New tests | Core state management |
| `porto.ts` | 80%+ | New tests | External SDK integration |

## Test Patterns

### 1. Arrange-Act-Assert
```typescript
it('sanitizes display name on set', () => {
  // Arrange
  const identity = {
    address: '0x1234...',
    displayName: '<script>alert("xss")</script>Alice',
    createdAt: Date.now(),
  }

  // Act
  useIdentityStore.getState().setIdentity(identity)

  // Assert
  const stored = useIdentityStore.getState().identity
  expect(stored?.displayName).not.toContain('<')
})
```

### 2. Type-Safe Result Checking
```typescript
it('accepts valid names', () => {
  const result = displayNameSchema.safeParse('Alice')
  expect(result.success).toBe(true)
  if (result.success) {
    // TypeScript knows result.data exists here
    expect(result.data).toBe('Alice')
  }
})
```

### 3. Console Spy for Error Validation
```typescript
it('rejects invalid identity', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  useIdentityStore.getState().setIdentity(invalidIdentity)

  expect(useIdentityStore.getState().identity).toBeNull()
  expect(consoleErrorSpy).toHaveBeenCalled()

  consoleErrorSpy.mockRestore()
})
```

### 4. Store Cleanup
```typescript
beforeEach(() => {
  useIdentityStore.setState({ identity: null })
  localStorage.clear()
})
```

## Security Test Coverage

All XSS vectors tested:
- ✅ Script tags: `<script>alert("xss")</script>`
- ✅ Angle brackets: `<div>content</div>`
- ✅ Event handlers: `<img src=x onerror=alert(1)>`
- ✅ JavaScript protocol: `<a href="javascript:alert(1)">`
- ✅ Ampersand escaping: `Alice & Bob` → `Alice &amp; Bob`
- ✅ Multiple XSS attempts in single input

All validation edge cases tested:
- ✅ Empty strings
- ✅ Whitespace-only strings
- ✅ Max length boundaries (50 chars)
- ✅ Unicode characters (陳小明)
- ✅ Emoji (👋)
- ✅ Special characters (!@#$%^&*())
- ✅ Newlines and tabs

## Integration with CI/CD

Tests automatically run:
1. **Pre-commit**: Via Husky hooks (fast unit tests only)
2. **PR checks**: Full test suite via GitHub Actions
3. **Pre-deploy**: `npm run verify` (typecheck + build + e2e)

Failed tests block:
- Commits (pre-commit)
- PR merges (CI)
- Deployments (verify script)

## Next Steps

### Integration Tests (Future)
Create integration tests in `/tests/integration/`:
- Component integration with store
- Porto SDK flow (create → sign in → disconnect)
- Form validation with UI feedback

### Security Tests (Future)
Expand security tests in `/tests/security/`:
- XSS attack scenarios with real DOM
- CSRF token validation
- Session handling
- Rate limiting

### E2E Enhancement
Current E2E tests in `/tests/e2e/`:
- Already covers Porto authentication flow
- Should verify validation errors in UI
- Should test persistence across sessions

## Dependencies

New dev dependencies installed:
```json
{
  "jsdom": "^24.0.0",        // Browser environment for tests
  "vitest": "^2.0.0",        // Test runner
  "@testing-library/react": "^16.0.0", // React testing utilities
  "@vitest/coverage-v8": "^2.0.0"      // Coverage reporting
}
```

All dependencies are already in package.json.

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Testing](https://zod.dev/)
- [Zustand Testing](https://github.com/pmndrs/zustand#testing)
- [Villa Testing Guide](/tests/README.md)

## Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Import from vitest: `describe, it, expect, beforeEach`
4. Use path alias: `import { ... } from '@/lib/...'`
5. Add to appropriate vitest.config file if needed

### Updating Tests
When code changes:
1. Update tests to match new behavior
2. Ensure coverage doesn't drop
3. Run full test suite: `npm test`
4. Verify E2E tests still pass: `npm run test:e2e:chromium`

### Coverage Reports
```bash
# Generate HTML coverage report
npx vitest run --coverage

# View report
open coverage/index.html
```

Coverage reports show:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines (highlighted)
