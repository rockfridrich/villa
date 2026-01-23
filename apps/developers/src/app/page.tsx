"use client";

import Link from "next/link";
import { ChevronRight, Book, Heart, Sparkles, Terminal, Layers, RefreshCw } from "lucide-react";
import { CodeBlock } from "../components/code";
import { CopyButton } from "../components/code";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#0D0D17]">
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE047]/10 border border-[#FFE047]/20 text-sm font-medium text-[#0D0D17]/80">
              <Heart className="w-3.5 h-3.5 fill-[#FFE047] text-[#FFE047]" />
              Works with Lovable
            </div>
            
            <h1 className="font-serif text-5xl sm:text-7xl tracking-tight leading-[0.9]">
              Villa SDK
              <span className="block text-[#0D0D17]/60 text-3xl sm:text-4xl mt-4 font-sans font-light">
                One Component Auth
              </span>
            </h1>
            <p className="text-xl text-[#0D0D17]/60 max-w-lg leading-relaxed">
              Passkey authentication with built-in profile UI.
              <br />
              Zero passwords. Zero config. Ship in 2 minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#quickstart"
                className="inline-flex items-center gap-2 bg-[#FFE047] text-[#0D0D17] font-medium px-8 py-4 rounded-xl hover:bg-[#FFE047]/90 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Start Building <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="#upgrade"
                className="inline-flex items-center gap-2 border border-[#0D0D17]/10 px-8 py-4 rounded-xl hover:bg-[#0D0D17]/5 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Upgrade Guide
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#0D0D17]/10 aspect-[4/3] bg-white animate-in slide-in-from-right duration-700 delay-200">
            <div className="absolute inset-0 bg-[#0D0D17]/5 animate-pulse" />
            <iframe
              src="https://construction.villa.cash/sdk-demo"
              className="w-full h-full relative z-10"
              title="Villa SDK Demo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section id="quickstart" className="py-24 px-6 bg-white border-y border-[#0D0D17]/5">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Quickstart</h2>
            <p className="text-[#0D0D17]/60 text-lg">One component does everything.</p>
          </div>

          <div className="space-y-12">
            <div className="grid md:grid-cols-[80px_1fr] gap-8">
              <div className="flex flex-col items-center pt-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE047] flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                <div className="w-px h-full bg-[#0D0D17]/10 mt-4 hidden md:block" />
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-2xl">Install</h3>
                <CodeBlock code="npm install @rockfridrich/villa-sdk-react" language="bash" />
              </div>
            </div>

            <div className="grid md:grid-cols-[80px_1fr] gap-8">
              <div className="flex flex-col items-center pt-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE047] flex items-center justify-center font-bold text-lg shadow-sm">2</div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-2xl">Add VillaButton</h3>
                <p className="text-[#0D0D17]/60">It handles sign-in, profile dropdown, settings, and sign-out.</p>
                <CodeBlock
                  code={`import { VillaButton } from '@rockfridrich/villa-sdk-react'

function App() {
  return (
    <header>
      <VillaButton />
    </header>
  )
}`}
                  language="tsx"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0D0D17]/[0.02] p-6 rounded-xl border border-[#0D0D17]/5">
            <h4 className="font-medium mb-3">What VillaButton does:</h4>
            <ul className="grid sm:grid-cols-2 gap-2 text-[#0D0D17]/70">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                Shows &ldquo;Sign in with Villa&rdquo; when logged out
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                Profile dropdown when logged in
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                Copy wallet address
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                Settings popup for profile editing
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="access-data" className="py-24 px-6 border-b border-[#0D0D17]/5">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-4xl">Access User Data</h2>
            <p className="text-[#0D0D17]/60 text-lg">Use the hook anywhere in your app.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <CodeBlock
              code={`import { useVilla } from '@rockfridrich/villa-sdk-react'

function Profile() {
  const { user } = useVilla()
  
  if (!user) return null
  
  return (
    <div>
      <img src={user.avatar} alt="" />
      <p>@{user.nickname}</p>
      <p>{user.address}</p>
    </div>
  )
}`}
              language="tsx"
            />
          </div>
        </div>
      </section>

      <section id="upgrade" className="py-24 px-6 bg-[#FFE047]/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFE047]/20 text-[#0D0D17] mb-2">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Upgrade from v0</h2>
            <p className="text-[#0D0D17]/60 text-lg max-w-xl mx-auto">
              Already using Villa? Here&apos;s how to get the new profile UI.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#0D0D17]/5 shadow-sm space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">1. Update packages</h3>
              <CodeBlock code="npm update @rockfridrich/villa-sdk @rockfridrich/villa-sdk-react" language="bash" />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">2. Replace VillaAuth with VillaButton</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-[#0D0D17]/40">Before (v0.0.x)</span>
                  <CodeBlock
                    code={`<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      setUser(result.identity)
    }
  }}
/>`}
                    language="tsx"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-[#0D0D17]/40">After (v0.1.x)</span>
                  <CodeBlock
                    code={`<VillaButton />`}
                    language="tsx"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#0D0D17]/5">
              <h4 className="font-medium mb-3">What&apos;s new in v0.1:</h4>
              <ul className="space-y-2 text-[#0D0D17]/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                  VillaButton with built-in profile dropdown
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                  VillaProfile component for custom layouts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                  villa.settings() for profile editing popup
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                  Copy wallet address with one click
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE047]" />
                  Web3 gradient avatars
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="lovable" className="py-24 px-6 bg-white border-t border-[#0D0D17]/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFE047]/20 text-[#0D0D17] mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Build with Lovable</h2>
            <p className="text-[#0D0D17]/60 text-lg max-w-xl mx-auto">
              Just paste this prompt into Lovable.dev
            </p>
          </div>

          <div className="bg-[#0D0D17]/[0.02] p-8 rounded-2xl border border-[#0D0D17]/5 space-y-4">
            <div className="relative group">
              <div className="p-6 rounded-xl border border-[#0D0D17]/10 bg-white text-lg font-medium leading-relaxed">
                Add Villa authentication using @rockfridrich/villa-sdk-react. Use VillaButton component. Fetch context from docs.villa.cash/LOVABLE.txt
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text="Add Villa authentication using @rockfridrich/villa-sdk-react. Use VillaButton component. Fetch context from docs.villa.cash/LOVABLE.txt" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="py-24 px-6 border-t border-[#0D0D17]/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D0D17]/5 text-[#0D0D17] mb-2">
              <Terminal className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">AI Context</h2>
            <p className="text-[#0D0D17]/60 text-lg max-w-xl mx-auto">
              Using Cursor, Windsurf, or Claude Code?
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <CodeBlock code="curl https://docs.villa.cash/CLAUDE.txt > CLAUDE.txt" language="bash" />
          </div>
          
          <div className="text-center pt-8">
            <Link href="/architecture" className="inline-flex items-center gap-2 text-[#0D0D17]/60 hover:text-[#0D0D17] transition-colors">
              <Book className="w-4 h-4" />
              <span className="underline decoration-[#0D0D17]/20 underline-offset-4 hover:decoration-[#0D0D17]/40">
                Deep dive into Villa Architecture
              </span>
            </Link>
          </div>
        </div>
      </section>
      
      <footer className="py-12 text-center text-[#0D0D17]/40 text-sm border-t border-[#0D0D17]/5">
        <p>© {new Date().getFullYear()} Villa. Built for pop-up villages.</p>
      </footer>
    </div>
  );
}
