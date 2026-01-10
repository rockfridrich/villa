import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from '../Spinner'

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders spinner element', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Spinner className="custom-class" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
    })
  })

  describe('sizes', () => {
    it('renders medium size by default', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-8')
      expect(spinner).toHaveClass('h-8')
      expect(spinner).toHaveClass('border-4')
    })

    it('renders small size', () => {
      render(<Spinner size="sm" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-4')
      expect(spinner).toHaveClass('h-4')
      expect(spinner).toHaveClass('border-2')
    })

    it('renders large size', () => {
      render(<Spinner size="lg" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-12')
      expect(spinner).toHaveClass('h-12')
      expect(spinner).toHaveClass('border-4')
    })
  })

  describe('styling', () => {
    it('applies animation classes', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
      expect(spinner).toHaveClass('rounded-full')
    })

    it('applies border color classes', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('border-yellow-500')
      expect(spinner).toHaveClass('border-t-transparent')
    })

    it('combines custom className with base styles', () => {
      render(<Spinner className="my-4 mx-auto" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
      expect(spinner).toHaveClass('my-4')
      expect(spinner).toHaveClass('mx-auto')
    })
  })

  describe('accessibility', () => {
    it('has status role', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has loading aria-label', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('provides semantic loading indicator', () => {
      render(<Spinner />)
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })
  })

  describe('visual regression', () => {
    it('renders consistently with all size variants', () => {
      const { rerender } = render(<Spinner size="sm" />)
      expect(screen.getByRole('status')).toMatchSnapshot('spinner-sm')

      rerender(<Spinner size="md" />)
      expect(screen.getByRole('status')).toMatchSnapshot('spinner-md')

      rerender(<Spinner size="lg" />)
      expect(screen.getByRole('status')).toMatchSnapshot('spinner-lg')
    })
  })
})
