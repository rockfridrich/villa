"use client";

import { Github, Heart } from "lucide-react";

export function PageFooter() {
  return (
    <footer className="mt-24 pt-12 border-t border-ink/10">
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="font-serif text-lg">Villa SDK</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Passkey authentication for AI-native apps. Built with{" "}
              <Heart className="inline w-3 h-3 text-error-text" /> for
              developers.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/sdk"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  SDK Reference
                </a>
              </li>
              <li>
                <a
                  href="/examples"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Examples
                </a>
              </li>
              <li>
                <a
                  href="/architecture"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Architecture
                </a>
              </li>
              <li>
                <a
                  href="/playground"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Playground
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/rockfridrich/villa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-muted hover:text-ink transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/@rockfridrich/villa-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  npm Package
                </a>
              </li>
              <li>
                <a
                  href="/contributors"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Contributors
                </a>
              </li>
              <li>
                <a
                  href="/roadmap"
                  className="text-ink-muted hover:text-ink transition-colors"
                >
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <p>
            © {new Date().getFullYear()} Villa. Built with care for developers.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://villa.cash"
              className="hover:text-ink transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://villa.cash"
              className="hover:text-ink transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
