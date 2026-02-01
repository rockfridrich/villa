"use client";

import "@villa/ui";
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
import {
  Loader2,
  ShieldCheck,
  Fingerprint,
  UserPlus,
  AlertCircle,
} from "lucide-react";
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

// Porto-style Layout Components matching their exact structure
function PortoLayout({
  children,
  className = "",
  isEmbedded = false,
}: {
  children: React.ReactNode;
  className?: string;
  isEmbedded?: boolean;
}) {
  // When embedded (iframe/popup), use exact Porto dimensions with clean white background
  if (isEmbedded) {
    return (
      <div
        className="w-full h-full relative bg-white overflow-hidden font-sans"
        style={{
          width: DIALOG_WIDTH,
          height: DIALOG_HEIGHT,
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`w-full h-full flex flex-col ${className}`}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // Standalone mode - full page with Porto-inspired minimal design
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-gray-50 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-[380px] h-[520px] bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden ${className}`}
      >
        {children}
      </motion.div>

      {/* Simple footer credit */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-3 h-3" />
          <span>Secured by passkeys</span>
        </div>
      </div>
    </div>
  );
}

// Porto-style Layout Header Component
function LayoutHeader({
  children,
  className = "",
  icon,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      className={`flex items-center px-6 py-4 border-b border-gray-100 ${className}`}
    >
      <div className="flex items-center gap-3 w-full">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        {title && (
          <div className="flex-1 text-lg font-semibold text-gray-900">
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Porto-style Layout Content Component
function LayoutContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex-1 px-6 py-6 ${className}`}>{children}</div>;
}

// Porto-style Layout Footer Component
function LayoutFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// Porto-style Actions Component (for buttons)
function LayoutActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-3 ${className}`}>{children}</div>;
}

// Porto-style Button Component matching their design
function PortoButton({
  children,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "large" | "medium";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const baseClasses =
    "w-full flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses =
    size === "large"
      ? "min-h-[56px] px-6 py-4 text-base"
      : "min-h-[44px] px-4 py-3 text-sm";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900",
    outline:
      "border border-gray-300 hover:border-gray-400 active:border-gray-500 bg-white hover:bg-gray-50 text-gray-700",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 40 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
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
      <PortoLayout isEmbedded={isEmbedded}>
        <LayoutHeader
          icon={<AlertCircle className="w-6 h-6 text-red-500" />}
          title="Passkeys Not Supported"
        />
        <LayoutContent className="text-center">
          <p className="text-gray-600 text-sm leading-relaxed">
            Your browser doesn&apos;t support passkeys. Please use a modern
            browser like Chrome, Safari, or Firefox.
          </p>
        </LayoutContent>
        <LayoutFooter>
          <PortoButton variant="outline" onClick={handleCancel}>
            Cancel
          </PortoButton>
        </LayoutFooter>
      </PortoLayout>
    );
  }

  if (authState === "passkey-prompt") {
    return (
      <PortoLayout isEmbedded={isEmbedded}>
        <LayoutHeader
          icon={
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <Fingerprint className="w-5 h-5 text-blue-600" />
            </motion.div>
          }
          title={isCreating ? "Create Passkey" : "Use Passkey"}
        />
        <LayoutContent className="text-center">
          <p className="text-gray-600 text-sm leading-relaxed">
            {isCreating
              ? "Follow the prompt to create a new passkey for Villa"
              : "Use Face ID, Touch ID, or your security key"}
          </p>
        </LayoutContent>
        <LayoutFooter>
          <PortoButton variant="outline" onClick={handleCancel}>
            Cancel
          </PortoButton>
        </LayoutFooter>
      </PortoLayout>
    );
  }

  if (authState === "processing" || authState === "success") {
    return (
      <PortoLayout isEmbedded={isEmbedded}>
        <LayoutHeader
          icon={
            authState === "success" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
              >
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </motion.div>
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              </div>
            )
          }
          title={authState === "success" ? "Welcome!" : "Setting up..."}
        />
        <LayoutContent className="text-center">
          <p className="text-gray-600 text-sm">
            {authState === "success"
              ? "            You&apos;re signed in"
              : "Setting up your Villa ID profile..."}
          </p>
        </LayoutContent>
      </PortoLayout>
    );
  }

  if (authState === "error") {
    return (
      <PortoLayout isEmbedded={isEmbedded}>
        <LayoutHeader
          icon={<AlertCircle className="w-6 h-6 text-red-500" />}
          title="Something went wrong"
        />
        <LayoutContent>
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
            <p className="text-red-700 text-sm">
              {error ||
                "Something didn&apos;t work as expected. Please try again or contact support if the issue persists."}
            </p>
          </div>
        </LayoutContent>
        <LayoutFooter>
          <LayoutActions>
            <PortoButton onClick={handleRetry}>Try Again</PortoButton>
            <PortoButton variant="outline" onClick={handleCancel}>
              Cancel
            </PortoButton>
          </LayoutActions>
        </LayoutFooter>
      </PortoLayout>
    );
  }

  // Main auth screen - Porto-style layout
  return (
    <PortoLayout isEmbedded={isEmbedded}>
      <LayoutHeader
        icon={
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
        }
        title="Villa"
      />
      <LayoutContent>
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Sign in with your passkey or create a new Villa ID
          </p>
        </div>

        {error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </LayoutContent>
      <LayoutFooter>
        <LayoutActions>
          <PortoButton
            onClick={handleSignIn}
            disabled={authState !== "idle"}
            loading={authState !== "idle" && !isCreating}
          >
            <Fingerprint className="w-5 h-5" />
            Sign In
          </PortoButton>

          {hasAccounts === false && (
            <PortoButton
              variant="secondary"
              onClick={handleCreateAccount}
              disabled={authState !== "idle"}
              loading={authState !== "idle" && isCreating}
            >
              <UserPlus className="w-5 h-5" />
              Create Villa ID
            </PortoButton>
          )}

          <PortoButton variant="outline" size="medium" onClick={handleCancel}>
            Cancel
          </PortoButton>
        </LayoutActions>
      </LayoutFooter>
    </PortoLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
