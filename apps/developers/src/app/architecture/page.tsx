"use client";

import Link from "next/link";
import { CodeBlock } from "../../components/code";
import {
  ExternalLink,
  Github,
  Book,
  Shield,
  Key,
  Database,
  ChevronRight,
} from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-cream-50 text-ink">
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="font-serif text-4xl sm:text-6xl tracking-tight">
            Architecture
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl leading-relaxed">
            Villa is a privacy-first identity system for pop-up villages,
            providing passkey authentication on the Base blockchain.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="https://github.com/rockfridrich/villa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-ink text-cream-50 px-6 py-3 rounded-xl hover:bg-ink/80 transition-all"
            >
              <Github className="w-4 h-4" /> Source Code
            </a>
            <Link
              href="/sdk"
              className="inline-flex items-center gap-2 border border-ink/10 px-6 py-3 rounded-xl hover:bg-ink/5 transition-all"
            >
              <Book className="w-4 h-4" /> SDK Reference
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-24">
        <section id="auth-flow" className="space-y-8">
          <h2 className="font-serif text-3xl flex items-center gap-3">
            <Key className="w-6 h-6 text-accent-yellow" />
            Passkey Authentication
          </h2>
          <div className="bg-white p-8 rounded-2xl border border-ink/5 shadow-sm space-y-6">
            <p className="text-ink/80 leading-relaxed">
              Villa replaces traditional wallet-based authentication with a
              passkey-first experience. Users create persistent identities that
              follow them across devices via biometric recovery.
            </p>

            <ol className="space-y-6 relative border-l-2 border-ink/5 ml-3 pl-8">
              <li className="relative">
                <span className="absolute -left-[39px] w-5 h-5 rounded-full bg-accent-yellow flex items-center justify-center text-xs font-bold ring-4 ring-cream-50">
                  1
                </span>
                <h3 className="font-medium text-lg">Initiation</h3>
                <p className="text-ink/60 mt-1">
                  App calls{" "}
                  <code className="text-sm bg-ink/5 px-1.5 py-0.5 rounded">
                    villa.signIn()
                  </code>
                  . SDK opens a secure iframe.
                </p>
              </li>
              <li className="relative">
                <span className="absolute -left-[39px] w-5 h-5 rounded-full bg-accent-yellow flex items-center justify-center text-xs font-bold ring-4 ring-cream-50">
                  2
                </span>
                <h3 className="font-medium text-lg">WebAuthn</h3>
                <p className="text-ink/60 mt-1">
                  User authenticates with FaceID/TouchID. Private keys remain in
                  hardware enclave.
                </p>
              </li>
              <li className="relative">
                <span className="absolute -left-[39px] w-5 h-5 rounded-full bg-accent-yellow flex items-center justify-center text-xs font-bold ring-4 ring-cream-50">
                  3
                </span>
                <h3 className="font-medium text-lg">Derivation</h3>
                <p className="text-ink/60 mt-1">
                  Ethereum address is deterministically derived from the passkey
                  signature.
                </p>
              </li>
              <li className="relative">
                <span className="absolute -left-[39px] w-5 h-5 rounded-full bg-accent-yellow flex items-center justify-center text-xs font-bold ring-4 ring-cream-50">
                  4
                </span>
                <h3 className="font-medium text-lg">Identity</h3>
                <p className="text-ink/60 mt-1">
                  App receives Identity object:{" "}
                  <code className="text-sm bg-ink/5 px-1.5 py-0.5 rounded">{`{ address, nickname, avatar }`}</code>
                  .
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="contracts" className="space-y-8">
          <h2 className="font-serif text-3xl flex items-center gap-3">
            <Database className="w-6 h-6 text-accent-yellow" />
            Smart Contracts
          </h2>
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm">
              <h3 className="font-medium text-lg mb-2">Nickname Resolver</h3>
              <p className="text-ink/60 mb-4 text-sm">
                Handles on-chain nickname resolution and ENS compatibility.
              </p>
              <div className="flex items-center gap-2 p-3 bg-ink/[0.02] rounded-lg border border-ink/5 overflow-hidden">
                <code className="text-xs sm:text-sm font-mono text-ink/80 truncate flex-1">
                  0x180ddE044F1627156Cac6b2d068706508902AE9C
                </code>
                <span className="text-xs text-ink-muted font-medium px-2 py-1 bg-ink/5 rounded">
                  Base Sepolia
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm">
              <h3 className="font-medium text-lg mb-2">
                Biometric Recovery Signer
              </h3>
              <p className="text-ink/60 mb-4 text-sm">
                Manages logic for recovering accounts across devices using
                FaceID.
              </p>
              <div className="flex items-center gap-2 p-3 bg-ink/[0.02] rounded-lg border border-ink/5 overflow-hidden">
                <code className="text-xs sm:text-sm font-mono text-ink/80 truncate flex-1">
                  0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836
                </code>
                <span className="text-xs text-ink-muted font-medium px-2 py-1 bg-ink/5 rounded">
                  Base Sepolia
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="space-y-8">
          <h2 className="font-serif text-3xl flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent-yellow" />
            Security Model
          </h2>
          <div className="bg-white p-8 rounded-2xl border border-ink/5 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Hardware-Bound</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  Passkeys never leave the user&apos;s device. The private key
                  is generated and stored in the device&apos;s secure enclave
                  (TPM/Secure Element).
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Zero Knowledge</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  Villa never sees private keys. We only receive signatures and
                  public keys. The system is non-custodial by design.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Origin Isolation</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  Authentication happens in a secure iframe pointing to{" "}
                  <code className="text-xs bg-ink/5 px-1 rounded">
                    key.villa.cash
                  </code>
                  . Origin validation prevents phishing.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Address Derivation</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  Addresses are calculated from the secp256r1 public key
                  coordinates, ensuring 1:1 mapping between passkey and address.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-ink/5">
          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              href="/sdk"
              className="group p-6 rounded-2xl bg-ink/[0.02] hover:bg-ink/5 transition-all"
            >
              <h3 className="font-medium text-lg mb-1 group-hover:text-ink flex items-center gap-2">
                SDK Reference <ChevronRight className="w-4 h-4 opacity-50" />
              </h3>
              <p className="text-ink/60 text-sm">
                Complete API documentation for @rockfridrich/villa-sdk
              </p>
            </Link>
            <Link
              href="/examples"
              className="group p-6 rounded-2xl bg-ink/[0.02] hover:bg-ink/5 transition-all"
            >
              <h3 className="font-medium text-lg mb-1 group-hover:text-ink flex items-center gap-2">
                Example Apps <ChevronRight className="w-4 h-4 opacity-50" />
              </h3>
              <p className="text-ink/60 text-sm">
                Next.js and React starter kits
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
