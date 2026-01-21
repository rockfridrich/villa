"use client";

import { CheckCircle2 } from "lucide-react";

interface VerifiedBadgeProps {
  attestedAt?: string;
  txHash?: string;
  className?: string;
}

export function VerifiedBadge({
  attestedAt,
  txHash,
  className = "",
}: VerifiedBadgeProps) {
  const isVerified = Boolean(attestedAt || txHash);

  if (!isVerified) return null;

  const explorerUrl = txHash ? `https://basescan.org/tx/${txHash}` : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full ${className}`}
      title={attestedAt ? `Verified on ${attestedAt}` : "Verified on Base"}
    >
      <CheckCircle2 className="w-3 h-3" />
      <span>Verified</span>
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </a>
      )}
    </span>
  );
}
