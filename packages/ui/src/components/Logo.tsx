import { forwardRef } from "react";
import { clsx } from "clsx";
import { colors } from "../theme/colors";

export interface LogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg";
}

export const Logo = forwardRef<SVGSVGElement, LogoProps>(
  ({ className, size = "md", style, ...props }, ref) => {
    const dimensions = {
      sm: 24,
      md: 32,
      lg: 48,
    };

    const px = dimensions[size];

    return (
      <svg
        ref={ref}
        width={px}
        height={px}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx(className)}
        style={{ ...style }}
        {...props}
      >
        <path
          d="M8 4L16 28L24 4"
          stroke={colors.ink}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 28L24 4H30L19 32L16 28Z"
          fill={colors.accent}
          fillOpacity="0.5"
        />
      </svg>
    );
  }
);

Logo.displayName = "Logo";
