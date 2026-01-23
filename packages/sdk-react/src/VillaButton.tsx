"use client";

import React from "react";
import { villa } from "@rockfridrich/villa-sdk";
import { useVilla } from "./useVilla";
import { VillaProfile } from "./VillaProfile";

export interface VillaButtonProps {
  onSignIn?: (user: { address: string; nickname: string }) => void;
  onSignOut?: () => void;
  onSettings?: () => void;
  showProfileDropdown?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function VillaButton({
  onSignIn,
  onSignOut,
  onSettings,
  showProfileDropdown = true,
  className,
  style,
}: VillaButtonProps) {
  const { user, signIn, signOut, isLoading } = useVilla();

  const handleSignIn = async () => {
    const result = await signIn();
    if (result) {
      onSignIn?.({ address: result.address, nickname: result.nickname });
    }
  };

  const handleSignOut = () => {
    signOut();
    onSignOut?.();
  };

  const handleSettings = async () => {
    if (onSettings) {
      onSettings();
    } else {
      await villa.settings();
    }
  };

  const signInButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "12px",
    border: "none",
    cursor: isLoading ? "wait" : "pointer",
    transition: "all 0.15s ease",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#FFE047",
    color: "#5C4813",
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={className}
        style={className ? style : { ...signInButtonStyle, cursor: "wait", ...style }}
      >
        Connecting...
      </button>
    );
  }

  if (user && showProfileDropdown) {
    return (
      <VillaProfile
        user={user}
        onSettings={handleSettings}
        onSignOut={handleSignOut}
        className={className}
        style={style}
      />
    );
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className={className}
        style={className ? style : {
          ...signInButtonStyle,
          backgroundColor: "#f5f5f5",
          color: "#333",
          ...style,
        }}
      >
        <img
          src={user.avatar}
          alt=""
          style={{ width: 24, height: 24, borderRadius: "50%" }}
        />
        @{user.nickname}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className={className}
      style={className ? style : { ...signInButtonStyle, ...style }}
    >
      Sign in with Villa
    </button>
  );
}
