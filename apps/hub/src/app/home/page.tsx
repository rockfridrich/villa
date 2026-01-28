"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Copy,
  Check,
  Pencil,
  X,
  Settings,
  ExternalLink,
  Compass,
  Globe,
  User,
  Calendar,
  Activity,
} from "lucide-react";
import { Button, Avatar, Input, Spinner } from "@/components/ui";
import {
  ProfileSettings,
  type ProfileData,
  type ProfileUpdate,
} from "@/components/sdk";
import { useIdentityStore } from "@/lib/store";
import { disconnectPorto } from "@/lib/porto";
import { displayNameSchema } from "@/lib/validation";
import {
  authenticateTinyCloud,
  syncToTinyCloud,
  isTinyCloudAuthenticatedFor,
  getRecentApps,
  trackAppUsage,
  type RecentApp,
} from "@/lib/storage/tinycloud-client";
import type { CustomAvatar } from "@/lib/storage/tinycloud";
import { Logo } from "@villa/ui";
import "@villa/ui/glass.css";

import type { AvatarConfig } from "@/types";

// Featured ecosystem apps
const ECOSYSTEM_APPS = [
  {
    appId: "residents",
    name: "Residents",
    url: "https://residents.proofofretreat.me/",
    description: "Community directory",
  },
  {
    appId: "map",
    name: "Map",
    url: "https://map.proofofretreat.me/",
    description: "Village explorer",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { identity, clearIdentity, updateProfile } = useIdentityStore();
  const [copied, setCopied] = useState(false);
  const [ensNameCopied, setEnsNameCopied] = useState(false);

  // Nickname editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recent apps state
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Ref for tracking timeout to prevent memory leaks
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ensCopyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (ensCopyTimeoutRef.current) {
        clearTimeout(ensCopyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!identity) {
      router.replace("/onboarding");
    }
  }, [identity, router]);

  // Authenticate TinyCloud on mount for returning users on new devices
  useEffect(() => {
    if (!identity?.address) return;

    // Load recent apps immediately from localStorage
    getRecentApps().then(setRecentApps).catch(console.warn);

    // Check if TinyCloud is already authenticated for this address
    if (isTinyCloudAuthenticatedFor(identity.address)) return;

    // Trigger background authentication
    authenticateTinyCloud(identity.address)
      .then((success) => {
        if (success) {
          syncToTinyCloud().catch(console.warn);
          // Reload recent apps after sync (may have newer data from TinyCloud)
          getRecentApps().then(setRecentApps).catch(console.warn);
        }
      })
      .catch(console.warn);
  }, [identity?.address]);

  if (!identity) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </main>
    );
  }

  const handleLogout = async () => {
    await disconnectPorto();
    clearIdentity();
    router.replace("/onboarding");
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(identity.address);
      setCopied(true);
      // Clear any existing timeout before setting a new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API can fail if permissions are denied or page doesn't have focus
      console.error("Failed to copy address:", err);
    }
  };

  const handleCopyEnsName = async () => {
    const ensName = `${identity.displayName}.villa.cash`;
    try {
      await navigator.clipboard.writeText(ensName);
      setEnsNameCopied(true);
      if (ensCopyTimeoutRef.current) {
        clearTimeout(ensCopyTimeoutRef.current);
      }
      ensCopyTimeoutRef.current = setTimeout(
        () => setEnsNameCopied(false),
        2000,
      );
    } catch (err) {
      console.error("Failed to copy ENS name:", err);
    }
  };

  const handleStartEdit = () => {
    setEditValue(identity.displayName);
    setEditError(null);
    setIsEditing(true);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    // Remove @ prefix if user typed it
    const cleanValue = editValue.startsWith("@")
      ? editValue.slice(1)
      : editValue;

    // Validate
    const result = displayNameSchema.safeParse(cleanValue);
    if (!result.success) {
      setEditError(result.error.errors[0]?.message || "Invalid nickname");
      return;
    }

    // Check if actually changed
    if (result.data === identity.displayName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setEditError(null);

    // Update via store
    const success = updateProfile(result.data);

    if (success) {
      setIsEditing(false);
      setEditValue("");
    } else {
      setEditError("Failed to update nickname");
    }
    setIsSaving(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleOpenSettings = async () => {
    if (!identity?.address) return;

    setShowSettings(true);
    setLoadingProfile(true);

    try {
      const res = await fetch(`/api/profile/${identity.address}`);
      const data = await res.json();

      let avatarConfig: AvatarConfig | CustomAvatar;
      if (!identity.avatar || typeof identity.avatar === "string") {
        avatarConfig = {
          style: "avataaars" as const,
          selection: "other" as const,
          variant: 0,
        };
      } else {
        avatarConfig = identity.avatar;
      }

      setProfileData({
        address: identity.address,
        nickname: data.nickname,
        displayName: identity.displayName || data.nickname || "",
        avatar: avatarConfig,
        canChangeNickname: data.canChangeNickname ?? true,
        nicknameChangeCount: data.nicknameChangeCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileUpdate = async (updates: ProfileUpdate) => {
    if (!identity) return;

    try {
      if (updates.nickname) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: identity.address,
            newNickname: updates.nickname,
          }),
        });
      }

      if (updates.displayName !== undefined || updates.avatar !== undefined) {
        let avatarForStore:
          | string
          | {
              style: "avataaars" | "bottts";
              selection: "male" | "female" | "other";
              variant: number;
            }
          | undefined;

        if (updates.avatar) {
          const isCustom =
            "type" in updates.avatar && updates.avatar.type === "custom";
          if (isCustom) {
            avatarForStore = (updates.avatar as CustomAvatar).dataUrl;
          } else {
            const config = updates.avatar as AvatarConfig;
            // Handle legacy config
            if ("selection" in config && "variant" in config) {
              avatarForStore = {
                style: config.style as "avataaars" | "bottts",
                selection: config.selection,
                variant: config.variant,
              };
            } else {
              // Handle new config - convert to legacy format for storage compatibility
              avatarForStore = {
                style: "avataaars",
                selection: "other",
                variant: 0,
              };
            }
          }
        }

        updateProfile(
          updates.displayName ?? identity.displayName,
          avatarForStore,
        );
      }

      const res = await fetch(`/api/profile/${identity.address}`);
      const data = await res.json();

      const avatarSource = updates.avatar ?? identity.avatar;
      let avatarConfig: AvatarConfig | CustomAvatar;
      if (!avatarSource || typeof avatarSource === "string") {
        avatarConfig = {
          style: "avataaars" as const,
          selection: "other" as const,
          variant: 0,
        };
      } else {
        avatarConfig = avatarSource;
      }

      setProfileData({
        address: identity.address,
        nickname: data.nickname,
        displayName: updates.displayName ?? identity.displayName,
        avatar: avatarConfig,
        canChangeNickname: data.canChangeNickname ?? true,
        nicknameChangeCount: data.nicknameChangeCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  const handleVisitApp = async (app: (typeof ECOSYSTEM_APPS)[0]) => {
    // Track usage before navigating
    await trackAppUsage({
      appId: app.appId,
      name: app.name,
      url: app.url,
    });
    // Refresh recent apps list
    const updated = await getRecentApps();
    setRecentApps(updated);
    // Open in new tab
    window.open(app.url, "_blank", "noopener,noreferrer");
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-accent-yellow/10">
      <div className="glass-overlay-villa absolute inset-0" />

      <div className="relative z-10 min-h-screen">
        <header className="glass-card mx-4 mt-4 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="text-xl font-serif text-ink">Villa</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="default"
              onClick={handleOpenSettings}
              aria-label="Settings"
              className="glass-overlay-villa"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={handleLogout}
              aria-label="Sign out"
              className="glass-overlay-villa"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="max-w-md mx-auto p-6 space-y-6">
          <div className="glass-card glass-card-lg p-8 text-center space-y-6">
            <Avatar
              name={identity.displayName}
              src={identity.avatar}
              walletAddress={identity.address}
              size="lg"
            />

            <div className="space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink text-base">
                      @
                    </span>
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) =>
                        setEditValue(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, ""),
                        )
                      }
                      onKeyDown={handleEditKeyDown}
                      className="pl-8 pr-10 text-center glass-overlay-villa"
                      maxLength={30}
                      disabled={isSaving}
                    />
                    <button
                      onClick={handleCancelEdit}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {editError && (
                    <p className="text-xs text-red-500">{editError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editValue}
                    className="w-full glass-overlay-villa"
                  >
                    {isSaving ? <Spinner className="w-4 h-4" /> : "Save"}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="group inline-flex items-center gap-2 text-2xl font-serif text-ink hover:text-accent-brown transition-colors"
                >
                  <span>@{identity.displayName}</span>
                  <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleCopyEnsName}
                  className="glass-dropdown-item w-full flex items-center justify-center gap-2 text-sm text-accent-green hover:text-accent-brown transition-colors"
                  title="Your ENS-compatible name - click to copy"
                >
                  <Globe className="w-4 h-4" />
                  <span>{identity.displayName}.villa.cash</span>
                  {ensNameCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4 opacity-60" />
                  )}
                </button>

                <button
                  onClick={handleCopyAddress}
                  className="glass-dropdown-item w-full flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  <span className="font-mono">
                    {truncateAddress(identity.address)}
                  </span>
                  {copied ? (
                    <Check className="w-4 h-4 text-accent-green" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card glass-card-md p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-ink-muted" />
              <span className="font-medium text-ink">Account Details</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-dropdown-item text-center p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-ink-muted" />
                  <span className="text-xs text-ink-muted">Joined</span>
                </div>
                <span className="text-sm font-medium text-ink">
                  {formatDate(identity.createdAt)}
                </span>
              </div>

              <div className="glass-dropdown-item text-center p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="w-4 h-4 text-ink-muted" />
                  <span className="text-xs text-ink-muted">Status</span>
                </div>
                <span className="text-sm font-medium text-accent-green">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card glass-card-md p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-ink-muted" />
              <span className="font-medium text-ink text-lg">Ecosystem</span>
            </div>

            {recentApps.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs text-ink-muted uppercase tracking-wide font-medium">
                  Recent
                </span>
                <div className="grid gap-2">
                  {recentApps.slice(0, 3).map((app) => (
                    <button
                      key={app.appId}
                      onClick={() =>
                        handleVisitApp({
                          appId: app.appId,
                          name: app.name,
                          url: app.url,
                          description: "",
                        })
                      }
                      className="glass-dropdown-item w-full flex items-center justify-between p-3 text-left group"
                    >
                      <span className="text-sm font-medium text-ink">
                        {app.name}
                      </span>
                      <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-accent-brown transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs text-ink-muted uppercase tracking-wide font-medium">
                {recentApps.length > 0 ? "All Apps" : "Apps"}
              </span>
              <div className="grid gap-2">
                {ECOSYSTEM_APPS.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => handleVisitApp(app)}
                    className="glass-dropdown-item w-full flex items-center justify-between p-3 text-left group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">
                        {app.name}
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        {app.description}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-accent-brown transition-colors ml-3 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <Button
              variant="secondary"
              size="lg"
              className="w-full glass-overlay-villa border-2"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Switch Account
            </Button>
            <p className="text-xs text-ink-muted text-center">
              Your passkey stays active for quick sign-in
            </p>
          </div>
        </div>
      </div>

      {showSettings &&
        (loadingProfile ? (
          <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-cream rounded-lg p-6">
              <Spinner size="lg" />
            </div>
          </div>
        ) : profileData ? (
          <ProfileSettings
            profile={profileData}
            onUpdate={handleProfileUpdate}
            onClose={() => setShowSettings(false)}
            asModal={true}
          />
        ) : null)}
    </main>
  );
}
