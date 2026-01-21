"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { search } from "../lib/search";
import type { SearchResult } from "../types/docs";
import { trackSearch } from "../lib/analytics";

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) {
      const searchResults = search(q);
      setResults(searchResults);
      setSelectedIndex(0);
      trackSearch(q, searchResults.length);
    } else {
      setResults([]);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }

      if (e.key === "Enter" && results[selectedIndex]) {
        window.location.href = results[selectedIndex].url;
        setIsOpen(false);
      }
    },
    [isOpen, results, selectedIndex],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search documentation..."
                  className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
                />
                <kbd className="px-2 py-1 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                  ESC
                </kbd>
              </div>

              {results.length > 0 && (
                <ul className="max-h-[60vh] overflow-y-auto py-2">
                  {results.map((result, i) => (
                    <li key={result.url}>
                      <a
                        href={result.url}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                          i === selectedIndex
                            ? "bg-zinc-100 dark:bg-zinc-800"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {result.section}
                          </span>
                        </div>
                        <h3 className="font-medium text-zinc-900 dark:text-white">
                          {result.title}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {result.snippet}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {query && results.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500">
                  <p>No results found for &ldquo;{query}&rdquo;</p>
                  <p className="mt-2 text-sm">
                    Try searching for &ldquo;signIn&rdquo;, &ldquo;React&rdquo;,
                    or &ldquo;types&rdquo;
                  </p>
                </div>
              )}

              {!query && (
                <div className="px-4 py-6 text-center text-zinc-500">
                  <p className="text-sm">
                    Type to search documentation, API reference, and guides
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                        ↑
                      </kbd>
                      <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded ml-1">
                        ↓
                      </kbd>{" "}
                      to navigate
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                        ↵
                      </kbd>{" "}
                      to select
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
