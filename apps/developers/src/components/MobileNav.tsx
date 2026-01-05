'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

interface Section {
  id: string
  title: string
}

const sections: Section[] = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'installation', title: 'Installation' },
  { id: 'quickstart', title: 'Quick Start' },
  { id: 'api', title: 'API Reference' },
  { id: 'components', title: 'Components' },
  { id: 'ai', title: 'AI Integration' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = (id: string) => {
    const element = document.getElementById(id)

    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })

      // Update URL without triggering navigation
      window.history.pushState(null, '', `#${id}`)
    }

    // Close menu after selection
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-cream-100 transition-colors"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 left-0 h-full w-72 bg-cream-50 border-r border-ink/10 z-50
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          // Disable transition when user prefers reduced motion
          transition: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'none'
            : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink/5">
          <span className="font-serif text-xl">Villa SDK</span>
          <button
            onClick={() => setIsOpen(false)}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-cream-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-6 space-y-1">
          <h2 className="sr-only">Page sections</h2>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleLinkClick(section.id)}
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-ink-muted hover:bg-cream-100 hover:text-ink transition-colors"
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
