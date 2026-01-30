import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      className="flex items-center gap-2 text-sm mb-8"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-ink-muted hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-ink font-medium" : "text-ink-muted"}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-4 h-4 text-ink/20" />}
          </div>
        );
      })}
    </nav>
  );
}
