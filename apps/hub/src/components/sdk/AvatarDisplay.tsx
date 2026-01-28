"use client";

import { useMemo } from "react";
import { Camera } from "lucide-react";
import { generateAvatarDataUrlFromConfig } from "@/lib/avatar/utils";
import type { AvatarConfig } from "@/types";
import type { CustomAvatar } from "@/lib/storage/tinycloud";

interface AvatarDisplayProps {
  walletAddress: string;
  avatar: AvatarConfig | CustomAvatar | null;
  size?: number;
  className?: string;
}

export function AvatarDisplay({
  walletAddress,
  avatar,
  size = 128,
  className = "",
}: AvatarDisplayProps) {
  const avatarUrl = useMemo(() => {
    if (!avatar) return null;

    if ("type" in avatar && avatar.type === "custom") {
      return avatar.dataUrl;
    }

    return generateAvatarDataUrlFromConfig(
      walletAddress,
      avatar as AvatarConfig,
    );
  }, [walletAddress, avatar]);

  if (!avatarUrl) {
    return (
      <div
        className={`bg-cream-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Camera className="w-8 h-8 text-ink-muted" />
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt="Avatar"
      className={`rounded-full bg-cream-100 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
