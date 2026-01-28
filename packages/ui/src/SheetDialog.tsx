"use client";

import * as React from "react";
import { Drawer } from "vaul";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface SheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "default" | "lg" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  default: "sm:max-w-md",
  lg: "sm:max-w-lg",
  full: "sm:max-w-2xl",
};

export function SheetDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "default",
  className,
}: SheetDialogProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const checkDesktop = () =>
      setIsDesktop(window.matchMedia("(min-width: 640px)").matches);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  if (isDesktop) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={clsx(
              "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-cream-200 bg-cream p-6 shadow-villa-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
              sizeClasses[size],
              className,
            )}
          >
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              {title && (
                <DialogPrimitive.Title className="text-lg font-serif leading-none tracking-tight text-ink">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-ink-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-ink-muted opacity-70 transition-opacity hover:bg-cream-100 hover:text-ink hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-cream-100 data-[state=open]:text-ink-muted">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border-t border-cream-200 bg-cream">
          <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-cream-200" />
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col space-y-1.5 text-center">
              {title && (
                <Drawer.Title className="text-lg font-serif leading-none tracking-tight text-ink">
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="text-sm text-ink-muted">
                  {description}
                </Drawer.Description>
              )}
            </div>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
