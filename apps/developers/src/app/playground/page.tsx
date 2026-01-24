"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Trash2, User, LogOut, Settings, Globe, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { villa, type VillaUser } from "@rockfridrich/villa-sdk";

interface LogEntry {
  id: number;
  timestamp: Date;
  type: "info" | "success" | "error" | "warn";
  method: string;
  args?: unknown[];
  result?: unknown;
  duration?: number;
}

const EXAMPLES = {
  "sign-in": {
    title: "Sign In",
    description: "Authenticate with passkey",
    code: `// Sign in with Villa passkey
const user = await villa.signIn()

console.log('Welcome!', user.nickname)
console.log('Address:', user.address)
console.log('Avatar:', user.avatar)`,
    run: async (addLog: (e: Omit<LogEntry, "id" | "timestamp">) => number, updateLog: (id: number, u: Partial<LogEntry>) => void) => {
      const start = Date.now();
      const logId = addLog({ type: "info", method: "villa.signIn()" });
      try {
        const user = await villa.signIn();
        updateLog(logId, {
          type: "success",
          result: { nickname: user.nickname, address: user.address },
          duration: Date.now() - start,
        });
        return user;
      } catch (err) {
        updateLog(logId, {
          type: "error",
          result: err instanceof Error ? err.message : "Unknown error",
          duration: Date.now() - start,
        });
        throw err;
      }
    },
  },
  "get-user": {
    title: "Get User",
    description: "Check current session",
    code: `// Get current user (from localStorage)
const user = villa.user

if (user) {
  console.log('Signed in as:', user.nickname)
  console.log('Address:', user.address)
} else {
  console.log('Not signed in')
}`,
    run: async (addLog: (e: Omit<LogEntry, "id" | "timestamp">) => number) => {
      const user = villa.user;
      addLog({
        type: user ? "success" : "warn",
        method: "villa.user",
        result: user ? { nickname: user.nickname, address: user.address } : "Not signed in",
      });
      return user;
    },
  },
  "sign-out": {
    title: "Sign Out",
    description: "Clear session",
    code: `// Sign out and clear session
villa.signOut()

console.log('Signed out')
console.log('User:', villa.user) // null`,
    run: async (addLog: (e: Omit<LogEntry, "id" | "timestamp">) => number) => {
      villa.signOut();
      addLog({
        type: "success",
        method: "villa.signOut()",
        result: "Session cleared",
      });
      return null;
    },
  },
  "settings": {
    title: "Settings",
    description: "Open profile settings",
    code: `// Open settings modal (requires sign-in)
const result = await villa.settings()

if (result.loggedOut) {
  console.log('User logged out from settings')
} else {
  console.log('Settings updated:', result)
}`,
    run: async (addLog: (e: Omit<LogEntry, "id" | "timestamp">) => number, updateLog: (id: number, u: Partial<LogEntry>) => void) => {
      const start = Date.now();
      const logId = addLog({ type: "info", method: "villa.settings()" });
      try {
        const result = await villa.settings();
        updateLog(logId, {
          type: "success",
          result,
          duration: Date.now() - start,
        });
        return result;
      } catch (err) {
        updateLog(logId, {
          type: "error",
          result: err instanceof Error ? err.message : "Unknown error",
          duration: Date.now() - start,
        });
        throw err;
      }
    },
  },
  "auth-change": {
    title: "Auth Listener",
    description: "Subscribe to auth changes",
    code: `// Listen for auth state changes
const unsubscribe = villa.onAuthChange((user) => {
  if (user) {
    console.log('User signed in:', user.nickname)
  } else {
    console.log('User signed out')
  }
})

// Later: unsubscribe()`,
    run: async (addLog: (e: Omit<LogEntry, "id" | "timestamp">) => number) => {
      addLog({
        type: "info",
        method: "villa.onAuthChange(callback)",
        result: "Listener registered - sign in/out to see events",
      });
      return null;
    },
  },
} as const;

type ExampleKey = keyof typeof EXAMPLES;

export default function PlaygroundPage() {
  const [selectedExample, setSelectedExample] = useState<ExampleKey>("sign-in");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<VillaUser | null>(null);
  const [copied, setCopied] = useState(false);
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const unsubscribe = villa.onAuthChange((u) => {
      setUser(u);
      if (logs.length > 0) {
        addLog({
          type: u ? "success" : "warn",
          method: "onAuthChange",
          result: u ? { nickname: u.nickname, address: u.address } : "Signed out",
        });
      }
    });
    return unsubscribe;
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const newLog: LogEntry = {
      ...entry,
      id: logIdRef.current++,
      timestamp: new Date(),
    };
    setLogs((prev) => [...prev, newLog]);
    return newLog.id;
  }, []);

  const updateLog = useCallback((id: number, updates: Partial<LogEntry>) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logIdRef.current = 0;
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    try {
      const example = EXAMPLES[selectedExample];
      await example.run(addLog, updateLog);
    } catch {
    } finally {
      setIsRunning(false);
    }
  }, [selectedExample, addLog, updateLog]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(EXAMPLES[selectedExample].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedExample]);

  const currentExample = EXAMPLES[selectedExample];

  return (
    <div className="min-h-screen">
      <section className="py-8">
        <div className="max-w-6xl mx-auto space-y-2">
          <h1 className="font-serif text-4xl tracking-tight">SDK Playground</h1>
          <p className="text-ink-muted">
            Test Villa SDK methods directly. Real passkey authentication on Base Sepolia.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-6xl mx-auto">
          {user && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="font-medium text-green-900">@{user.nickname}</p>
                <p className="text-xs text-green-700 font-mono">{user.address}</p>
              </div>
              <button
                onClick={() => villa.signOut()}
                className="p-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(EXAMPLES) as ExampleKey[]).map((key) => {
                  const ex = EXAMPLES[key];
                  const Icon = key === "sign-in" ? User : key === "sign-out" ? LogOut : key === "settings" ? Settings : Globe;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedExample(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedExample === key
                          ? "bg-accent-yellow text-ink"
                          : "bg-cream-100 text-ink-muted hover:bg-cream-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {ex.title}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  </button>
                </div>
                <div className="bg-[#282c34] rounded-lg overflow-hidden border border-ink/10">
                  <div className="px-4 py-2 border-b border-ink/10 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{currentExample.description}</span>
                  </div>
                  <SyntaxHighlighter
                    language="typescript"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "0.875rem",
                      lineHeight: "1.6",
                      backgroundColor: "transparent",
                      minHeight: "200px",
                    }}
                  >
                    {currentExample.code}
                  </SyntaxHighlighter>
                </div>
              </div>

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 bg-accent-yellow text-ink font-medium px-4 py-3 rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isRunning ? "Running..." : "Run"}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink-muted">Console</h2>
                <button
                  onClick={clearLogs}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>

              <div className="bg-[#1e1e1e] rounded-lg border border-ink/10 min-h-[400px] max-h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-neutral-500 text-sm">
                    Click Run to execute SDK method
                  </div>
                ) : (
                  <div className="p-3 space-y-2 font-mono text-sm">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-2 rounded ${
                          log.type === "error"
                            ? "bg-red-900/30 border-l-2 border-red-500"
                            : log.type === "success"
                            ? "bg-green-900/30 border-l-2 border-green-500"
                            : log.type === "warn"
                            ? "bg-yellow-900/30 border-l-2 border-yellow-500"
                            : "bg-neutral-800/50 border-l-2 border-neutral-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                          <span>{log.timestamp.toLocaleTimeString()}</span>
                          {log.duration !== undefined && (
                            <span className="px-1.5 py-0.5 bg-neutral-700 rounded">{log.duration}ms</span>
                          )}
                        </div>
                        <div className="text-blue-400">{log.method}</div>
                        {log.result !== undefined && (
                          <pre className="mt-1 text-xs text-neutral-300 overflow-x-auto">
                            {typeof log.result === "string" ? log.result : JSON.stringify(log.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-cream-100 border border-ink/5 rounded-lg">
            <h3 className="font-medium mb-2">How it works</h3>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>SDK opens popup to <code className="px-1 bg-cream-200 rounded">key.villa.cash/auth</code></li>
              <li>User authenticates with device passkey (FaceID/TouchID)</li>
              <li>Identity returned via postMessage, stored in localStorage</li>
              <li>Session persists for 7 days</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
