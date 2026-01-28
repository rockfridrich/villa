"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Settings } from "lucide-react";
import { useIdentityStore } from "@/lib/store";
import { Avatar } from "./ui";

const NAVIGATION_ITEMS = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const;

export function VillaLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const identity = useIdentityStore((state) => state.identity);

  const isAuthPage =
    pathname === "/auth" ||
    pathname === "/onboarding" ||
    pathname === "/" ||
    pathname === "/test" ||
    pathname === "/dev";

  if (isAuthPage || !identity) {
    return <>{children}</>;
  }

  const isCurrentPage = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:z-50">
        <div className="glass-overlay-villa flex flex-col flex-1 min-h-0 border-r border-glass-border-villa">
          <div className="flex items-center h-16 px-4 bg-gradient-to-r from-accent-yellow/10 to-accent-yellow/5">
            <Link href="/home" className="flex items-center">
              <h1 className="text-2xl font-serif text-ink font-medium">
                Villa
              </h1>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPage(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    current
                      ? "bg-accent-yellow text-accent-brown glass-card shadow-villa"
                      : "text-ink-muted hover:text-ink hover:bg-glass-villa-light"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${current ? "text-accent-brown" : "text-ink-muted group-hover:text-ink"}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-glass-border-villa">
            <Link href="/home" className="group block w-full">
              <div className="flex items-center px-3 py-2 rounded-lg hover:bg-glass-villa-light transition-colors">
                <Avatar
                  name={identity.displayName}
                  src={identity.avatar}
                  walletAddress={identity.address}
                  size="sm"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-ink">
                    @{identity.displayName}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {identity.displayName}.villa.cash
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full md:pl-64">
        <main className="flex-1 relative overflow-auto">
          <div className="pb-16 md:pb-0">{children}</div>
        </main>

        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="glass-overlay-villa border-t border-glass-border-villa">
            <div className="grid grid-cols-3 gap-1 px-1 py-2">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const current = isCurrentPage(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 min-h-12 ${
                      current
                        ? "bg-accent-yellow text-accent-brown"
                        : "text-ink-muted active:bg-glass-villa-light"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${current ? "text-accent-brown" : "text-ink-muted"}`}
                    />
                    <span
                      className={`text-xs mt-1 ${current ? "text-accent-brown font-medium" : "text-ink-muted"}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              <Link
                href="/home"
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 min-h-12 ${
                  isCurrentPage("/home")
                    ? "bg-accent-yellow text-accent-brown"
                    : "text-ink-muted active:bg-glass-villa-light"
                }`}
              >
                <Avatar
                  name={identity.displayName}
                  src={identity.avatar}
                  walletAddress={identity.address}
                  size="sm"
                  className="h-5 w-5"
                />
                <span
                  className={`text-xs mt-1 ${isCurrentPage("/home") ? "text-accent-brown font-medium" : "text-ink-muted"}`}
                >
                  Profile
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
