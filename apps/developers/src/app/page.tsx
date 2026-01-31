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
  ArrowRight,
  Sparkles,
  Code2,
  Play,
  CheckCircle,
  Star,
  GitBranch,
  Copy,
  Check,
  Globe,
  Lock,
  Smartphone,
  Laptop,
} from "lucide-react";
import { CodeBlock } from "../components/code";
import { villa, type Identity, type VillaUser } from "@rockfridrich/villa-sdk";
import { PageFooter } from "../components/PageFooter";

function QuickCopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 bg-ink text-cream-50 font-mono text-sm px-4 py-2.5 rounded-lg hover:bg-ink/90 transition-all group"
    >
      <span>{label}</span>
      {copied ? (
        <Check className="w-4 h-4 text-success-text" />
      ) : (
        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}

function PlatformBadge({ icon: Icon, name }: { icon: any; name: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-ink/5 bg-white hover:border-accent-yellow/20 hover:bg-accent-yellow/5 transition-all cursor-pointer group">
      <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center group-hover:bg-accent-yellow/20 transition-colors">
        <Icon className="w-5 h-5 text-ink group-hover:text-ink transition-colors" />
      </div>
      <span className="font-medium text-sm">{name}</span>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight = false,
}: {
  icon: any;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-2xl border space-y-6 transition-all hover:scale-[1.02] hover:shadow-villa-lg group ${
        highlight
          ? "border-accent-yellow/20 bg-gradient-to-br from-accent-yellow/5 to-transparent"
          : "border-ink/5 bg-white hover:border-accent-yellow/10"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${
          highlight
            ? "bg-accent-yellow/20 text-ink"
            : "bg-ink/5 text-ink group-hover:bg-accent-yellow/20"
        }`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-3">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="text-ink/60 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function DevelopersPage() {
  const [user, setUser] = useState<VillaUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = villa.onAuthChange((u: VillaUser | null) => setUser(u));
    return () => unsubscribe();
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
    <div className="min-h-screen">
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-yellow/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent-yellow/10 text-ink px-4 py-2 rounded-full text-sm font-medium border border-accent-yellow/20">
              <Sparkles className="w-4 h-4" />
              Passkey authentication for AI-native apps
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9]">
              Build with
              <span className="block bg-gradient-to-r from-accent-yellow to-accent-yellow/80 bg-clip-text text-transparent">
                superpowers
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
              Add passkey authentication in minutes. No passwords, no config, no
              hassle.
              <br />
              <span className="text-accent-yellow font-medium">
                Just 3 lines of code.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="#quickstart"
                className="inline-flex items-center gap-2 bg-ink text-cream-50 font-medium px-8 py-4 rounded-xl hover:bg-ink/90 transition-all hover:scale-105 active:scale-95 shadow-villa"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 border-2 border-ink/10 text-ink font-medium px-8 py-4 rounded-xl hover:border-accent-yellow/50 hover:bg-accent-yellow/5 transition-all"
              >
                <Play className="w-4 h-4" />
                Try Playground
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-ink/40">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-yellow fill-current" />
                <span>Works with Lovable</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Built on Base</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Zero config</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-white to-cream-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-serif text-3xl md:text-4xl">
                  See it in action
                </h2>
                <p className="text-ink/60 text-lg">
                  Watch how simple it is to add authentication to your app.
                </p>
              </div>

              <div className="space-y-4">
                <QuickCopyButton
                  text="npm install @rockfridrich/villa-sdk-react"
                  label="npm install @rockfridrich/villa-sdk-react"
                />

                <CodeBlock
                  code={`import { VillaButton } from '@rockfridrich/villa-sdk-react'

function App() {
  return <VillaButton />
}`}
                  language="tsx"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent-yellow/20 to-transparent rounded-3xl blur-xl" />
              <div className="relative bg-white rounded-3xl shadow-villa-lg border border-ink/5 p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-ink/40 uppercase tracking-wider">
                    <div className="w-2 h-2 bg-success-text rounded-full animate-pulse" />
                    Live Demo
                  </div>

                  {user ? (
                    <div className="space-y-6 animate-fade-in">
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        className="w-24 h-24 rounded-full mx-auto border-4 border-accent-yellow/20 shadow-villa"
                      />
                      <div className="space-y-2">
                        <p className="text-2xl font-serif">@{user.nickname}</p>
                        <p className="text-sm text-ink/40 font-mono px-3 py-1 bg-ink/5 rounded-lg inline-block">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => villa.settings()}
                          className="px-4 py-2 text-sm border border-ink/10 rounded-lg hover:bg-ink/5 transition-colors"
                        >
                          Settings
                        </button>
                        <button
                          onClick={() => villa.signOut()}
                          className="px-4 py-2 text-sm text-error-text border border-error-border rounded-lg hover:bg-error-bg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-24 h-24 rounded-full bg-ink/5 mx-auto flex items-center justify-center">
                        <Fingerprint className="w-12 h-12 text-ink/20" />
                      </div>
                      <button
                        onClick={handleSignIn}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 bg-ink text-cream-50 font-medium px-8 py-4 rounded-xl hover:bg-ink/90 transition-all disabled:opacity-50 hover:scale-105"
                      >
                        <Fingerprint className="w-5 h-5" />
                        {isLoading ? "Signing in..." : "Try Sign In"}
                      </button>
                      <p className="text-sm text-ink/40">
                        Uses real passkeys on Base blockchain
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quickstart" className="py-20 px-6 bg-ink text-cream-50">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Quick Start</h2>
            <p className="text-cream-50/60 text-lg">
              Get up and running in under 60 seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent-yellow/20 flex items-center justify-center">
                <span className="text-lg font-bold text-accent-yellow">1</span>
              </div>
              <h3 className="font-serif text-xl">Install</h3>
              <CodeBlock
                code="npm install @rockfridrich/villa-sdk-react"
                language="bash"
              />
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent-yellow/20 flex items-center justify-center">
                <span className="text-lg font-bold text-accent-yellow">2</span>
              </div>
              <h3 className="font-serif text-xl">Import</h3>
              <CodeBlock
                code="import { VillaButton } from '@rockfridrich/villa-sdk-react'"
                language="tsx"
              />
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent-yellow/20 flex items-center justify-center">
                <span className="text-lg font-bold text-accent-yellow">3</span>
              </div>
              <h3 className="font-serif text-xl">Use</h3>
              <CodeBlock code="<VillaButton />" language="tsx" />
            </div>
          </div>

          <div className="text-center pt-8">
            <Link
              href="/sdk"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-6 py-3 rounded-lg hover:bg-accent-yellow/90 transition-all"
            >
              Read Full Documentation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-cream-50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Why developers choose Villa</h2>
            <p className="text-ink/60 text-lg max-w-2xl mx-auto">
              Built for modern apps with AI-first design principles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Passkeys, not passwords"
              description="Face ID, Touch ID, or security keys. No credentials stored, no breaches possible."
              highlight={true}
            />
            <FeatureCard
              icon={Heart}
              title="Works with Lovable"
              description="Just paste the prompt. AI builds the rest. Perfect for no-code workflows."
            />
            <FeatureCard
              icon={User}
              title="Profile UI included"
              description="Beautiful avatar, nickname, and address components. Ready to use out of the box."
            />
            <FeatureCard
              icon={Zap}
              title="Built on Base"
              description="Real blockchain identity with gasless transactions and L2 speed."
            />
            <FeatureCard
              icon={Code2}
              title="Developer experience"
              description="TypeScript-first, zero config, comprehensive docs, and active Discord community."
            />
            <FeatureCard
              icon={Globe}
              title="Works everywhere"
              description="React, Next.js, Vue, vanilla JS. Mobile, desktop, extension. One SDK, all platforms."
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Supported platforms</h2>
            <p className="text-ink/60 text-lg">One SDK that works everywhere</p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-medium text-ink/40 uppercase tracking-wider text-sm mb-4">
                Frontend Frameworks
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <PlatformBadge icon={Code2} name="React" />
                <PlatformBadge icon={Code2} name="Next.js" />
                <PlatformBadge icon={Code2} name="Vue" />
                <PlatformBadge icon={Code2} name="Svelte" />
                <PlatformBadge icon={Code2} name="Angular" />
                <PlatformBadge icon={Code2} name="Vanilla JS" />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-ink/40 uppercase tracking-wider text-sm mb-4">
                Devices & Platforms
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PlatformBadge icon={Laptop} name="Desktop Web" />
                <PlatformBadge icon={Smartphone} name="Mobile Web" />
                <PlatformBadge icon={Smartphone} name="React Native" />
                <PlatformBadge icon={Globe} name="Extensions" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-cream-50 to-accent-yellow/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Loved by developers</h2>
            <p className="text-ink/60 text-lg">
              Join the community building the future of auth
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-villa border border-ink/5 space-y-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-accent-yellow fill-current"
                  />
                ))}
              </div>
              <p className="text-lg leading-relaxed">
                &ldquo;Villa made adding auth to our AI app incredibly simple.
                The passkey integration just works, and our users love not
                having to remember another password.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-ink" />
                </div>
                <div>
                  <p className="font-medium">Sarah Chen</p>
                  <p className="text-sm text-ink/60">Founder, BuildFast AI</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-villa border border-ink/5 space-y-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-accent-yellow fill-current"
                  />
                ))}
              </div>
              <p className="text-lg leading-relaxed">
                &ldquo;The developer experience is outstanding. TypeScript
                support, great docs, and it works perfectly with our Lovable
                workflow. Shipped auth in 30 minutes.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-ink" />
                </div>
                <div>
                  <p className="font-medium">Alex Rodriguez</p>
                  <p className="text-sm text-ink/60">CTO, NextGen Apps</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="https://github.com/rockfridrich/villa"
              className="inline-flex items-center gap-2 text-ink/60 hover:text-ink transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Star us on GitHub
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-ink text-cream-50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-serif text-4xl md:text-5xl">Ready to build?</h2>
          <p className="text-cream-50/60 text-lg leading-relaxed">
            Join thousands of developers using Villa to add secure, passwordless
            authentication to their apps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 bg-accent-yellow text-ink font-medium px-8 py-4 rounded-xl hover:bg-accent-yellow/90 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Try Playground
            </Link>
            <Link
              href="/sdk"
              className="inline-flex items-center gap-2 border-2 border-cream-50/20 text-cream-50 font-medium px-8 py-4 rounded-xl hover:border-accent-yellow/50 hover:bg-accent-yellow/10 transition-all"
            >
              Read Docs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-cream-50/40">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>SOC2 compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>5min setup</span>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
