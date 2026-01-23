"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Fingerprint, UserPlus } from "lucide-react";
import {
  createAccount,
  signIn,
  isPortoSupported,
  setWebAuthnHandlers,
} from "@/lib/porto";
import { generateNickname } from "@/lib/nickname";

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "https://beta.villa.cash";

interface ProfileData {
  nickname: string;
  avatar?: {
    style: string;
    selection: string;
    variant: number;
  };
}

async function persistProfile(
  address: string,
  nickname: string,
  maxRetries = 3,
): Promise<{ nickname: string; persisted: boolean }> {
  let currentNickname = nickname;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${HUB_API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nickname: currentNickname,
          avatar: { style: "lorelei", selection: address, variant: 0 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { nickname: data.nickname || currentNickname, persisted: true };
      }

      const isNicknameCollision = response.status === 409;
      if (isNicknameCollision) {
        const suffix = Math.floor(Math.random() * 1000);
        currentNickname = `${nickname}${suffix}`;
        continue;
      }

      return { nickname, persisted: false };
    } catch {
      return { nickname, persisted: false };
    }
  }

  return { nickname: currentNickname, persisted: false };
}

async function fetchProfile(address: string): Promise<ProfileData | null> {
  try {
    const response = await fetch(
      `${HUB_API_URL}/api/profile/${address.toLowerCase()}`,
    );
    if (response.ok) {
      const data = await response.json();
      return {
        nickname: data.nickname || "",
        avatar: data.avatar || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

const VILLA_ORIGINS = [
  "https://villa.cash",
  "https://www.villa.cash",
  "https://beta.villa.cash",
  "https://dev-1.villa.cash",
  "https://dev-2.villa.cash",
  "https://docs.villa.cash",
  "https://developers.villa.cash",
  "https://key.villa.cash",
  "https://beta-key.villa.cash",
] as const;

const DEV_ORIGINS = [
  "https://local.villa.cash",
  "https://localhost",
  "https://localhost:443",
  "https://localhost:3000",
  "https://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3001",
] as const;

const REGISTERED_APP_ORIGINS = [
  "https://lovable.dev",
  "https://www.lovable.dev",
] as const;

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isInPopup(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const explicitMode = params.get("mode");
  return (
    explicitMode === "popup" ||
    (window.opener != null && window.opener !== window)
  );
}

function isAllowedOrigin(origin: string): boolean {
  return (
    VILLA_ORIGINS.includes(origin as (typeof VILLA_ORIGINS)[number]) ||
    DEV_ORIGINS.includes(origin as (typeof DEV_ORIGINS)[number]) ||
    REGISTERED_APP_ORIGINS.includes(
      origin as (typeof REGISTERED_APP_ORIGINS)[number],
    )
  );
}

function getValidatedParentOrigin(queryOrigin: string | null): string | null {
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const referrerOrigin = referrerUrl.origin;
      if (isAllowedOrigin(referrerOrigin)) {
        return referrerOrigin;
      }
    } catch {
      // Invalid referrer URL
    }
  }

  if (queryOrigin && isAllowedOrigin(queryOrigin)) {
    return queryOrigin;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      if (typeof document !== "undefined" && document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          if (
            DEV_ORIGINS.includes(
              referrerUrl.origin as (typeof DEV_ORIGINS)[number],
            )
          ) {
            return referrerUrl.origin;
          }
        } catch {
          // Invalid referrer
        }
      }
      return "https://localhost";
    }
  }

  return null;
}

type AuthState = "idle" | "passkey-prompt" | "processing" | "success" | "error";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const hasNotifiedReady = useRef(false);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const queryOrigin = searchParams.get("origin");
  const targetOrigin = useMemo(
    () => getValidatedParentOrigin(queryOrigin),
    [queryOrigin],
  );
  const inPopup = useMemo(() => isInPopup(), []);
  const inIframe = useMemo(() => isInIframe(), []);

  const postToParent = useCallback(
    (message: Record<string, unknown>) => {
      if (!inPopup && !inIframe) return;
      if (!targetOrigin) {
        console.warn(
          "[Villa Auth] No trusted origin found, message not sent:",
          message,
        );
        return;
      }
      const target = inPopup ? window.opener : window.parent;
      if (target) {
        target.postMessage(message, targetOrigin);
      }
    },
    [targetOrigin, inPopup, inIframe],
  );

  useEffect(() => {
    if (!hasNotifiedReady.current) {
      hasNotifiedReady.current = true;
      postToParent({ type: "VILLA_READY" });
    }
  }, [postToParent]);

  useEffect(() => {
    setWebAuthnHandlers({
      onPasskeyCreate: () => setAuthState("passkey-prompt"),
      onPasskeyGet: () => setAuthState("passkey-prompt"),
      onComplete: () => setAuthState("processing"),
      onError: (err) => {
        setError(err.message);
        setAuthState("error");
      },
    });
  }, []);

  const handleSuccess = useCallback(
    async (address: string, isNewAccount: boolean = false) => {
      setAuthState("processing");

      let nickname = "";
      let avatar: ProfileData["avatar"] | undefined;

      if (isNewAccount) {
        const generatedNickname = generateNickname(address);
        const { nickname: persistedNickname } = await persistProfile(
          address,
          generatedNickname,
        );
        nickname = persistedNickname;
        avatar = { style: "lorelei", selection: address, variant: 0 };
      } else {
        const profile = await fetchProfile(address);
        nickname = profile?.nickname || "";
        avatar = profile?.avatar;
      }

      setAuthState("success");

      const identity = {
        address,
        nickname,
        avatar: avatar || { style: "lorelei", seed: address },
      };
      postToParent({ type: "AUTH_SUCCESS", identity });
      postToParent({ type: "VILLA_AUTH_SUCCESS", payload: { identity } });
      if (inPopup) {
        setTimeout(() => window.close(), 500);
      }
    },
    [postToParent, inPopup],
  );

  const handleCancel = useCallback(() => {
    postToParent({ type: "AUTH_CLOSE" });
    postToParent({ type: "VILLA_AUTH_CANCEL" });
    if (inPopup) {
      setTimeout(() => window.close(), 500);
    }
  }, [postToParent, inPopup]);

  const handleSignIn = async () => {
    setError(null);
    setIsCreating(false);
    setAuthState("passkey-prompt");
    const result = await signIn();
    if (result.success) {
      handleSuccess(result.address, false);
    } else {
      setError(result.error?.message || "Sign in failed");
      setAuthState("error");
    }
  };

  const handleCreateAccount = async () => {
    setError(null);
    setIsCreating(true);
    setAuthState("passkey-prompt");
    const result = await createAccount();
    if (result.success) {
      handleSuccess(result.address, true);
    } else {
      setError(result.error?.message || "Account creation failed");
      setAuthState("error");
    }
  };

  const handleRetry = () => {
    setError(null);
    setAuthState("idle");
    setIsCreating(false);
  };

  if (!isPortoSupported()) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-serif text-ink mb-2">
            Passkeys Not Supported
          </h1>
          <p className="text-sm text-ink-muted">
            Your browser doesn&apos;t support passkeys. Please use a modern
            browser like Chrome, Safari, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  if (authState === "passkey-prompt") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6"
      >
        <div className="text-center space-y-6 max-w-sm">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 mx-auto bg-accent-yellow rounded-2xl flex items-center justify-center"
          >
            <Fingerprint className="w-10 h-10 text-accent-brown" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif text-ink">
              {isCreating ? "Create your passkey" : "Use your passkey"}
            </h2>
            <p className="text-sm text-ink-muted">
              {isCreating
                ? "Follow the prompt to create a new passkey for Villa"
                : "Use Face ID, Touch ID, or your security key"}
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={handleCancel}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (authState === "processing" || authState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6"
      >
        <div className="text-center space-y-6 max-w-sm">
          {authState === "success" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto bg-accent-green/20 rounded-2xl flex items-center justify-center"
            >
              <ShieldCheck className="w-10 h-10 text-accent-green" />
            </motion.div>
          ) : (
            <div className="w-20 h-20 mx-auto bg-cream-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-accent-brown animate-spin" />
            </div>
          )}
          <div className="space-y-2">
            <h2 className="text-2xl font-serif text-ink">
              {authState === "success" ? "Welcome!" : "Setting up..."}
            </h2>
            <p className="text-sm text-ink-muted">
              {authState === "success"
                ? "You're signed in"
                : "Getting your profile ready"}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (authState === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6"
      >
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">😕</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif text-ink">
              Something went wrong
            </h2>
            <p className="text-sm text-ink-muted">
              {error || "Please try again"}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full min-h-14 py-4 px-6 bg-accent-yellow hover:bg-villa-600
                         text-accent-brown font-medium rounded-xl
                         transition-all active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-3 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cream-50 flex flex-col justify-between p-6"
    >
      <div className="pt-12 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-yellow to-villa-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-2xl font-serif text-accent-brown">V</span>
        </div>
        <h1 className="text-2xl font-serif text-ink">Villa</h1>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif text-ink">Sign in with passkey</h2>
          <p className="text-sm text-ink-muted">
            Use your fingerprint, face, or security key
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            disabled={authState !== "idle"}
            className="w-full min-h-14 py-4 px-6 bg-accent-yellow hover:bg-villa-600
                       text-accent-brown font-medium rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            Sign In
          </button>

          <button
            onClick={handleCreateAccount}
            disabled={authState !== "idle"}
            className="w-full min-h-14 py-4 px-6 bg-cream-100 border border-neutral-200
                       text-ink font-medium rounded-xl hover:bg-cream-200
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create Villa ID
          </button>

          <button
            onClick={handleCancel}
            className="w-full min-h-11 py-3 text-sm text-ink-muted hover:text-ink
                       focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-2 focus:ring-offset-cream-50
                       rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="pb-8 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent-green" />
        <span className="text-xs text-ink-muted">
          Secured by passkeys on Base
        </span>
      </div>
    </motion.div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-ink-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
