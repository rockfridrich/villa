"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Key,
  Chrome,
} from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";
import { BottomSheet } from "@villa/ui";

import { AuthenticatingState, SuccessState, ErrorState } from "./AuthStates";
import { signInHeadless, createAccountHeadless } from "@/lib/porto";

type AuthState = "idle" | "authenticating" | "success" | "error";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (address: string) => void;
  onCancel?: () => void;
}

const springConfig = { type: "spring", stiffness: 300, damping: 40 } as const;

export function AuthModal({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: AuthModalProps) {
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "signin" | "create" | null
  >(null);

  const [isMobile, setIsMobile] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!open) {
      setAuthState("idle");
      setError(null);
      setShowEducation(false);
      setLoadingAction(null);
    }
  }, [open]);

  const handleSignIn = useCallback(async () => {
    setError(null);
    setAuthState("authenticating");
    setLoadingAction("signin");

    const result = await signInHeadless();

    if (result.success) {
      setAuthState("success");
      setTimeout(() => {
        onSuccess?.(result.address);
        onOpenChange(false);
      }, 1000);
    } else {
      const errorMsg = result.error?.message || "Sign in failed";
      if (!errorMsg.includes("cancelled") && !errorMsg.includes("aborted")) {
        setError(errorMsg);
        setAuthState("error");
      } else {
        setAuthState("idle");
      }
    }
    setLoadingAction(null);
  }, [onSuccess, onOpenChange]);

  const handleCreateAccount = useCallback(async () => {
    setError(null);
    setAuthState("authenticating");
    setLoadingAction("create");

    const result = await createAccountHeadless();

    if (result.success) {
      setAuthState("success");
      setTimeout(() => {
        onSuccess?.(result.address);
        onOpenChange(false);
      }, 1000);
    } else {
      const errorMsg = result.error?.message || "Account creation failed";
      if (!errorMsg.includes("cancelled") && !errorMsg.includes("aborted")) {
        setError(errorMsg);
        setAuthState("error");
      } else {
        setAuthState("idle");
      }
    }
    setLoadingAction(null);
  }, [onSuccess, onOpenChange]);

  const handleRetry = useCallback(() => {
    setAuthState("idle");
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const renderContent = () => {
    if (authState === "authenticating") {
      return (
        <AuthenticatingState
          message={
            loadingAction === "create"
              ? "Creating your Villa ID..."
              : "Signing in..."
          }
        />
      );
    }

    if (authState === "success") {
      return <SuccessState />;
    }

    if (authState === "error" && error) {
      return (
        <ErrorState
          message={error}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <div className="space-y-6" ref={containerRef}>
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-yellow to-villa-600 flex items-center justify-center shadow-villa">
            <span className="text-2xl font-serif text-accent-brown">V</span>
          </div>
          <h2 className="text-2xl font-serif text-ink">
            Your identity.{" "}
            <span className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent">
              No passwords.
            </span>
          </h2>
          <p className="text-sm text-ink-muted">
            Sign in with your fingerprint, face, or security key
          </p>
        </div>

        <button
          onClick={() => setShowEducation(!showEducation)}
          className="w-full flex items-center justify-between p-4 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors duration-150 motion-reduce:transition-none min-h-11"
          aria-expanded={showEducation}
          aria-controls="passkey-education"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <Info className="w-4 h-4 text-accent-brown" />
            Why passkeys?
          </span>
          {showEducation ? (
            <ChevronUp className="w-4 h-4 text-ink-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-muted" />
          )}
        </button>

        <AnimatePresence>
          {showEducation && (
            <motion.div
              id="passkey-education"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 text-sm text-ink-light bg-white border border-neutral-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Phishing-resistant</p>
                    <p className="text-xs text-ink-muted mt-1">
                      No passwords to steal or guess
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Biometric security</p>
                    <p className="text-xs text-ink-muted mt-1">
                      Face ID, Touch ID, or fingerprint
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Works everywhere</p>
                    <p className="text-xs text-ink-muted mt-1">
                      Sync across devices automatically
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={springConfig}
            onClick={handleSignIn}
            disabled={loadingAction !== null}
            className={clsx(
              "w-full min-h-14 px-6 py-3 text-base font-medium rounded-lg",
              "bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow",
              "hover:from-villa-600 hover:to-villa-700",
              "text-accent-brown",
              "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150 motion-reduce:transition-none",
            )}
          >
            Sign In
          </motion.button>

          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={springConfig}
            onClick={handleCreateAccount}
            disabled={loadingAction !== null}
            className={clsx(
              "w-full min-h-14 px-6 py-3 text-base font-medium rounded-lg",
              "bg-cream-100 hover:bg-cream-200",
              "text-ink border border-neutral-100",
              "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150 motion-reduce:transition-none",
            )}
          >
            Create Villa ID
          </motion.button>
        </div>

        <div className="pt-2">
          <p className="text-xs text-center text-ink-muted mb-3">
            Works with your passkey manager
          </p>
          <div className="grid grid-cols-3 gap-2">
            <PasskeyProvider
              icon="1P"
              label="1Password"
              colors="from-blue-500 to-blue-600"
            />
            <PasskeyProvider
              icon={<Key className="w-4 h-4 text-white" />}
              label="iCloud"
              colors="from-gray-700 to-gray-900"
            />
            <PasskeyProvider
              icon="G"
              label="Google"
              colors="from-blue-600 to-green-600"
            />
            <PasskeyProvider
              icon="W"
              label="Windows"
              colors="from-blue-500 to-cyan-400"
            />
            <PasskeyProvider
              icon={<Chrome className="w-4 h-4 text-white" />}
              label="Browser"
              colors="from-orange-500 to-red-500"
            />
            <PasskeyProvider
              icon={<ShieldCheck className="w-4 h-4 text-white" />}
              label="FIDO2"
              colors="from-green-600 to-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <span className="text-sm text-ink-muted">
            Secured by passkeys on Base
          </span>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <div className="px-6 py-4 pb-8">{renderContent()}</div>
      </BottomSheet>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title=""
      hideCloseButton={authState !== "idle"}
      size="sm"
    >
      {renderContent()}
    </Modal>
  );
}

interface PasskeyProviderProps {
  icon: React.ReactNode | string;
  label: string;
  colors: string;
}

function PasskeyProvider({ icon, label, colors }: PasskeyProviderProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-lg border border-neutral-100">
      <div
        className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center`}
      >
        {typeof icon === "string" ? (
          <span className="text-white text-xs font-bold">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}
