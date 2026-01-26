import { forwardRef, type HTMLAttributes, useEffect } from "react";
import { clsx } from "clsx";
import { colors, spacing } from "../theme/colors";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className, children, isOpen, onClose, style, ...props }, ref) => {
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
          padding: 20,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={clsx(className)}
          style={{
            backgroundColor: colors.baseBackground,
            borderRadius: spacing.frameRadius,
            width: "100%",
            maxWidth: spacing.dialogWidth,
            height: "100%",
            maxHeight: spacing.dialogHeight,
            position: "relative",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${colors.ink}10`,
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

Dialog.displayName = "Dialog";
