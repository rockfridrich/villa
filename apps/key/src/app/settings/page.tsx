"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useMemo, useState, Suspense } from "react";
import { Loader2, LogOut, Check, X, User, Palette } from "lucide-react";
import { Web3Avatar } from "@/lib/web3-avatar";

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || "https://construction.villa.cash";

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
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string): boolean {
  if (VILLA_ORIGINS.includes(origin as (typeof VILLA_ORIGINS)[number])) return true;
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
  return params.get("mode") === "popup" || (window.opener != null && window.opener !== window);
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const hasNotifiedReady = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("web3");
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const queryOrigin = searchParams.get("origin");
  const address = searchParams.get("address");
  const targetOrigin = useMemo(() => getValidatedParentOrigin(queryOrigin), [queryOrigin]);
  const inPopup = useMemo(() => isInPopup(), []);

  const postToParent = useCallback(
    (message: Record<string, unknown>) => {
      if (!inPopup) return;
      if (!targetOrigin) return;
      const target = window.opener;
      if (target) {
        target.postMessage(message, targetOrigin);
      }
    },
    [targetOrigin, inPopup],
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
        const res = await fetch(`${HUB_API_URL}/api/profile/${address.toLowerCase()}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setNickname(data.nickname || "");
          setSelectedStyle(data.avatar?.style || "web3");
        }
      } catch {}
      setLoading(false);
    }
    loadProfile();
  }, [address]);

  const handleSave = async () => {
    if (!address || !nickname.trim()) return;

    setSaving(true);
    setNicknameError(null);

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
        postToParent({ type: "VILLA_AUTH_SUCCESS", payload: { identity } });
        if (inPopup) {
          setTimeout(() => window.close(), 300);
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
    postToParent({ type: "VILLA_AUTH_ERROR", payload: { error: "User logged out", code: "LOGOUT" } });
    if (inPopup) {
      setTimeout(() => window.close(), 300);
    }
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
      style={{ width: DIALOG_WIDTH, height: DIALOG_HEIGHT, maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <div className="p-4 border-b border-black/5 flex items-center justify-between shrink-0">
        <h1 className="font-serif text-xl text-[#0D0D17]">Settings</h1>
        <button onClick={handleCancel} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
          <X className="w-5 h-5 text-[#0D0D17]/60" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-auto">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[#0D0D17]/60">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Avatar</span>
          </div>

          <div className="flex justify-center">
            {selectedStyle === "web3" ? (
              <Web3Avatar address={address} size={80} className="ring-4 ring-[#FFE047]/30" />
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
                <p className="text-xs text-center mt-1 text-[#0D0D17]/60 capitalize">{style}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[#0D0D17]/60">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Nickname</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setNicknameError(null);
              }}
              placeholder="Enter nickname"
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFE047] text-[#0D0D17]"
            />
            {nickname.trim() && (
              <p className="text-sm text-[#0D0D17]/60 font-mono bg-[#FFE047]/10 px-3 py-2 rounded-lg">
                @{nickname.trim().toLowerCase()}.villa.cash
              </p>
            )}
            {nicknameError && <p className="text-sm text-red-500">{nicknameError}</p>}
            <p className="text-xs text-[#0D0D17]/40">3-30 characters, letters, numbers, underscores</p>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-black/5 space-y-2 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving || !nickname.trim()}
          className="w-full py-3 bg-[#FFE047] text-[#0D0D17] font-medium rounded-xl hover:bg-[#FDD835] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Save Changes
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
