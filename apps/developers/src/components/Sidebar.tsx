'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Map, Users, ChevronDown, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

// Page navigation
interface NavItem {
  href: string
  label: string
  icon: typeof BookOpen
}

const navItems: NavItem[] = [
  { href: '/', label: 'Documentation', icon: BookOpen },
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
const sectionListVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string>('')
  const [sectionsExpanded, setSectionsExpanded] = useState(true)
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

  // Track scroll position for section highlighting (docs page only)
  useEffect(() => {
    if (!isDocsPage) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (let i = docSections.length - 1; i >= 0; i--) {
        const section = document.getElementById(docSections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(docSections[i].id)
          break
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDocsPage])

  const handleSectionClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)

    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })

      window.history.pushState(null, '', `#${id}`)
    }
  }, [prefersReducedMotion])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSectionsExpanded(!sectionsExpanded)
    }
  }, [sectionsExpanded])

  return (
    <aside
      className="hidden lg:block w-64 flex-shrink-0"
      aria-label="Site navigation"
    >
      <nav className="sticky top-24 space-y-6">
        {/* Page Navigation */}
        <div className="space-y-1">
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
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 min-h-11
                  focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                  ${isActive
                    ? 'bg-accent-yellow/10 text-ink font-medium'
                    : 'text-ink-muted hover:bg-cream-100 hover:text-ink active:bg-cream-200'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-accent-yellow' : ''}`}
                  aria-hidden="true"
                />
                {item.label}
              </a>
            )
          })}
        </div>

        {/* Doc Sections (only on docs page) */}
        {isDocsPage && (
          <div className="space-y-1">
            <button
              onClick={() => setSectionsExpanded(!sectionsExpanded)}
              onKeyDown={handleKeyDown}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 min-h-11"
              aria-expanded={sectionsExpanded}
              aria-controls="doc-sections"
            >
              <span>On This Page</span>
              <motion.span
                animate={{ rotate: sectionsExpanded ? 0 : -90 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {sectionsExpanded && (
                <motion.div
                  id="doc-sections"
                  initial={prefersReducedMotion ? false : 'hidden'}
                  animate={prefersReducedMotion ? { height: 'auto', opacity: 1 } : 'visible'}
                  exit={prefersReducedMotion ? { height: 0, opacity: 0 } : 'hidden'}
                  variants={sectionListVariants}
                  transition={prefersReducedMotion ? { duration: 0 } : undefined}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 mt-2">
                    {docSections.map((section) => {
                      const isActive = activeSection === section.id

                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          onClick={(e) => handleSectionClick(e, section.id)}
                          className={`
                            block px-4 py-2 text-sm transition-colors duration-150 border-l-2 min-h-11 flex items-center
                            focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-inset
                            ${isActive
                              ? 'border-accent-yellow text-ink font-medium bg-accent-yellow/5'
                              : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20 hover:bg-cream-100/50'
                            }
                          `}
                          aria-current={isActive ? 'location' : undefined}
                        >
                          {section.title}
                        </a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-4 border-t border-ink/5">
          <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Resources
          </h2>
          <a
            href="https://github.com/rockfridrich/villa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink hover:bg-cream-100/50 rounded-lg transition-colors duration-150 min-h-11 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2"
          >
            GitHub Repository
            <span className="text-xs" aria-hidden="true">&#8599;</span>
          </a>
          <a
            href="https://github.com/rockfridrich/villa/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink hover:bg-cream-100/50 rounded-lg transition-colors duration-150 min-h-11 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2"
          >
            Report Issue
            <span className="text-xs" aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </nav>
    </aside>
  )
}
