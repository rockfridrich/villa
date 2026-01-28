import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "animate-pulse bg-neutral-200",
          {
            "h-4 rounded": variant === "text",
            "rounded-full": variant === "circular",
            "rounded-lg": variant === "rectangular",
          },
          className,
        )}
        style={{
          width: width ?? (variant === "circular" ? height : "100%"),
          height: height ?? (variant === "text" ? undefined : "100%"),
          ...style,
        }}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";
