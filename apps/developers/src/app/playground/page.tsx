"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Terminal, 
  User, 
  Zap, 
  Shield, 
  Code2, 
  Sparkles,
  LogOut,
  Fingerprint,
  CheckCircle2
} from "lucide-react";
import { villa, type VillaUser } from "@rockfridrich/villa-sdk";
import { CodeBlock } from "../../components/code";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function PlaygroundPage() {
  const [user, setUser] = useState<VillaUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return villa.onAuthChange((u) => {
      setUser(u);
    });
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

  const handleSignOut = async () => {
    await villa.signOut();
  };

  return (
    <div className="min-h-screen bg-cream-50 text-ink selection:bg-accent-yellow/30">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-accent-yellow/5 blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-accent-green/5 blur-3xl" />
      </div>

      <main className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ink/5 shadow-sm text-sm font-medium text-ink/80 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow fill-accent-yellow" />
              <span>SDK Playground</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="font-serif text-5xl sm:text-7xl tracking-tight text-ink leading-[1.1]">
                Auth for the <br />
                <span className="text-ink/30 italic">next generation</span>
              </h1>
              <p className="text-xl text-ink-muted leading-relaxed max-w-lg">
                Add passkey authentication to your app in minutes. 
                Zero backend. Zero config. Just pure UX.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleSignIn}
                disabled={!!user || isLoading}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-ink text-white rounded-xl font-medium text-lg shadow-lg shadow-ink/10 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {user ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    <span>Signed In</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{isLoading ? "Signing in..." : "Try Live Demo"}</span>
                  </>
                )}
              </button>
              <a 
                href="/docs" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-ink/10 rounded-xl font-medium text-lg text-ink hover:bg-cream-50 transition-colors"
              >
                Read Docs
              </a>
            </div>
          </motion.div>

          {/* Interactive Demo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-white rounded-3xl border border-ink/5 shadow-villa-lg overflow-hidden backdrop-blur-xl">
              <div className="px-6 py-4 border-b border-ink/5 bg-cream-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-ink/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-ink/10" />
                  </div>
                  <span className="text-xs font-mono text-ink-muted ml-2">demo.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-xs font-medium text-ink-muted">
                    {user ? 'Connected' : 'Waiting for user'}
                  </span>
                </div>
              </div>

              <div className="p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  {user ? (
                    <motion.div
                      key="signed-in"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full max-w-sm space-y-6"
                    >
                      <div className="relative w-24 h-24 mx-auto">
                        <img 
                          src={user.avatar} 
                          alt={user.nickname} 
                          className="w-full h-full rounded-full border-4 border-white shadow-villa object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-ink/5">
                          <img src="/logo.svg" className="w-5 h-5" alt="Villa" onError={(e) => e.currentTarget.style.display = 'none'} />
                          <Fingerprint className="w-4 h-4 text-accent-green" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-2xl font-serif text-ink">
                          Welcome, <span className="text-accent-brown">@{user.nickname}</span>
                        </h3>
                        <p className="font-mono text-xs text-ink-muted truncate bg-ink/5 py-1 px-3 rounded-full mx-auto max-w-[200px]">
                          {user.address}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={() => villa.settings()}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-ink/10 rounded-lg text-sm font-medium hover:bg-cream-50 transition-colors"
                        >
                          Settings
                        </button>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium hover:bg-red-100/50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signed-out"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 max-w-xs"
                    >
                      <div className="w-20 h-20 bg-ink/5 rounded-2xl mx-auto flex items-center justify-center rotate-3">
                        <User className="w-10 h-10 text-ink/20" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-medium text-ink">Not Signed In</h3>
                        <p className="text-sm text-ink-muted">
                          Click the button on the left to experience the seamless passkey flow.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Code peek under the hood */}
              <div className="bg-[#1e1e1e] p-4 border-t border-ink/5">
                <div className="font-mono text-xs text-white/50 mb-2">Current State</div>
                <pre className="font-mono text-xs text-white/80 overflow-x-auto">
                  {user 
                    ? JSON.stringify({ nickname: user.nickname, address: user.address, verified: true }, null, 2)
                    : "// Waiting for authentication..."}
                </pre>
              </div>
            </div>
            
            {/* Decoration dots */}
            <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full border-2 border-dashed border-ink/10 rounded-3xl" />
          </motion.div>
        </div>

        {/* Features Grid */}
        <section className="mb-32">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Fingerprint,
                title: "Passkey Native",
                desc: "Built from the ground up for the WebAuthn standard. Biometric security by default."
              },
              {
                icon: Zap,
                title: "Zero Config",
                desc: "No backend to configure. No database schemas. Just drop the SDK in and go."
              },
              {
                icon: User,
                title: "User Profiles",
                desc: "Integrated profile management, avatars, and settings UI out of the box."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-ink/5 shadow-villa hover:shadow-villa-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-cream-100 text-ink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-ink mb-3">{feature.title}</h3>
                <p className="text-ink-muted leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Integration Section */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-4xl text-ink">Ready to integrate?</h2>
            <p className="text-ink-muted text-lg">
              Two lines of code to get started. It really is that simple.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink font-medium">
                <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-xs">1</div>
                <h3>Install the SDK</h3>
              </div>
              <CodeBlock 
                language="bash" 
                code="npm install @rockfridrich/villa-sdk" 
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink font-medium">
                <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-xs">2</div>
                <h3>Sign in user</h3>
              </div>
              <CodeBlock 
                language="typescript" 
                code={`import { villa } from "@rockfridrich/villa-sdk";

// Trigger the passkey flow
const user = await villa.signIn();

console.log(user.nickname); // "alice"`} 
              />
            </div>
          </div>
          
          <div className="flex justify-center pt-8">
             <a 
                href="/docs" 
                className="group inline-flex items-center gap-2 px-6 py-3 bg-white border border-ink/10 rounded-full font-medium text-ink hover:bg-cream-50 transition-colors shadow-sm"
              >
                <Code2 className="w-4 h-4" />
                <span>View Full Documentation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
          </div>
        </section>

      </main>
    </div>
  );
}
