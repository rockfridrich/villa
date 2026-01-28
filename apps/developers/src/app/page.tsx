"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Fingerprint,
  Shield,
  Heart,
  User,
  Zap,
} from "lucide-react";
import { CodeBlock } from "../components/code";
import { villa, type VillaUser } from "@rockfridrich/villa-sdk";

export default function DevelopersPage() {
  const [user, setUser] = useState<VillaUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return villa.onAuthChange((u) => setUser(u));
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await villa.signIn();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#0D0D17]">
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="font-serif text-5xl sm:text-7xl tracking-tight leading-[0.95]">
              Sign in with
              <span className="block text-[#FFE047]">superpowers</span>
            </h1>
            <p className="text-xl text-[#0D0D17]/60 max-w-lg leading-relaxed">
              Passkey authentication in 3 lines.
              <br />
              No passwords, no config.
            </p>
            <Link
              href="#quickstart"
              className="inline-flex items-center gap-2 bg-[#FFE047] text-[#0D0D17] font-medium px-8 py-4 rounded-xl hover:bg-[#FFE047]/90 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              Start Building <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#0D0D17]/10 bg-white p-8">
            <div className="text-center space-y-6">
              <div className="text-sm font-medium text-[#0D0D17]/40 uppercase tracking-wider">
                Live Demo
              </div>

              {user ? (
                <div className="space-y-4">
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-20 h-20 rounded-full mx-auto border-4 border-[#FFE047]/20"
                  />
                  <div>
                    <p className="text-2xl font-serif">@{user.nickname}</p>
                    <p className="text-sm text-[#0D0D17]/40 font-mono truncate max-w-[200px] mx-auto">
                      {user.address}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => villa.settings()}
                      className="px-4 py-2 text-sm border border-[#0D0D17]/10 rounded-lg hover:bg-[#0D0D17]/5 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => villa.signOut()}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 rounded-full bg-[#0D0D17]/5 mx-auto flex items-center justify-center">
                    <Fingerprint className="w-10 h-10 text-[#0D0D17]/20" />
                  </div>
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-[#0D0D17] text-white font-medium px-8 py-4 rounded-xl hover:bg-[#0D0D17]/90 transition-all disabled:opacity-50"
                  >
                    <Fingerprint className="w-5 h-5" />
                    {isLoading ? "Signing in..." : "Try Sign In"}
                  </button>
                  <p className="text-sm text-[#0D0D17]/40">
                    Uses real passkeys on Base
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="quickstart"
        className="py-20 px-6 bg-white border-y border-[#0D0D17]/5"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-4xl">3 Lines of Code</h2>
            <p className="text-[#0D0D17]/60">That&apos;s all you need.</p>
          </div>

          <CodeBlock
            code="npm install @rockfridrich/villa-sdk-react"
            language="bash"
          />

          <CodeBlock
            code={`import { VillaButton } from '@rockfridrich/villa-sdk-react'

function Header() {
  return <VillaButton />
}`}
            language="tsx"
          />
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl border border-[#0D0D17]/5 bg-white space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#0D0D17]" />
              </div>
              <h3 className="font-medium text-xl">Passkeys, not passwords</h3>
              <p className="text-[#0D0D17]/60">
                Face ID, Touch ID, or security key. No credentials stored.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#0D0D17]/5 bg-white space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#0D0D17]" />
              </div>
              <h3 className="font-medium text-xl">Works with Lovable</h3>
              <p className="text-[#0D0D17]/60">
                Just paste the prompt. AI builds the rest.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#0D0D17]/5 bg-white space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center">
                <User className="w-6 h-6 text-[#0D0D17]" />
              </div>
              <h3 className="font-medium text-xl">Profile UI included</h3>
              <p className="text-[#0D0D17]/60">
                Avatar, nickname, address. All built-in.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#0D0D17]/5 bg-white space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#0D0D17]" />
              </div>
              <h3 className="font-medium text-xl">Built on Base</h3>
              <p className="text-[#0D0D17]/60">
                Real blockchain identity with gasless transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 bg-[#0D0D17] text-white text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-serif text-4xl">Ready to ship?</h2>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 bg-[#FFE047] text-[#0D0D17] font-medium px-8 py-4 rounded-xl hover:bg-[#FFE047]/90 transition-all"
          >
            Open Playground <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="text-white/40 text-sm pt-8">© 2025 Villa</p>
        </div>
      </footer>
    </div>
  );
}
