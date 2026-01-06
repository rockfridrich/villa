'use client'

import { Github } from 'lucide-react'
import { MobileNav } from './MobileNav'

export function Header() {
  return (
    <nav className="sticky top-0 z-50 bg-cream-50/80 backdrop-blur-sm border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav />
          <span className="font-serif text-xl">Villa SDK</span>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a href="/" className="text-ink-muted hover:text-ink transition-colors">
              Docs
            </a>
            <a href="/roadmap" className="text-ink-muted hover:text-ink transition-colors">
              Roadmap
            </a>
            <a href="/contributors" className="text-ink-muted hover:text-ink transition-colors">
              Contributors
            </a>
            <a href="/metrics" className="text-ink-muted hover:text-ink transition-colors">
              Metrics
            </a>
          </div>
        </div>
        <a
          href="https://github.com/rockfridrich/villa"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </nav>
  )
}
