"use client";

import Link from "next/link";
import { ExternalLink, ChevronRight, Book, Github, Heart, Sparkles, Terminal, Layers } from "lucide-react";
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
                One Line Auth
              </span>
            </h1>
            <p className="text-xl text-[#0D0D17]/60 max-w-lg leading-relaxed">
              Privacy-first passkey authentication for pop-up villages.
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
                href="/architecture"
                className="inline-flex items-center gap-2 border border-[#0D0D17]/10 px-8 py-4 rounded-xl hover:bg-[#0D0D17]/5 transition-all"
              >
                <Layers className="w-4 h-4" /> Architecture
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
            <p className="text-[#0D0D17]/60 text-lg">From zero to authenticated in 3 steps.</p>
          </div>

          <div className="space-y-12">
            <div className="grid md:grid-cols-[80px_1fr] gap-8">
              <div className="flex flex-col items-center pt-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE047] flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                <div className="w-px h-full bg-[#0D0D17]/10 mt-4 hidden md:block" />
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-2xl">Install</h3>
                <p className="text-[#0D0D17]/60">Add the SDK and React bindings to your project.</p>
                <CodeBlock code="npm install @rockfridrich/villa-sdk-react" language="bash" />
              </div>
            </div>

            <div className="grid md:grid-cols-[80px_1fr] gap-8">
              <div className="flex flex-col items-center pt-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE047] flex items-center justify-center font-bold text-lg shadow-sm">2</div>
                <div className="w-px h-full bg-[#0D0D17]/10 mt-4 hidden md:block" />
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-2xl">Import</h3>
                <p className="text-[#0D0D17]/60">Import the auth component.</p>
                <CodeBlock 
                  code="import { VillaAuth } from '@rockfridrich/villa-sdk-react'" 
                  language="typescript" 
                />
              </div>
            </div>

            <div className="grid md:grid-cols-[80px_1fr] gap-8">
              <div className="flex flex-col items-center pt-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE047] flex items-center justify-center font-bold text-lg shadow-sm">3</div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-2xl">Ship it</h3>
                <p className="text-[#0D0D17]/60">Use the component to authenticate users. It handles everything.</p>
                <CodeBlock
                  code={`<VillaAuth
  onComplete={(result) => {
    if (result.success) {
      console.log('Welcome,', result.identity.nickname)
      // result.identity: { address, nickname, avatar }
    }
  }}
/>`}
                  language="tsx"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lovable" className="py-24 px-6 bg-[#FFE047]/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FFE047]/20 text-[#0D0D17] mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Build with Lovable</h2>
            <p className="text-[#0D0D17]/60 text-lg max-w-xl mx-auto">
              Villa is optimized for AI generation. Just paste this prompt into Lovable.dev to add authentication.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#0D0D17]/5 shadow-sm space-y-4">
            <h3 className="font-medium text-sm uppercase tracking-wider text-[#0D0D17]/40">Copy this prompt</h3>
            <div className="relative group">
              <div className="bg-[#0D0D17]/[0.02] p-6 rounded-xl border border-[#0D0D17]/5 text-lg font-medium leading-relaxed">
                Add Villa authentication using @rockfridrich/villa-sdk-react. Fetch context from docs.villa.cash/CLAUDE.txt
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text="Add Villa authentication using @rockfridrich/villa-sdk-react. Fetch context from docs.villa.cash/CLAUDE.txt" />
              </div>
            </div>
            <p className="text-sm text-[#0D0D17]/40 text-center pt-2">
              Lovable will automatically install dependencies and set up the auth flow.
            </p>
          </div>
        </div>
      </section>

      <section id="ai" className="py-24 px-6 bg-white border-t border-[#0D0D17]/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D0D17]/5 text-[#0D0D17] mb-2">
              <Terminal className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">AI Context</h2>
            <p className="text-[#0D0D17]/60 text-lg max-w-xl mx-auto">
              Building with Cursor, Windsurf, or Claude Code? Add our context file to your project.
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
