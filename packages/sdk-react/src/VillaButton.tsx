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

function VillaLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 7v10l10 5 10-5V7L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 22V12" stroke="currentColor" strokeWidth="2" />
      <path d="M2 7l10 5 10-5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
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

  const pillButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "36px",
    padding: "0 16px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "9999px",
    border: "1px solid rgba(255, 224, 71, 0.3)",
    cursor: isLoading ? "wait" : "pointer",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#FFE047",
    color: "#5C4813",
    backdropFilter: "blur(8px) saturate(120%)",
    WebkitBackdropFilter: "blur(8px) saturate(120%)",
    boxShadow: "0 4px 12px rgba(255, 224, 71, 0.25), 0 1px 3px rgba(0,0,0,0.1)",
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={className}
        style={
          className
            ? style
            : { ...pillButtonStyle, opacity: 0.7, cursor: "wait", ...style }
        }
      >
        <span
          style={{
            width: 16,
            height: 16,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        Connecting...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        style={
          className
            ? style
            : {
                ...pillButtonStyle,
                paddingLeft: 0,
                paddingRight: "12px",
                backgroundColor: "rgba(255, 253, 248, 0.9)",
                border: "1px solid rgba(255, 224, 71, 0.2)",
                color: "#0D0D17",
                backdropFilter: "blur(12px) saturate(140%)",
                WebkitBackdropFilter: "blur(12px) saturate(140%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                ...style,
              }
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            aspectRatio: "1",
            padding: "4px",
            marginRight: "2px",
          }}
        >
          <img
            src={user.avatar}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "9999px",
              objectFit: "cover",
            }}
          />
        </div>
        @{user.nickname}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className={className}
      style={className ? style : { ...pillButtonStyle, ...style }}
      onMouseEnter={(e) => {
        if (!className) e.currentTarget.style.backgroundColor = "#FFD93D";
      }}
      onMouseLeave={(e) => {
        if (!className) e.currentTarget.style.backgroundColor = "#FFE047";
      }}
    >
      <VillaLogo />
      Sign in with Villa
    </button>
  );
}
