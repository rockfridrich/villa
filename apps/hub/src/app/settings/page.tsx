"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react";
import { Spinner } from "@/components/ui";
import { ProfileSettings } from "@/components/sdk";
import type { ProfileData, ProfileUpdate } from "@/components/sdk";
import type { AvatarConfig } from "@/types";
import type { CustomAvatar } from "@/lib/storage/tinycloud";
import { isLegacyAvatarConfig } from "@/lib/avatar/utils";
import { useIdentityStore } from "@/lib/store";

import "@villa/ui/glass.css";

export default function SettingsPage() {
  const router = useRouter();
  const { identity, updateProfile } = useIdentityStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!identity?.address) return;

    const fetchProfile = async () => {
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

        setProfile({
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

    fetchProfile();
  }, [identity]);

  useEffect(() => {
    if (!identity) {
      router.replace("/onboarding");
    }
  }, [identity, router]);

  if (!identity) {
    return null;
  }

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
          | {
              style: "lorelei" | "adventurer" | "avataaars" | "web3";
              seed: string;
            }
          | undefined;

        if (updates.avatar) {
          const isCustom =
            "type" in updates.avatar && updates.avatar.type === "custom";
          if (isCustom) {
            avatarForStore = (updates.avatar as CustomAvatar).dataUrl;
          } else {
            const config = updates.avatar as AvatarConfig;
            if (isLegacyAvatarConfig(config)) {
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
        }

        updateProfile(
          updates.displayName ?? identity.displayName,
          avatarForStore,
        );

        // Send postMessage to parent window for avatar updates
        if (updates.avatar && typeof window !== "undefined") {
          try {
            window.parent.postMessage(
              {
                type: "VILLA_AVATAR_UPDATE",
                avatar: updates.avatar,
              },
              "*",
            );
          } catch {}
        }
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

      setProfile({
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-accent-yellow/10">
      <div className="glass-overlay-villa absolute inset-0" />

      <div className="relative z-10 min-h-screen">
        <header className="glass-card mx-4 mt-4 p-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/home")}
            className="glass-overlay-villa p-2 rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center hover:scale-105"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-ink-muted" />
            <h1 className="text-xl font-serif text-ink">Settings</h1>
          </div>
        </header>

        <div className="max-w-md mx-auto p-6">
          {loadingProfile ? (
            <div className="glass-card glass-card-md p-6 flex items-center gap-3">
              <Spinner size="sm" />
              <p className="text-ink-muted">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="glass-card glass-card-lg p-0 overflow-hidden">
              <ProfileSettings
                profile={profile}
                onUpdate={handleProfileUpdate}
                asModal={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
