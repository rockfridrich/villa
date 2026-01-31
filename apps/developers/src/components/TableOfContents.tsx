"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" },
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-24 hidden lg:block w-64 flex-shrink-0">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
          On This Page
        </p>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`block py-2 text-sm transition-colors border-l-2 ${
              activeId === item.id
                ? "border-accent-yellow text-ink font-medium pl-4"
                : "border-transparent text-ink-muted hover:text-ink hover:border-ink/20 pl-4"
            } ${item.level > 2 ? "pl-6" : ""}`}
          >
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
