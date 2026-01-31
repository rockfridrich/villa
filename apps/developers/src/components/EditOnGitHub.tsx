"use client";

interface EditOnGitHubProps {
  filePath: string;
  className?: string;
}

const REPO_URL = "https://github.com/rockfridrich/villa";
const EDIT_BASE = `${REPO_URL}/edit/main`;

export function EditOnGitHub({ filePath, className = "" }: EditOnGitHubProps) {
  const editUrl = `${EDIT_BASE}/${filePath}`;

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors ${className}`}
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Edit on GitHub
    </a>
  );
}

interface DocFooterProps {
  filePath: string;
  lastModified?: Date;
}

export function DocFooter({ filePath, lastModified }: DocFooterProps) {
  const viewUrl = `${REPO_URL}/blob/main/${filePath}`;

  return (
    <footer className="mt-12 pt-6 border-t border-ink/10 flex items-center justify-between text-sm">
      <EditOnGitHub filePath={filePath} />
      <div className="flex items-center gap-4 text-ink-muted">
        {lastModified && (
          <span>Updated {lastModified.toLocaleDateString()}</span>
        )}
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink transition-colors"
        >
          View source
        </a>
      </div>
    </footer>
  );
}
