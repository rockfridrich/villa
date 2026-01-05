'use client'

import { useEffect, useState } from 'react'

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

export function Sidebar() {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      // Find which section is currently in view
      const scrollPosition = window.scrollY + 100 // Offset for header

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    // Initial check
    handleScroll()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
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
  }

  return (
    <aside
      className="hidden lg:block w-64 flex-shrink-0"
      aria-label="Documentation navigation"
    >
      <nav className="sticky top-24 space-y-1">
        <h2 className="sr-only">Page sections</h2>
        {sections.map((section) => {
          const isActive = activeSection === section.id

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
              className={`
                block px-4 py-2 rounded-lg text-sm transition-colors duration-150
                ${
                  isActive
                    ? 'bg-cream-100 text-ink font-medium'
                    : 'text-ink-muted hover:bg-cream-100 hover:text-ink'
                }
              `}
              aria-current={isActive ? 'location' : undefined}
            >
              {section.title}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}
