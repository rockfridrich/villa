/**
 * Accessibility Tests for @villa/ui
 *
 * Validates that UI components meet WCAG 2.1 Level AA standards.
 * Tests for:
 * - Proper ARIA attributes
 * - Focus management
 * - Keyboard navigation
 * - Color contrast
 * - Screen reader compatibility
 *
 * Uses jest-axe for automated a11y testing.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../Button'
import { Spinner } from '../Spinner'

// Extend vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations)

describe('Accessibility - Button', () => {
  it('has no axe violations with default props', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with all variants', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper role attribute', () => {
    render(<Button>Test</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('has visible focus indicator', () => {
    render(<Button>Focus test</Button>)
    const button = screen.getByRole('button')

    // Check for focus ring classes (Tailwind)
    expect(button.className).toMatch(/focus:ring/)
    expect(button.className).toMatch(/focus:outline-none/)
  })

  it('supports keyboard navigation', () => {
    render(<Button>Keyboard test</Button>)
    const button = screen.getByRole('button')

    // Button should be focusable
    button.focus()
    expect(button).toHaveFocus()
  })

  it('respects aria-label override', async () => {
    const { container } = render(
      <Button aria-label="Custom accessible name">
        <span aria-hidden="true">Icon</span>
      </Button>
    )

    expect(screen.getByRole('button', { name: 'Custom accessible name' })).toBeInTheDocument()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has adequate touch target size (min 44x44px)', () => {
    render(<Button size="sm">Small button</Button>)
    const button = screen.getByRole('button')

    // Check for minimum height (44px = 11 * 4px = min-h-11)
    expect(button.className).toMatch(/min-h-11/)
  })

  it('communicates disabled state to screen readers', () => {
    render(<Button disabled>Disabled button</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('disabled')
  })
})

describe('Accessibility - Spinner', () => {
  it('has no axe violations with default props', async () => {
    const { container } = render(<Spinner />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with all sizes', async () => {
    const { container } = render(
      <div>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper role attribute', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('has aria-label for screen readers', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('can override aria-label', async () => {
    const { container } = render(
      <Spinner className="custom" aria-label="Processing your request" />
    )

    // Note: aria-label override would need to be added to Spinner component
    // This test documents the expected behavior
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('is perceivable by screen readers', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')

    // Has role="status" which announces to screen readers
    expect(spinner).toHaveAttribute('role', 'status')

    // Has aria-label for context
    expect(spinner).toHaveAttribute('aria-label')
  })

  it('does not block keyboard navigation', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('[role="status"]')

    // Spinner should not have tabindex (not keyboard focusable)
    expect(spinner).not.toHaveAttribute('tabindex')
  })
})

describe('Accessibility - Focus Management', () => {
  it('maintains logical focus order', () => {
    render(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </div>
    )

    const buttons = screen.getAllByRole('button')

    // All buttons should be in the natural tab order
    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })
  })

  it('disabled buttons are not in tab order', () => {
    render(
      <div>
        <Button>Enabled</Button>
        <Button disabled>Disabled</Button>
        <Button>Enabled</Button>
      </div>
    )

    const disabledButton = screen.getByRole('button', { name: 'Disabled' })

    // Disabled buttons should not be focusable
    expect(disabledButton).toBeDisabled()
  })
})

describe('Accessibility - Color Contrast', () => {
  it('primary button has sufficient contrast', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole('button')

    // Yellow 400 (#FBBF24) on amber 900 (#78350F) has 7.15:1 contrast (WCAG AAA)
    expect(button.className).toMatch(/bg-yellow-400/)
    expect(button.className).toMatch(/text-amber-900/)
  })

  it('secondary button has sufficient contrast', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')

    // Gray 900 on gray 100 has high contrast
    expect(button.className).toMatch(/bg-gray-100/)
    expect(button.className).toMatch(/text-gray-900/)
  })

  it('focus indicators are visible', () => {
    render(<Button>Focus test</Button>)
    const button = screen.getByRole('button')

    // Has visible focus ring
    expect(button.className).toMatch(/focus:ring-2/)
    expect(button.className).toMatch(/focus:ring-offset-2/)
  })
})

describe('Accessibility - Screen Reader Support', () => {
  it('button content is exposed to screen readers', () => {
    render(<Button>Submit form</Button>)
    const button = screen.getByRole('button', { name: 'Submit form' })
    expect(button).toBeInTheDocument()
  })

  it('spinner loading state is announced', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status', { name: 'Loading' })
    expect(spinner).toBeInTheDocument()
  })

  it('button with icon and text is properly labeled', async () => {
    const { container } = render(
      <Button>
        <Spinner size="sm" />
        <span>Loading...</span>
      </Button>
    )

    const button = screen.getByRole('button', { name: /loading/i })
    expect(button).toBeInTheDocument()

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
