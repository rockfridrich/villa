import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`py-20 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function SectionHeader({
  title,
  description,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="text-center space-y-4 mb-16">
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-yellow/20 rounded-full text-sm font-medium">
          {badge}
        </div>
      )}
      <h2 className="font-serif text-4xl">{title}</h2>
      {description && (
        <p className="text-ink-muted text-lg max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
