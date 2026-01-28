"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  type Variants,
  type PanInfo,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { clsx } from "clsx";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  hideHandle?: boolean;
  snapPoints?: number[];
  className?: string;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const sheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  hideHandle = false,
  className,
}: BottomSheetProps) {
  const prefersReducedMotion = React.useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  ).current;

  const controls = useAnimation();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);

  const currentOverlayVariants = prefersReducedMotion
    ? reducedMotionVariants
    : overlayVariants;
  const currentSheetVariants = prefersReducedMotion
    ? reducedMotionVariants
    : sheetVariants;

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const shouldClose =
      info.velocity.y > 500 || (info.velocity.y >= 0 && info.offset.y > 150);

    if (shouldClose) {
      controls.start("exit");
      onOpenChange(false);
    } else {
      controls.start("visible");
    }
  };

  React.useEffect(() => {
    if (open) {
      controls.start("visible");
    }
  }, [open, controls]);

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
                style={{ opacity: prefersReducedMotion ? undefined : opacity }}
                className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                variants={currentSheetVariants}
                initial="hidden"
                animate={controls}
                exit="exit"
                style={{ y: prefersReducedMotion ? undefined : y }}
                drag={prefersReducedMotion ? false : "y"}
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                className={clsx(
                  "fixed bottom-0 left-0 right-0 z-50",
                  "bg-cream-50 rounded-t-2xl shadow-villa-lg",
                  "max-h-[90vh] overflow-hidden",
                  "touch-none",
                  className,
                )}
              >
                {!hideHandle && (
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-neutral-200 rounded-full" />
                  </div>
                )}

                {title && (
                  <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100">
                    <DialogPrimitive.Title className="text-lg font-serif text-ink">
                      {title}
                    </DialogPrimitive.Title>
                    <button
                      onClick={() => onOpenChange(false)}
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
                  </div>
                )}

                <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
