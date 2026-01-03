# Villa Tests

This directory contains all test suites for the Villa application.

## Test Structure

```
tests/
├── unit/           # Unit tests for isolated functions and modules
├── integration/    # Integration tests for component interactions
├── security/       # Security-focused tests
├── e2e/           # End-to-end Playwright tests
├── mocks/         # Mock implementations for external services
└── setup.ts       # Global test setup (jsdom, mocks)
```

## Running Tests

### Unit Tests
```bash
npm run test:unit           # Run all unit tests
npm run test:watch          # Watch mode for development
```

### Integration Tests
```bash
npm run test:integration    # Run integration tests
```

### Security Tests
```bash
npm run test:security       # Run security tests
```

### E2E Tests
```bash
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:chromium   # Run only Chromium tests
```

### All Tests
```bash
npm test                    # Run unit + integration + security
npm run verify              # Full verification (typecheck + build + e2e)
```

## Unit Tests

Unit tests focus on isolated functions and modules. They should be fast, deterministic, and test single units of code.

### Current Coverage

#### `/tests/unit/validation.test.ts`
Tests for input validation and sanitization:
- Display name validation (length, required fields)
- XSS prevention (script tags, event handlers)
- Unicode and emoji support
- Identity schema validation
- Address format validation

#### `/tests/unit/store.test.ts`
Tests for Zustand store (useIdentityStore):
- Setting and clearing identity
- Profile updates
- Input validation during updates
- LocalStorage persistence
- Error handling for invalid data

#### `/tests/unit/porto.test.ts`
Tests for Porto SDK helper functions:
- `isPortoSupported()` - WebAuthn detection
- `getPorto()` - Instance management and mode switching
- `resetPorto()` - Instance cleanup
- Error result type mapping
- Common error scenarios

## Writing Tests

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  describe('specific behavior', () => {
    it('does something expected', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = doSomething(input)

      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Test one thing at a time
3. **Descriptive names**: Use clear test descriptions
4. **Mock external deps**: Use mocks from `/tests/mocks/`
5. **Clean up**: Reset state in `beforeEach`/`afterEach`
6. **Type safety**: No `any`, use proper types

### Testing Security

For security-critical code (validation, sanitization):
- Test XSS vectors (script tags, event handlers, javascript:)
- Test SQL injection patterns (if applicable)
- Test buffer overflow scenarios (max lengths)
- Test edge cases (unicode, emoji, special chars)
- Test error cases (missing fields, invalid formats)

Example:
```typescript
it('removes script tags', () => {
  const result = displayNameSchema.safeParse('<script>alert("xss")</script>Alice')
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).not.toContain('<')
    expect(result.data).not.toContain('>')
  }
})
```

## Mocks

All external dependencies should be mocked in `/tests/mocks/`:
- Porto SDK methods
- WebAuthn APIs
- Network requests
- Browser APIs

Use mocks to:
- Control test environment
- Test error scenarios
- Ensure test speed and reliability
- Avoid side effects

## Coverage

Coverage reports are generated in `/coverage/` after running tests with coverage:

```bash
npx vitest run --coverage
```

Current coverage targets:
- Unit tests: 80%+ for critical code (validation, auth, storage)
- Integration tests: Key user flows
- E2E tests: Critical paths

## Continuous Integration

Tests run automatically on:
- Every commit (via pre-commit hooks)
- Every PR (via GitHub Actions)
- Before deploy (via verify script)

Failed tests block merges.

## Debugging Tests

### Watch Mode
```bash
npm run test:watch  # Auto-runs on file changes
```

### VS Code
Add breakpoints and use "Debug Test" in the testing sidebar.

### Verbose Output
```bash
npx vitest run --reporter=verbose
```

### Single Test File
```bash
npx vitest run tests/unit/validation.test.ts
```

### Single Test
```typescript
it.only('runs only this test', () => {
  // Will run only this test
})
```

## Common Issues

### "Cannot find module '@/...'"
- Check `vitest.config.ts` has correct path aliases
- Verify tsconfig.json paths match

### "localStorage is not defined"
- Ensure `tests/setup.ts` is in setupFiles
- Check vitest.config.ts has `environment: 'jsdom'`

### "window is not defined"
- Use jsdom environment in vitest.config
- Check if code needs SSR guards

### Flaky Tests
- Remove timing dependencies
- Mock dates/random values
- Reset state between tests
- Use deterministic mocks

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Villa Testing Guide](../.claude/rules.md)
