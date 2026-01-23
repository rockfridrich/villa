"use client";

import Link from "next/link";
import { ExternalLink, ChevronRight, Book, Github } from "lucide-react";
import { CodeBlock } from "../components/code";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#0D0D17]">
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
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
                href="/sdk"
                className="inline-flex items-center gap-2 border border-[#0D0D17]/10 px-8 py-4 rounded-xl hover:bg-[#0D0D17]/5 transition-all"
              >
                <Book className="w-4 h-4" /> Documentation
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

      <section className="py-24 px-6 bg-[#0D0D17]/[0.02]">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="font-serif text-3xl text-center">Start Building</h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <Link href="/sdk" className="group p-8 rounded-2xl bg-white border border-[#0D0D17]/5 hover:border-[#0D0D17]/20 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center mb-6 text-[#0D0D17]">
                <Book className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-xl mb-2 group-hover:text-[#FFE047] transition-colors bg-clip-text">Documentation</h3>
              <p className="text-[#0D0D17]/60 leading-relaxed">
                Full SDK reference, API details, and configuration options.
              </p>
            </Link>

            <Link href="/examples" className="group p-8 rounded-2xl bg-white border border-[#0D0D17]/5 hover:border-[#0D0D17]/20 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center mb-6 text-[#0D0D17]">
                <ExternalLink className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-xl mb-2 group-hover:text-[#FFE047] transition-colors">Examples</h3>
              <p className="text-[#0D0D17]/60 leading-relaxed">
                Copy-paste starter kits for Next.js, React, and Vanilla JS.
              </p>
            </Link>

            <a href="https://github.com/rockfridrich/villa" target="_blank" rel="noopener noreferrer" className="group p-8 rounded-2xl bg-white border border-[#0D0D17]/5 hover:border-[#0D0D17]/20 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#FFE047]/20 flex items-center justify-center mb-6 text-[#0D0D17]">
                <Github className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-xl mb-2 group-hover:text-[#FFE047] transition-colors">GitHub</h3>
              <p className="text-[#0D0D17]/60 leading-relaxed">
                Open source and built for the community. Star us on GitHub!
              </p>
            </a>
          </div>
        </div>
      </section>
      
      <footer className="py-12 text-center text-[#0D0D17]/40 text-sm border-t border-[#0D0D17]/5">
        <p>© {new Date().getFullYear()} Villa. Built for pop-up villages.</p>
      </footer>
    </div>
  );
}
