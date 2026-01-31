"use client";

import { ReactNode } from "react";
import { PageFooter } from "./PageFooter";

interface DocsLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function DocsLayout({ children, showFooter = true }: DocsLayoutProps) {
  return (
    <div className="min-h-screen">
      <article className="prose prose-ink max-w-none">{children}</article>
      {showFooter && <PageFooter />}
    </div>
  );
}
