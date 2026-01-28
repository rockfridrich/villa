"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  hideCloseButton?: boolean;
  className?: string;
  preventOverlayClose?: boolean;
  size?: "sm" | "default" | "lg" | "full";
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  default: "sm:max-w-md",
  lg: "sm:max-w-lg",
  full: "sm:max-w-2xl",
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const mobileContentVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.2 },
  },
};

const desktopContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideCloseButton = false,
  className,
  preventOverlayClose = false,
  size = "default",
}: ModalProps) {
  const prefersReducedMotion = React.useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  ).current;

  const currentOverlayVariants = prefersReducedMotion
    ? reducedMotionVariants
    : overlayVariants;
  const currentMobileVariants = prefersReducedMotion
    ? reducedMotionVariants
    : mobileContentVariants;
  const currentDesktopVariants = prefersReducedMotion
    ? reducedMotionVariants
    : desktopContentVariants;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                variants={currentOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
                onClick={
                  preventOverlayClose ? undefined : () => onOpenChange(false)
                }
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <motion.div
                  variants={currentMobileVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={clsx(
                    "w-full bg-cream-50 shadow-villa-lg",
                    "rounded-t-xl max-h-[90vh] overflow-hidden",
                    "sm:rounded-xl sm:mx-4",
                    sizeClasses[size],
                    "sm:hidden",
                    className,
                  )}
                >
                  <ModalInner
                    title={title}
                    description={description}
                    hideCloseButton={hideCloseButton}
                    onClose={() => onOpenChange(false)}
                  >
                    {children}
                  </ModalInner>
                </motion.div>

                <motion.div
                  variants={currentDesktopVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={clsx(
                    "w-full bg-cream-50 shadow-villa-lg",
                    "rounded-xl mx-4 max-h-[85vh] overflow-hidden",
                    sizeClasses[size],
                    "hidden sm:block",
                    className,
                  )}
                >
                  <ModalInner
                    title={title}
                    description={description}
                    hideCloseButton={hideCloseButton}
                    onClose={() => onOpenChange(false)}
                  >
                    {children}
                  </ModalInner>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

interface ModalInnerProps {
  title: string;
  description?: string;
  hideCloseButton: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalInner({
  title,
  description,
  hideCloseButton,
  onClose,
  children,
}: ModalInnerProps) {
  return (
    <div className="flex flex-col max-h-[90vh] sm:max-h-[85vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <div className="space-y-1">
          <DialogPrimitive.Title className="text-lg font-serif text-ink">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm text-ink-muted">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className={clsx(
              "min-h-11 min-w-11 flex items-center justify-center",
              "rounded-lg text-ink-muted hover:text-ink hover:bg-cream-100",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
    </div>
  );
}

export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;
