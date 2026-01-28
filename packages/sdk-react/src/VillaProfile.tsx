"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface VillaProfileUser {
  address: `0x${string}`;
  nickname: string;
  avatar: string;
}

export interface VillaProfileProps {
  user: VillaProfileUser;
  onSettings?: () => void;
  onSignOut: () => void;
  onCopyWallet?: (address: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function VillaProfile({
  user,
  onSettings,
  onSignOut,
  onCopyWallet,
  className,
  style,
}: VillaProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(user.address);
      setCopied(true);
      onCopyWallet?.(user.address);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [user.address, onCopyWallet]);

  const handleSettings = useCallback(() => {
    setIsOpen(false);
    onSettings?.();
  }, [onSettings]);

  const handleSignOut = useCallback(() => {
    setIsOpen(false);
    onSignOut();
  }, [onSignOut]);

  const pillButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "36px",
    paddingLeft: 0,
    paddingRight: "12px",
    backgroundColor: "#FFFDF8",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "9999px",
    cursor: "pointer",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    fontWeight: 500,
    color: "#0D0D17",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  };

  const avatarContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    aspectRatio: "1",
    padding: "4px",
    marginRight: "2px",
  };

  const avatarStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "9999px",
    objectFit: "cover",
    backgroundColor: "#f0f0f0",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: "220px",
    backgroundColor: "#FFFDF8",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    padding: "8px",
    zIndex: 1000,
  };

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
    color: "#0D0D17",
    textAlign: "left",
    transition: "background-color 0.15s ease",
  };

  const walletSectionStyle: React.CSSProperties = {
    padding: "12px",
    marginBottom: "4px",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: "8px",
  };

  return (
    <div
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block" }}
      className={className}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...pillButtonStyle, ...style }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FFF9E6";
          e.currentTarget.style.borderColor = "rgba(255,224,71,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#FFFDF8";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
        }}
      >
        <div style={avatarContainerStyle}>
          <img src={user.avatar} alt="" style={avatarStyle} />
        </div>
        @{user.nickname}
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <div style={walletSectionStyle}>
            <div
              style={{
                fontSize: "11px",
                color: "#0D0D17",
                opacity: 0.5,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Address
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
                color: "#0D0D17",
              }}
            >
              <span>{truncateAddress(user.address)}</span>
              {copied ? (
                <span style={{ color: "#22c55e" }}>
                  <CheckIcon />
                </span>
              ) : (
                <span style={{ opacity: 0.4 }}>
                  <CopyIcon />
                </span>
              )}
            </button>
          </div>

          {onSettings && (
            <button
              onClick={handleSettings}
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <SettingsIcon />
              <span>Settings</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            style={{ ...menuItemStyle, color: "#dc2626" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
