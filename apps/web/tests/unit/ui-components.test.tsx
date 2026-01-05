import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// These tests are written BEFORE implementation (TDD)
// Components will be created to satisfy these tests

describe('Dialog Component', () => {
  it('renders trigger button', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('@/components/ui/dialog')
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    )
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('opens when trigger clicked', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('@/components/ui/dialog')
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    )
    await userEvent.click(screen.getByText('Open Dialog'))
    await waitFor(() => {
      expect(screen.getByText('Dialog Content')).toBeVisible()
    })
  })

  it('closes on Escape key', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('@/components/ui/dialog')
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    )
    await userEvent.click(screen.getByText('Open Dialog'))
    await waitFor(() => {
      expect(screen.getByText('Dialog Content')).toBeVisible()
    })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument()
    })
  })

  it('has correct ARIA attributes', async () => {
    const { Dialog, DialogTrigger, DialogContent } = await import('@/components/ui/dialog')
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    )
    await userEvent.click(screen.getByText('Open Dialog'))
    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })
  })
})

describe('Tooltip Component', () => {
  it('renders trigger element', async () => {
    const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } = await import('@/components/ui/tooltip')
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('shows on hover after delay', async () => {
    const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } = await import('@/components/ui/tooltip')
    render(
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    await userEvent.hover(screen.getByText('Hover me'))
    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeVisible()
    }, { timeout: 500 })
  })

  it('hides on mouse leave', async () => {
    const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } = await import('@/components/ui/tooltip')
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const trigger = screen.getByText('Hover me')
    await userEvent.hover(trigger)
    await waitFor(() => {
      expect(screen.getByText('Tooltip text')).toBeVisible()
    })
    await userEvent.unhover(trigger)
    await waitFor(() => {
      expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument()
    })
  })
})

describe('Tabs Component', () => {
  it('renders all tab triggers', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('@/components/ui/tabs')
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('shows first tab content by default', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('@/components/ui/tabs')
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Content 1')).toBeVisible()
  })

  it('switches tab on click', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('@/components/ui/tabs')
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    await userEvent.click(screen.getByText('Tab 2'))
    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeVisible()
    })
  })

  it('supports keyboard navigation', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('@/components/ui/tabs')
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const tab1 = screen.getByText('Tab 1')
    tab1.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText('Tab 2')).toHaveFocus()
  })

  it('has correct ARIA attributes', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('@/components/ui/tabs')
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
  })
})

describe('EmptyState Component', () => {
  it('uses Villa design tokens (not slate)', async () => {
    const { EmptyState } = await import('@/components/ui/empty-state')
    const { container } = render(
      <EmptyState
        title="No items"
        description="Add your first item"
      />
    )
    // Should NOT contain slate classes
    expect(container.innerHTML).not.toContain('slate-')
    // Should contain ink/cream classes
    expect(container.innerHTML).toContain('text-ink')
  })

  it('renders title and description', async () => {
    const { EmptyState } = await import('@/components/ui/empty-state')
    render(
      <EmptyState
        title="No results"
        description="Try a different search"
      />
    )
    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(screen.getByText('Try a different search')).toBeInTheDocument()
  })

  it('renders action when provided', async () => {
    const { EmptyState } = await import('@/components/ui/empty-state')
    render(
      <EmptyState
        title="No items"
        description="Get started"
        action={<button>Add Item</button>}
      />
    )
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('renders illustration when provided', async () => {
    const { EmptyState } = await import('@/components/ui/empty-state')
    render(
      <EmptyState
        title="Empty"
        description="Nothing here"
        illustration={<div data-testid="custom-illustration">Custom</div>}
      />
    )
    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument()
  })
})
