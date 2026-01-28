"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  Play,
  RotateCcw,
  Copy,
  ChevronDown,
  Terminal,
  User,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  LogOut,
  Sparkles,
} from "lucide-react";
import { villa } from "@rockfridrich/villa-sdk";

interface VillaUser {
  address: `0x${string}`;
  nickname: string;
  avatar: string;
}

type ExampleKey =
  | "basic-auth"
  | "profile-management"
  | "react-integration"
  | "error-handling"
  | "session-management";

interface Example {
  title: string;
  description: string;
  code: string;
}

const EXAMPLES: Record<ExampleKey, Example> = {
  "basic-auth": {
    title: "Basic Authentication",
    description: "Simple sign in/out flow with the Villa SDK",
    code: `import { villa } from '@rockfridrich/villa-sdk';

async function signIn() {
  try {
    const user = await villa.signIn();
    console.log('Welcome,', user.nickname);
    console.log('Address:', user.address);
    console.log('Avatar:', user.avatar);
    return user;
  } catch (error) {
    console.error('Sign in failed:', error);
  }
}

async function signOut() {
  await villa.signOut();
  console.log('Signed out successfully');
}

function getCurrentUser() {
  const user = villa.user;
  if (user) {
    console.log('Current user:', user.nickname);
  } else {
    console.log('No user signed in');
  }
  return user;
}

villa.onAuthChange((user) => {
  if (user) {
    console.log('User signed in:', user.nickname);
  } else {
    console.log('User signed out');
  }
});

signIn();`,
  },

  "profile-management": {
    title: "Profile Management",
    description: "Access and manage user profile information",
    code: `import { villa } from '@rockfridrich/villa-sdk';

async function getProfile() {
  const user = villa.user;
  if (!user) {
    console.log('Please sign in first');
    return;
  }
  
  console.log('Profile Info:');
  console.log('- Nickname:', user.nickname);
  console.log('- Address:', user.address);
  console.log('- Avatar URL:', user.avatar);
  
  return user;
}

async function openSettings() {
  try {
    await villa.settings();
    console.log('Settings opened');
  } catch (error) {
    console.error('Failed to open settings:', error);
  }
}

async function demo() {
  let user = villa.user;
  if (!user) {
    console.log('Signing in first...');
    user = await villa.signIn();
  }
  
  getProfile();
  
  setTimeout(() => {
    console.log('\\nWant to customize your profile?');
    console.log('Call openSettings() to open the settings popup');
  }, 2000);
}

demo();`,
  },

  "react-integration": {
    title: "React Hook Integration",
    description: "Using Villa SDK with React hooks",
    code: `import { useState, useEffect } from 'react';
import { villa } from '@rockfridrich/villa-sdk';

function useVilla() {
  const [user, setUser] = useState(villa.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = villa.onAuthChange((newUser) => {
      setUser(newUser);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await villa.signIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await villa.signOut();
    } catch (err) {
      setError(err.message);
    }
  };

  const openSettings = async () => {
    setError(null);
    try {
      await villa.settings();
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    openSettings,
    isAuthenticated: !!user,
  };
}

function AuthButton() {
  const { user, isLoading, error, signIn, signOut, openSettings } = useVilla();

  console.log('Current auth state:', {
    user: user?.nickname || null,
    isLoading,
    error,
    isAuthenticated: !!user
  });

  if (isLoading) {
    return console.log('🔄 Loading...');
  }

  if (error) {
    return console.error('❌ Error:', error);
  }

  if (user) {
    console.log('✅ Signed in as @' + user.nickname);
    console.log('Actions available: signOut(), openSettings()');
  } else {
    console.log('👋 Not signed in');
    console.log('Actions available: signIn()');
  }

  return { user, signIn, signOut, openSettings };
}

const authState = AuthButton();
console.log('Auth component result:', authState);`,
  },

  "error-handling": {
    title: "Error Handling",
    description: "Proper error handling patterns",
    code: `import { villa } from '@rockfridrich/villa-sdk';

async function robustSignIn() {
  console.log('Attempting to sign in...');
  
  try {
    const user = await villa.signIn();
    console.log('✅ Sign in successful');
    console.log('Welcome,', user.nickname);
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Sign in failed');
    
    if (error.name === 'UserCancelledError') {
      console.log('User cancelled the authentication');
      return { success: false, reason: 'cancelled' };
    }
    
    if (error.name === 'NotSupportedError') {
      console.log('WebAuthn not supported in this browser');
      return { success: false, reason: 'not_supported' };
    }
    
    if (error.name === 'SecurityError') {
      console.log('Security error - check HTTPS and domain');
      return { success: false, reason: 'security' };
    }
    
    console.log('Unknown error:', error.message);
    return { success: false, reason: 'unknown', error: error.message };
  }
}

async function signInWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    console.log(\`Attempt \${i + 1} of \${maxRetries}\`);
    
    const result = await robustSignIn();
    
    if (result.success) {
      return result;
    }
    
    if (result.reason === 'cancelled') {
      console.log('User cancelled - not retrying');
      return result;
    }
    
    if (i < maxRetries - 1) {
      console.log('Retrying in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('All retry attempts failed');
  return { success: false, reason: 'max_retries_exceeded' };
}

function checkVillaSupport() {
  console.log('Checking Villa SDK support...');
  
  if (!window.PublicKeyCredential) {
    console.log('❌ WebAuthn not supported');
    return false;
  }
  
  if (!window.isSecureContext) {
    console.log('❌ Secure context required (HTTPS)');
    return false;
  }
  
  console.log('✅ Villa SDK supported');
  return true;
}

if (checkVillaSupport()) {
  signInWithRetry();
} else {
  console.log('Villa SDK cannot run in this environment');
}`,
  },

  "session-management": {
    title: "Session Management",
    description: "Managing user sessions and persistence",
    code: `import { villa } from '@rockfridrich/villa-sdk';

const SessionManager = {
  hasActiveSession() {
    const user = villa.user;
    const hasSession = !!user;
    console.log('Active session:', hasSession ? 'Yes' : 'No');
    if (user) {
      console.log('Session user:', user.nickname);
    }
    return hasSession;
  },

  getSessionInfo() {
    const user = villa.user;
    if (!user) {
      console.log('No active session');
      return null;
    }

    const info = {
      nickname: user.nickname,
      address: user.address,
      avatar: user.avatar,
      sessionStart: Date.now(),
    };

    console.log('Session info:', info);
    return info;
  },

  async refreshSession() {
    console.log('Attempting silent session refresh...');
    
    try {
      const currentUser = villa.user;
      if (currentUser) {
        console.log('Session still valid for:', currentUser.nickname);
        return currentUser;
      }

      console.log('No active session found');
      return null;
      
    } catch (error) {
      console.error('Session refresh failed:', error);
      return null;
    }
  },

  async clearSession() {
    console.log('Clearing session...');
    
    try {
      await villa.signOut();
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  startMonitoring() {
    console.log('Starting session monitoring...');
    
    return villa.onAuthChange((user) => {
      if (user) {
        console.log('🔒 User session started:', user.nickname);
      } else {
        console.log('🔓 User session ended');
      }
    });
  }
};

async function sessionDemo() {
  console.log('=== Session Management Demo ===\\n');
  
  const stopMonitoring = SessionManager.startMonitoring();
  
  SessionManager.hasActiveSession();
  
  let sessionInfo = SessionManager.getSessionInfo();
  
  if (!sessionInfo) {
    console.log('\\nNo session found, signing in...');
    try {
      await villa.signIn();
      sessionInfo = SessionManager.getSessionInfo();
    } catch (error) {
      console.log('Sign in failed:', error.message);
      return;
    }
  }
  
  setTimeout(() => {
    console.log('Refreshing session...');
    SessionManager.refreshSession();
  }, 3000);
  
  window.cleanupSession = () => {
    stopMonitoring();
    SessionManager.clearSession();
    console.log('Session monitoring stopped');
  };
  
  console.log('\\nCall cleanupSession() to end the demo');
}

sessionDemo();`,
  },
};

export default function PlaygroundPage() {
  const [selectedExample, setSelectedExample] =
    useState<ExampleKey>("basic-auth");
  const [code, setCode] = useState(EXAMPLES["basic-auth"].code);
  const [output, setOutput] = useState<
    Array<{ type: "log" | "error"; content: string; timestamp: number }>
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<VillaUser | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const editorRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return villa.onAuthChange((u: VillaUser | null) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = useCallback((type: "log" | "error", content: string) => {
    setOutput((prev) => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    clearOutput();

    try {
      const originalConsole = { ...console };

      console.log = (...args) => {
        addOutput(
          "log",
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(" "),
        );
      };

      console.error = (...args) => {
        addOutput(
          "error",
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(" "),
        );
      };

      const context = {
        villa,
        console,
        setTimeout: window.setTimeout,
        clearTimeout: window.clearTimeout,
        Promise: window.Promise,
        Date: window.Date,
        JSON: window.JSON,
      };

      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const fn = new AsyncFunction(...Object.keys(context), code);

      await fn(...Object.values(context));

      Object.assign(console, originalConsole);
    } catch (error) {
      addOutput("error", `Execution Error: ${(error as Error).message}`);
      Object.assign(console, { ...console });
    } finally {
      setIsRunning(false);
    }
  }, [code, addOutput, clearOutput]);

  const resetCode = useCallback(() => {
    setCode(EXAMPLES[selectedExample].code);
    clearOutput();
  }, [selectedExample, clearOutput]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [code]);

  const handleExampleChange = useCallback(
    (exampleKey: string) => {
      const key = exampleKey as ExampleKey;
      setSelectedExample(key);
      setCode(EXAMPLES[key].code);
      clearOutput();
    },
    [clearOutput],
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 text-ink">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-accent-yellow/5 blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-accent-green/5 blur-3xl" />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ink/5 shadow-sm text-sm font-medium text-ink/80 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow fill-accent-yellow" />
              <span>Interactive Playground</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl tracking-tight text-ink leading-[1.1]">
              Code, Run, <span className="text-ink/30 italic">Experiment</span>
            </h1>
            <p className="text-xl text-ink-muted leading-relaxed max-w-2xl mx-auto">
              Try Villa SDK live in your browser. Edit code, run examples, and
              see real authentication in action.
            </p>
          </motion.div>
        </div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-accent-green/10 border border-accent-green/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
              <span className="font-medium">Connected as @{user.nickname}</span>
              <button
                onClick={() => villa.signOut()}
                className="ml-auto flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg border border-ink/5 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-ink">
                  Example Template
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={resetCode}
                    className="p-2 text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
                    title="Reset to template"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyCode}
                    className="p-2 text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copySuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-green" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedExample}
                  onChange={(e) => handleExampleChange(e.target.value)}
                  className="w-full p-3 bg-cream-50 border border-ink/10 rounded-lg text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-transparent"
                >
                  {Object.entries(EXAMPLES).map(([key, example]) => (
                    <option key={key} value={key}>
                      {example.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none" />
              </div>

              <p className="text-xs text-ink-muted mt-2">
                {EXAMPLES[selectedExample].description}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-ink/5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-cream-50/50 border-b border-ink/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-mono text-ink-muted">
                    playground.js
                  </span>
                </div>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-3 py-1 bg-ink text-white rounded text-sm font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-3 h-3" />
                  {isRunning ? "Running..." : "Run"}
                </button>
              </div>

              <div className="h-[500px]">
                <Editor
                  height="100%"
                  language="typescript"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineHeight: 1.6,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    lineNumbers: "on",
                    renderWhitespace: "selection",
                    contextmenu: false,
                  }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-lg border border-ink/5 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="w-5 h-5 text-accent-green" />
                <h3 className="font-medium">Live Authentication</h3>
                <div
                  className={`w-2 h-2 rounded-full ml-auto ${user ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}
                />
              </div>

              <AnimatePresence mode="wait">
                {user ? (
                  <motion.div
                    key="authenticated"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={user.avatar}
                      alt={user.nickname}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                      <p className="font-medium">@{user.nickname}</p>
                      <p className="text-xs text-ink-muted font-mono truncate">
                        {user.address.slice(0, 20)}...
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-authenticated"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 text-ink-muted"
                  >
                    <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Not signed in</p>
                      <p className="text-xs">Run code to authenticate</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white rounded-lg border border-ink/5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-cream-50/50 border-b border-ink/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-ink/60" />
                  <span className="text-sm font-medium">Console Output</span>
                </div>
                <button
                  onClick={clearOutput}
                  className="text-xs text-ink/60 hover:text-ink transition-colors"
                >
                  Clear
                </button>
              </div>

              <div
                ref={outputRef}
                className="h-[500px] overflow-y-auto bg-[#1e1e1e] text-white font-mono text-sm"
              >
                {output.length === 0 ? (
                  <div className="p-4 text-white/40 text-center">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Console output will appear here</p>
                    <p className="text-xs mt-1">
                      Click "Run" to execute your code
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {output.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-2 ${
                          item.type === "error"
                            ? "text-red-300"
                            : "text-white/90"
                        }`}
                      >
                        <span className="text-white/40 text-xs shrink-0 mt-0.5">
                          {formatTimestamp(item.timestamp)}
                        </span>
                        <span className="whitespace-pre-wrap break-words">
                          {item.content}
                        </span>
                        {item.type === "error" && (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <section className="space-y-12">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-ink mb-4">
              Why Use the Playground?
            </h2>
            <p className="text-ink-muted text-lg max-w-2xl mx-auto">
              Test your integration patterns, experiment with the API, and learn
              by doing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Feedback",
                desc: "See your code run immediately with real Villa SDK responses and live authentication.",
              },
              {
                icon: Shield,
                title: "Safe Environment",
                desc: "Experiment freely in a sandboxed environment. Your code runs client-side only.",
              },
              {
                icon: Terminal,
                title: "Real Console",
                desc: "Full console output with timestamps, errors, and object inspection.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-white border border-ink/5 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 text-accent-yellow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
