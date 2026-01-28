"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Shield, Zap, Globe, Heart } from "lucide-react";
import { useIdentityStore } from "@/lib/store";
import { Button } from "@/components/ui";
import { Logo } from "@villa/ui";
import "@villa/ui/glass.css";

export default function Home() {
  const router = useRouter();
  const identity = useIdentityStore((state) => state.identity);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && identity) {
      router.replace("/home");
    }
  }, [identity, router, mounted]);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-cream-100 to-accent-yellow/10">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </main>
    );
  }

  if (identity) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-cream-100 to-accent-yellow/10">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </main>
    );
  }

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-accent-yellow/10">
      <div className="glass-overlay-villa absolute inset-0" />

      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card glass-card-sm mx-auto w-fit p-6">
              <Logo size="lg" className="mx-auto" />
            </div>

            <div className="space-y-4">
              <h1 className="text-fluid-6xl font-serif tracking-tight text-ink">
                Welcome to Villa
              </h1>
              <p className="text-fluid-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
                Your identity. No passwords. Just you. The warm, everyday
                interface for Villa citizens.
              </p>
            </div>
          </div>

          <div className="animate-slide-up space-y-4">
            <Button
              size="lg"
              className="glass-card px-8 py-4 text-lg font-medium group"
              onClick={handleGetStarted}
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-ink-muted">
              Sign in with your fingerprint, face, or security key
            </p>
          </div>

          {/* Features Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {[
              {
                icon: Shield,
                title: "Secure by Default",
                description: "Hardware-backed passkeys keep your identity safe",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Sign in instantly with biometrics or security keys",
              },
              {
                icon: Globe,
                title: "Works Everywhere",
                description: "One identity across all your favorite apps",
              },
              {
                icon: Heart,
                title: "Human-Centered",
                description:
                  "Designed for everyday people, not just developers",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card glass-card-sm p-6 text-center space-y-4 hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="w-12 h-12 mx-auto bg-accent-yellow rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-accent-brown" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-serif text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-12 border-t border-neutral-100 bg-cream-50/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-ink-muted mb-6">
            Compatible with your existing security tools
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-xs text-ink-muted">
            <span>1Password</span>
            <span>•</span>
            <span>iCloud Keychain</span>
            <span>•</span>
            <span>Google Password Manager</span>
            <span>•</span>
            <span>YubiKey</span>
            <span>•</span>
            <span>Windows Hello</span>
          </div>
        </div>
      </section>
    </main>
  );
}
