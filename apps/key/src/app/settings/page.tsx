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
import {
  Loader2,
  LogOut,
  Check,
  X,
  User,
  Palette,
  AlertCircle,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Web3Avatar } from "@/lib/web3-avatar";
import {
  getPorto,
  createAccount,
  signIn,
  isPortoSupported,
  hasExistingAccounts,
  type PortoConnectResult,
} from "@/lib/porto";
import {
  estimateClaimGas,
  encodeMintNickname,
  hasClaimedNickname,
  isNicknameAvailable,
  type ClaimNicknameResult,
  type GasEstimate,
  NICKNAME_RESOLVER_CONFIG,
} from "@/lib/nickname-resolver";

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "https://construction.villa.cash";

const AVATAR_STYLES = ["web3", "lorelei", "adventurer", "avataaars"] as const;

const DIALOG_WIDTH = 380;
const DIALOG_HEIGHT = 520;

interface ProfileData {
  nickname: string;
  avatar?: { style: string; seed: string };
}

const VILLA_ORIGINS = [
  "https://villa.cash",
  "https://www.villa.cash",
  "https://construction.villa.cash",
  "https://construction.villa.cash",
  "https://docs.villa.cash",
  "https://key.villa.cash",
] as const;

const DEV_ORIGINS = [
  "https://local.villa.cash",
  "https://localhost",
  "https://localhost:3000",
  "http://localhost:3000",
] as const;

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
  return isValidHttpsOrigin(origin);
}

function getValidatedParentOrigin(queryOrigin: string | null): string | null {
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (isAllowedOrigin(referrerUrl.origin)) {
        return referrerUrl.origin;
      }
    } catch {}
  }
  if (queryOrigin && isAllowedOrigin(queryOrigin)) {
    return queryOrigin;
  }
  return null;
}

function isInPopup(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("mode") === "popup" ||
    (window.opener != null && window.opener !== window)
  );
}

function isInIframe(): boolean {
  if (typeof window === "undefined") return false;
  return window.self !== window.top;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const hasNotifiedReady = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("web3");
  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ENS claiming state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ensClaimStatus, setEnsClaimStatus] = useState<
    | "idle"
    | "connecting"
    | "estimating"
    | "confirming"
    | "pending"
    | "success"
    | "error"
  >("idle");
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [ensClaimError, setEnsClaimError] = useState<string | null>(null);
  const [ensAlreadyClaimed, setEnsAlreadyClaimed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const queryOrigin = searchParams.get("origin");
  const address = searchParams.get("address");
  const targetOrigin = useMemo(
    () => getValidatedParentOrigin(queryOrigin),
    [queryOrigin],
  );
  const inPopup = useMemo(() => isInPopup(), []);
  const inIframe = useMemo(() => isInIframe(), []);

  const postToParent = useCallback(
    (message: Record<string, unknown>) => {
      if (!inPopup && !inIframe) return;
      if (!targetOrigin) return;
      const target = inIframe ? window.parent : window.opener;
      if (target) {
        target.postMessage(message, targetOrigin);
      }
    },
    [targetOrigin, inPopup, inIframe],
  );

  const checkNicknameAvailability = useCallback(
    async (nicknameToCheck: string) => {
      if (!nicknameToCheck.trim() || nicknameToCheck === originalNickname) {
        setNicknameAvailable(null);
        setNicknameError(null);
        return;
      }

      setCheckingNickname(true);
      setNicknameError(null);

      try {
        const res = await fetch(
          `${HUB_API_URL}/api/nicknames/check/${encodeURIComponent(nicknameToCheck.trim())}`,
        );
        const data = await res.json();

        if (data.available) {
          setNicknameAvailable(true);
        } else {
          setNicknameAvailable(false);
          setNicknameError(data.error || "Nickname not available");
        }
      } catch (error) {
        setNicknameError("Failed to check availability");
        setNicknameAvailable(null);
      }

      setCheckingNickname(false);
    },
    [originalNickname],
  );

  useEffect(() => {
    if (!hasNotifiedReady.current) {
      hasNotifiedReady.current = true;
      postToParent({ type: "VILLA_READY" });
    }
  }, [postToParent]);

  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${HUB_API_URL}/api/profile/${address.toLowerCase()}`,
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          const currentNickname = data.nickname || "";
          setNickname(currentNickname);
          setOriginalNickname(currentNickname);
          setSelectedStyle(data.avatar?.style || "web3");
        }
      } catch {}
      setLoading(false);
    }
    loadProfile();
  }, [address]);

  // Debounced nickname validation
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (nickname.trim() && nickname !== originalNickname) {
      checkTimeoutRef.current = setTimeout(() => {
        checkNicknameAvailability(nickname);
      }, 500);
    } else {
      setNicknameAvailable(null);
      setNicknameError(null);
      setCheckingNickname(false);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [nickname, originalNickname, checkNicknameAvailability]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!address || !nickname.trim()) return;

    // Don't save if there are validation errors or availability issues
    if (
      nicknameError ||
      (nickname !== originalNickname && nicknameAvailable === false)
    ) {
      return;
    }

    setSaving(true);
    setNicknameError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`${HUB_API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nickname: nickname.trim(),
          avatar: { style: selectedStyle, seed: address },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        const identity = {
          address,
          nickname: updated.nickname,
          avatar: { style: selectedStyle, seed: address },
        };

        // Send settings update message
        postToParent({
          type: "VILLA_SETTINGS_UPDATE",
          nickname: updated.nickname,
        });

        // Also send auth success for compatibility
        postToParent({ type: "VILLA_AUTH_SUCCESS", payload: { identity } });

        setSaveSuccess(true);
        setOriginalNickname(updated.nickname);
        setNicknameAvailable(null);

        if (inPopup) {
          setTimeout(() => window.close(), 1000);
        }
      } else if (res.status === 409) {
        setNicknameError("Nickname already taken");
      } else {
        setNicknameError("Failed to save");
      }
    } catch {
      setNicknameError("Network error");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    postToParent({ type: "VILLA_AUTH_CANCEL" });
    if (inPopup) {
      setTimeout(() => window.close(), 300);
    }
  };

  const handleLogout = () => {
    postToParent({
      type: "VILLA_AUTH_ERROR",
      payload: { error: "User logged out", code: "LOGOUT" },
    });
    if (inPopup) {
      setTimeout(() => window.close(), 300);
    }
  };

  const connectWallet = async () => {
    if (!isPortoSupported()) {
      setEnsClaimError("Passkeys not supported in this browser");
      return;
    }

    setEnsClaimStatus("connecting");
    setEnsClaimError(null);

    try {
      let result: PortoConnectResult;

      if (await hasExistingAccounts()) {
        result = await signIn();
      } else {
        result = await createAccount();
      }

      if (result.success) {
        setWalletConnected(true);
        setWalletAddress(result.address);
        setEnsClaimStatus("idle");

        const alreadyClaimed = await hasClaimedNickname(result.address);
        setEnsAlreadyClaimed(alreadyClaimed);
      } else {
        throw result.error;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      setEnsClaimError(errorMessage);
      setEnsClaimStatus("error");
    }
  };

  const handleEnsClaimRequest = async () => {
    if (!walletAddress || !nickname.trim()) return;

    setEnsClaimStatus("estimating");
    setEnsClaimError(null);
    setGasEstimate(null);

    try {
      const available = await isNicknameAvailable(nickname.trim());
      if (!available) {
        setEnsClaimError("Nickname not available on-chain");
        setEnsClaimStatus("error");
        return;
      }

      const estimate = await estimateClaimGas(
        walletAddress as `0x${string}`,
        nickname.trim(),
      );
      setGasEstimate(estimate);
      setEnsClaimStatus("confirming");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to estimate gas";
      setEnsClaimError(errorMessage);
      setEnsClaimStatus("error");
    }
  };

  const confirmEnsClaim = async () => {
    if (!walletAddress || !nickname.trim() || !gasEstimate) return;

    setEnsClaimStatus("pending");
    setEnsClaimError(null);

    try {
      const porto = getPorto();
      const data = encodeMintNickname(
        walletAddress as `0x${string}`,
        nickname.trim(),
      );

      const accounts = await porto.provider.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No connected account");
      }

      const from = accounts[0] as `0x${string}`;

      const txHashResult = await porto.provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: NICKNAME_RESOLVER_CONFIG.address,
            data,
            gas: `0x${gasEstimate.gasLimit.toString(16)}`,
          },
        ],
      });

      const hash = txHashResult as string;
      setTxHash(hash);
      setEnsClaimStatus("success");

      postToParent({
        type: "VILLA_ENS_CLAIMED",
        payload: {
          nickname: nickname.trim(),
          txHash: hash,
          address: walletAddress,
        },
      });
    } catch (error) {
      let errorMessage = "Failed to claim nickname";
      let code: string = "NETWORK_ERROR";

      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage = "Transaction rejected by user";
          code = "USER_REJECTED";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
          code = "INSUFFICIENT_GAS";
        } else {
          errorMessage = error.message;
        }
      }

      setEnsClaimError(errorMessage);
      setEnsClaimStatus("error");
    }
  };

  const resetEnsClaim = () => {
    setEnsClaimStatus("idle");
    setGasEstimate(null);
    setEnsClaimError(null);
    setTxHash(null);
  };

  if (loading) {
    return (
      <div
        className="bg-[#FFFDF8] flex items-center justify-center"
        style={{ width: DIALOG_WIDTH, height: DIALOG_HEIGHT }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#FFE047]" />
      </div>
    );
  }

  if (!address) {
    return (
      <div
        className="bg-[#FFFDF8] flex items-center justify-center p-4"
        style={{ width: DIALOG_WIDTH, height: DIALOG_HEIGHT }}
      >
        <div className="text-center">
          <p className="text-[#0D0D17]/60">Missing address parameter</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#FFFDF8] flex flex-col overflow-hidden"
      style={{
        width: DIALOG_WIDTH,
        height: DIALOG_HEIGHT,
        maxWidth: "100vw",
        maxHeight: "100vh",
      }}
    >
      <div className="p-4 border-b border-black/5 flex items-center justify-between shrink-0">
        <h1 className="font-serif text-xl text-[#0D0D17]">Settings</h1>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-[#0D0D17]/60" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-auto">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[#0D0D17]/60">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Avatar
            </span>
          </div>

          <div className="flex justify-center">
            {selectedStyle === "web3" ? (
              <Web3Avatar
                address={address}
                size={80}
                className="ring-4 ring-[#FFE047]/30"
              />
            ) : (
              <img
                src={`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${address}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full ring-4 ring-[#FFE047]/30"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`p-2 rounded-xl border-2 transition-all ${
                  selectedStyle === style
                    ? "border-[#FFE047] bg-[#FFE047]/10"
                    : "border-transparent bg-black/5 hover:bg-black/10"
                }`}
              >
                {style === "web3" ? (
                  <Web3Avatar address={address} size={40} className="mx-auto" />
                ) : (
                  <img
                    src={`https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${address}`}
                    alt={style}
                    className="w-10 h-10 mx-auto rounded-full"
                  />
                )}
                <p className="text-xs text-center mt-1 text-[#0D0D17]/60 capitalize">
                  {style}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[#0D0D17]/60">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Nickname
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameError(null);
                  setSaveSuccess(false);
                }}
                placeholder="Enter nickname"
                className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 text-[#0D0D17] pr-10 ${
                  nicknameError
                    ? "border-red-300 focus:ring-red-200"
                    : nicknameAvailable === true &&
                        nickname !== originalNickname
                      ? "border-green-300 focus:ring-green-200"
                      : "border-black/10 focus:ring-[#FFE047]"
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {checkingNickname && (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FFE047]" />
                )}
                {!checkingNickname &&
                  nicknameAvailable === true &&
                  nickname !== originalNickname && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                {!checkingNickname &&
                  (nicknameError || nicknameAvailable === false) && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
              </div>
            </div>

            {nickname.trim() && (
              <p className="text-sm text-[#0D0D17]/60 font-mono bg-[#FFE047]/10 px-3 py-2 rounded-lg">
                @{nickname.trim().toLowerCase()}.villa.cash
              </p>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                Settings saved successfully!
              </div>
            )}

            {nicknameError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {nicknameError}
              </div>
            )}

            {!nicknameError && checkingNickname && (
              <p className="text-sm text-[#0D0D17]/60">
                Checking availability...
              </p>
            )}

            <p className="text-xs text-[#0D0D17]/40">
              3-30 characters, letters, numbers, underscores. Must start with a
              letter.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[#0D0D17]/60">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Claim on Base
            </span>
          </div>

          {!walletConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-[#0D0D17]/60">
                Connect your wallet to claim @{nickname.trim().toLowerCase()}
                .villa.cash on Base network
              </p>
              <button
                onClick={connectWallet}
                disabled={!nickname.trim() || ensClaimStatus === "connecting"}
                className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {ensClaimStatus === "connecting" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700">
                  <strong>Wallet Connected:</strong>{" "}
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>
              </div>

              {ensAlreadyClaimed ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-700">
                    This address has already claimed a nickname on Base.
                  </p>
                </div>
              ) : ensClaimStatus === "idle" ? (
                <button
                  onClick={handleEnsClaimRequest}
                  disabled={!nickname.trim() || nicknameError !== null}
                  className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Claim @{nickname.trim().toLowerCase()}.villa.cash
                </button>
              ) : ensClaimStatus === "estimating" ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <p className="text-sm text-blue-700">
                      Estimating gas cost...
                    </p>
                  </div>
                </div>
              ) : ensClaimStatus === "confirming" && gasEstimate ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Gas Estimate
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>Gas Limit: {gasEstimate.gasLimit.toLocaleString()}</p>
                      <p>Cost: {gasEstimate.gasCostEth} ETH</p>
                      {gasEstimate.gasCostUsd && (
                        <p>≈ ${gasEstimate.gasCostUsd} USD</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetEnsClaim}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmEnsClaim}
                      className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Shield className="w-5 h-5" />
                      Confirm Claim
                    </button>
                  </div>
                </div>
              ) : ensClaimStatus === "pending" ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <p className="text-sm text-blue-700">
                      Transaction pending... Please sign with your passkey
                    </p>
                  </div>
                </div>
              ) : ensClaimStatus === "success" ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium text-green-700">
                        Successfully claimed @{nickname.trim().toLowerCase()}
                        .villa.cash!
                      </p>
                    </div>
                    {txHash && (
                      <p className="text-xs text-green-600 mt-2">
                        Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={resetEnsClaim}
                    className="w-full py-2 text-sm text-blue-500 font-medium rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : null}

              {ensClaimError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-700">{ensClaimError}</p>
                  </div>
                  <button
                    onClick={resetEnsClaim}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="p-4 border-t border-black/5 space-y-2 shrink-0">
        <button
          onClick={handleSave}
          disabled={
            saving ||
            !nickname.trim() ||
            checkingNickname ||
            (nickname !== originalNickname && nicknameAvailable !== true) ||
            !!nicknameError
          }
          className="w-full py-3 bg-[#FFE047] text-[#0D0D17] font-medium rounded-xl hover:bg-[#FDD835] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {nickname === originalNickname &&
          selectedStyle === (profile?.avatar?.style || "web3")
            ? "No Changes"
            : "Save Changes"}
        </button>

        <button
          onClick={handleLogout}
          className="w-full py-2 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFE047]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
