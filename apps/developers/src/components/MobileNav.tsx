'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, BookOpen, Map, Users, BarChart3, Layers, Code2, Package, Play } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

// Page navigation items
interface NavItem {
  href: string
  label: string
  icon: typeof BookOpen
}

const navItems: NavItem[] = [
  { href: '/', label: 'Documentation', icon: BookOpen },
  { href: '/sdk', label: 'SDK Reference', icon: Package },
  { href: '/playground', label: 'Playground', icon: Play },
  { href: '/examples', label: 'Examples', icon: Code2 },
  { href: '/ecosystem', label: 'Ecosystem', icon: Layers },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/contributors', label: 'Contributors', icon: Users },
  { href: '/metrics', label: 'Metrics', icon: BarChart3 },
]

// Doc sections (only shown on docs page)
interface Section {
  id: string
  title: string
}

const docSections: Section[] = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'installation', title: 'Installation' },
  { id: 'quickstart', title: 'Quick Start' },
  { id: 'api', title: 'API Reference' },
  { id: 'components', title: 'Components' },
  { id: 'ai', title: 'AI Integration' },
]

// Animation variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const drawerVariants: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    x: '-100%',
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
}

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const isDocsPage = pathname === '/'

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Close on escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleSectionClick = useCallback((id: string) => {
    const element = document.getElementById(id)

    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })

      window.history.pushState(null, '', `#${id}`)
    }

    setIsOpen(false)
  }, [prefersReducedMotion])

  const handleNavClick = useCallback((href: string) => {
    // For same-page navigation, just close the menu
    if (href === pathname) {
      setIsOpen(false)
    }
    // Let the browser handle the navigation via the <a> tag
  }, [pathname])

  return (
    <>
      {/* Hamburger Button - 44px touch target */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-cream-100 active:bg-cream-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={prefersReducedMotion ? false : 'hidden'}
              animate={prefersReducedMotion ? { opacity: 1 } : 'visible'}
              exit={prefersReducedMotion ? { opacity: 0 } : 'hidden'}
              variants={backdropVariants}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={prefersReducedMotion ? false : 'hidden'}
              animate={prefersReducedMotion ? { x: 0 } : 'visible'}
              exit={prefersReducedMotion ? { x: '-100%' } : 'exit'}
              variants={drawerVariants}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="fixed top-0 left-0 h-full w-72 bg-cream-50 border-r border-ink/10 z-50 lg:hidden shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-ink/5">
                <span className="font-serif text-xl">Villa SDK</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-cream-100 active:bg-cream-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation Content */}
              <nav className="overflow-y-auto h-[calc(100%-81px)] p-6">
                {/* Page Navigation */}
                <div className="space-y-1 mb-6">
                  <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Navigation
                  </h2>
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => handleNavClick(item.href)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors duration-150 min-h-11
                          ${isActive
                            ? 'bg-accent-yellow/10 text-ink font-medium'
                            : 'text-ink-muted hover:bg-cream-100 hover:text-ink active:bg-cream-200'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-yellow' : ''}`} aria-hidden="true" />
                        {item.label}
                      </a>
                    )
                  })}
                </div>

                {/* Doc Sections (only on docs page) */}
                {isDocsPage && (
                  <div className="space-y-1 pt-4 border-t border-ink/5">
                    <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                      On This Page
                    </h2>
                    {docSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className="w-full text-left px-4 py-3 rounded-lg text-sm text-ink-muted hover:bg-cream-100 hover:text-ink active:bg-cream-200 transition-colors duration-150 min-h-11"
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Links */}
                <div className="pt-6 mt-6 border-t border-ink/5">
                  <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Resources
                  </h2>
                  <a
                    href="https://github.com/rockfridrich/villa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-ink-muted hover:text-ink hover:bg-cream-100 active:bg-cream-200 rounded-lg transition-colors duration-150 min-h-11"
                  >
                    GitHub Repository
                    <span className="text-xs" aria-hidden="true">&#8599;</span>
                  </a>
                  <a
                    href="https://github.com/rockfridrich/villa/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-ink-muted hover:text-ink hover:bg-cream-100 active:bg-cream-200 rounded-lg transition-colors duration-150 min-h-11"
                  >
                    Report Issue
                    <span className="text-xs" aria-hidden="true">&#8599;</span>
                  </a>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
