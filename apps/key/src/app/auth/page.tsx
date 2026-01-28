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
  getRemotePorto,
  initRemoteBridge,
  RemoteActions,
  RemoteEvents,
  hasExistingAccounts,
} from "@/lib/porto";
import { generateNickname } from "@/lib/nickname";

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "https://construction.villa.cash";

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
  "https://key.villa.cash",
  "https://fake-key.villa.cash",
  "https://villa.cash",
  "https://www.villa.cash",
  "https://construction.villa.cash",
  "https://docs.villa.cash",
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

/**
 * Check if an origin is a LAN IP address (for mobile LAN testing)
 * Supports RFC 1918 private address ranges:
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 */
function isLanOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/.test(
      hostname,
    );
  } catch {
    return false;
  }
}

/**
 * Check if we're in a development environment
 */
function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        isLanOrigin(window.location.origin)))
  );
}

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

function isValidHttpsOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string): boolean {
  if (VILLA_ORIGINS.includes(origin as (typeof VILLA_ORIGINS)[number]))
    return true;
  if (DEV_ORIGINS.includes(origin as (typeof DEV_ORIGINS)[number])) return true;
  if (isDevelopment() && isLanOrigin(origin)) return true;
  return isValidHttpsOrigin(origin);
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

// Porto dialog dimensions (exact match)
const DIALOG_WIDTH = 380;
const DIALOG_HEIGHT = 520;

function GlassLayout({
  children,
  className = "",
  isEmbedded = false,
}: {
  children: React.ReactNode;
  className?: string;
  isEmbedded?: boolean;
}) {
  // When embedded (iframe/popup), use exact Porto dimensions
  if (isEmbedded) {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center bg-[#FFFCF8] overflow-hidden font-sans"
        style={{
          width: DIALOG_WIDTH,
          height: DIALOG_HEIGHT,
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full h-full flex flex-col items-center justify-center text-center p-6 ${className}`}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // Standalone mode - full page with ambient effects
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-[#FFFDF8] overflow-hidden font-sans">
      {/* Ambient Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FFE047]/15 blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#E3DACE]/20 blur-[100px] pointer-events-none mix-blend-multiply" />

      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 w-full max-w-[380px] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_-10px_rgba(13,13,23,0.04)] rounded-[24px] p-6 flex flex-col items-center text-center ${className}`}
      >
        {children}
      </motion.div>

      {/* Footer Credit - Outside card for depth */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 opacity-60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <span className="text-xs text-ink-muted font-medium tracking-wide">
            Secured by passkeys on Base
          </span>
        </div>
        <span className="text-[10px] text-ink-muted/60 font-mono">v0.2.0</span>
      </div>
    </div>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const hasNotifiedReady = useRef(false);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);

  const queryOrigin = searchParams.get("origin");
  const targetOrigin = useMemo(
    () => getValidatedParentOrigin(queryOrigin),
    [queryOrigin],
  );
  const inPopup = useMemo(() => isInPopup(), []);
  const inIframe = useMemo(() => isInIframe(), []);
  const isEmbedded = inIframe || inPopup;

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
    if (!hasNotifiedReady.current && targetOrigin) {
      hasNotifiedReady.current = true;
      postToParent({ type: "VILLA_READY" });
    }
  }, [postToParent, targetOrigin]);

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

  useEffect(() => {
    hasExistingAccounts().then(setHasAccounts);
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

  useEffect(() => {
    if (!inIframe && !inPopup) return;

    const porto = getRemotePorto();

    initRemoteBridge().catch((e) => {
      console.warn("[Villa Auth] Failed to init Porto bridge:", e);
    });

    const unsubscribe = RemoteEvents.onDialogRequest(porto, async (payload) => {
      if (!payload.request) return;

      const { request } = payload;

      if (
        request.method === "wallet_connect" ||
        request.method === "eth_requestAccounts"
      ) {
        const params = request.params?.[0] as
          | { capabilities?: { createAccount?: boolean } }
          | undefined;
        const isCreate = params?.capabilities?.createAccount === true;

        setIsCreating(isCreate);
        setAuthState("passkey-prompt");

        try {
          const result = isCreate ? await createAccount() : await signIn();
          if (result.success) {
            await RemoteActions.respond(porto, request, {
              result: {
                accounts: [{ address: result.address }],
              },
            });
            handleSuccess(result.address, isCreate);
          } else {
            await RemoteActions.reject(porto, request);
            setError(result.error?.message || "Authentication failed");
            setAuthState("error");
          }
        } catch (err) {
          await RemoteActions.reject(porto, request);
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          setError(errorMsg);
          setAuthState("error");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [inIframe, inPopup, handleSuccess]);

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
      <GlassLayout isEmbedded={isEmbedded}>
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-serif text-ink mb-2">
          Passkeys Not Supported
        </h1>
        <p className="text-sm text-ink-muted">
          Your browser doesn&apos;t support passkeys. Please use a modern
          browser like Chrome, Safari, or Firefox.
        </p>
      </GlassLayout>
    );
  }

  if (authState === "passkey-prompt") {
    return (
      <GlassLayout isEmbedded={isEmbedded}>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 mx-auto bg-accent-yellow/20 rounded-2xl flex items-center justify-center mb-6"
        >
          <Fingerprint className="w-10 h-10 text-accent-brown" />
        </motion.div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-serif text-ink">
            {isCreating ? "Create your passkey" : "Use your passkey"}
          </h2>
          <p className="text-sm text-ink-muted">
            {isCreating
              ? "Follow the prompt to create a new passkey for Villa"
              : "Use Face ID, Touch ID, or your security key"}
          </p>
        </div>

        <button
          onClick={handleCancel}
          className="text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2 rounded-lg hover:bg-black/5"
        >
          Cancel
        </button>
      </GlassLayout>
    );
  }

  if (authState === "processing" || authState === "success") {
    return (
      <GlassLayout isEmbedded={isEmbedded}>
        {authState === "success" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto bg-accent-green/20 rounded-2xl flex items-center justify-center mb-6"
          >
            <ShieldCheck className="w-10 h-10 text-accent-green" />
          </motion.div>
        ) : (
          <div className="w-20 h-20 mx-auto bg-white/50 rounded-2xl flex items-center justify-center mb-6">
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
              : "Setting up your Villa ID profile..."}
          </p>
        </div>
      </GlassLayout>
    );
  }

  if (authState === "error") {
    return (
      <GlassLayout isEmbedded={isEmbedded}>
        <div className="w-20 h-20 mx-auto bg-red-100/50 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-3xl">😕</span>
        </div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-serif text-ink">Something went wrong</h2>
          <p className="text-sm text-ink-muted max-w-[260px] mx-auto">
            {error ||
              "Something didn't work as expected. Please try again or contact support if the issue persists."}
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleRetry}
            className="w-full min-h-14 py-4 px-6 bg-accent-yellow hover:bg-[#FDD835]
                       text-accent-brown font-medium rounded-2xl
                       shadow-[0_4px_12px_rgba(255,224,71,0.3)]
                       transition-all active:scale-[0.98]"
          >
            Try Signing In Again
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-3 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </GlassLayout>
    );
  }

  return (
    <GlassLayout isEmbedded={isEmbedded}>
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-yellow to-villa-500 rounded-3xl flex items-center justify-center shadow-lg shadow-accent-yellow/20 mb-6 rotate-3">
        <span className="text-3xl font-serif text-accent-brown">V</span>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-serif text-ink">Villa</h1>
        <p className="text-sm text-ink-muted">Passkey authentication</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="w-full"
          >
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-error-text">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full space-y-3">
        <button
          onClick={handleSignIn}
          disabled={authState !== "idle"}
          className="w-full min-h-14 py-4 px-6 bg-accent-yellow hover:bg-[#FDD835]
                     text-accent-brown font-medium rounded-2xl
                     shadow-[0_4px_12px_rgba(255,224,71,0.3)] hover:shadow-[0_6px_16px_rgba(255,224,71,0.4)]
                     focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-[#FFFDF8]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Fingerprint className="w-5 h-5" />
          Sign In
        </button>

        {hasAccounts === false && (
          <button
            onClick={handleCreateAccount}
            disabled={authState !== "idle"}
            className="w-full min-h-14 py-4 px-6 bg-white/50 border border-white/60
                       text-ink font-medium rounded-2xl hover:bg-white/80
                       focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-[#FFFDF8]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create Villa ID
          </button>
        )}

        <button
          onClick={handleCancel}
          className="w-full min-h-11 py-3 text-sm text-ink-muted hover:text-ink
                     focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-2 focus:ring-offset-[#FFFDF8]
                     rounded-lg transition-colors mt-2"
        >
          Cancel
        </button>
      </div>
    </GlassLayout>
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
