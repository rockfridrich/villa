import { forwardRef } from "react";
import { clsx } from "clsx";

export interface AvatarConfig {
  style: "avataaars" | "bottts";
  selection: "male" | "female" | "other";
  variant: number;
}

export interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-accent-yellow",
    "bg-accent-green",
    "bg-accent-brown",
    "bg-amber-600",
    "bg-orange-700",
    "bg-rose-600",
    "bg-emerald-700",
    "bg-teal-600",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name, size = "md", className }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-12 h-12 text-sm",
      lg: "w-20 h-20 text-xl",
    };

    if (src) {
      return (
        <img
          ref={ref as any}
          src={src}
          alt={name}
          className={clsx(
            "rounded-full object-cover",
            sizeClasses[size],
            className,
          )}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-full flex items-center justify-center font-medium text-cream-50",
          sizeClasses[size],
          getColorFromName(name),
          className,
        )}
      >
        {getInitials(name)}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";
