"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

interface HealthData {
  status: string;
  timestamp: string;
  version?: string;
  build?: {
    version: string;
    hash: string;
    sha: string;
    time: string;
  };
  runtime?: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    node: string;
  };
  env?: string;
}

interface HealthProxyResponse {
  environment: string;
  url: string;
  status: "ok" | "error";
  latency: number;
  data?: HealthData;
  error?: string;
  fetchedAt: string;
}

interface ServiceStatus {
  name: string;
  env: string;
  status: "checking" | "ok" | "error";
  latency?: number;
  data?: HealthData;
  error?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  sha: string;
  url: string;
  createdAt: string;
  duration?: number;
}

interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface PipelineStage {
  name: string;
  status: "success" | "running" | "failed" | "pending";
  url?: string;
  details?: string;
}

interface PipelineData {
  stages: PipelineStage[];
  lastCommit: CommitInfo | null;
  lastDeploy: {
    production: string | null;
    staging: string | null;
  };
  fetchedAt: string;
}

interface BuildJob {
  name: string;
  status: string;
  conclusion: string | null;
  currentStep: string | null;
  totalSteps: number;
  completedSteps: number;
}

interface BuildStatusData {
  run: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    url: string;
    sha: string;
    createdAt: string;
  } | null;
  jobs: BuildJob[];
  fetchedAt: string;
  error?: string;
}

interface VersionStatus {
  mainSha: string;
  mainShortSha: string;
  environments: {
    name: string;
    url: string;
    deployedSha: string;
    deployedVersion: string;
    isCurrent: boolean;
    commitsBehind: number;
  }[];
  deployInProgress: {
    running: boolean;
    sha?: string;
    url?: string;
    startedAt?: string;
  };
  fetchedAt: string;
}

interface CloudflareData {
  requests: { total: number; cached: number; uncached: number };
  bandwidth: { total: number; cached: number };
  threats: number;
  countries: { code: string; requests: number }[];
  fetchedAt: string;
  error?: string;
}

interface DatabaseData {
  status: "ok" | "error" | "unknown";
  provider: string;
  region: string;
  backups: { latest: string | null; count: number };
  links: { console: string; backups: string };
  fetchedAt: string;
  error?: string;
}

// Service configuration with proper branding
const RAILWAY_PROJECT = "https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115";

const SERVICE_CONFIG: Record<string, {
  name: string;
  icon: string;
  color: string;
  url: string;
  railwayUrl?: string;
  description: string;
}> = {
  local: {
    name: "Local Dev",
    icon: "💻",
    color: "from-slate-500 to-slate-600",
    url: "http://localhost:3000",
    description: "Local development server",
  },
  production: {
    name: "Production",
    icon: "🚀",
    color: "from-emerald-500 to-emerald-600",
    url: "https://villa.cash",
    railwayUrl: `${RAILWAY_PROJECT}/service/hub-production`,
    description: "Live production environment",
  },
  construction: {
    name: "Construction",
    icon: "🏗️",
    color: "from-amber-500 to-orange-600",
    url: "https://construction.villa.cash",
    railwayUrl: `${RAILWAY_PROJECT}/service/hub-staging`,
    description: "Staging environment",
  },
  key: {
    name: "Key",
    icon: "🔑",
    color: "from-purple-500 to-purple-600",
    url: "https://key.villa.cash",
    railwayUrl: `${RAILWAY_PROJECT}/service/key-production`,
    description: "Auth & passkey service",
  },
  "fake-key": {
    name: "Fake Key",
    icon: "🔐",
    color: "from-pink-500 to-pink-600",
    url: "https://fake-key.villa.cash",
    railwayUrl: `${RAILWAY_PROJECT}/service/key-staging`,
    description: "Staging auth service",
  },
  docs: {
    name: "Docs",
    icon: "📚",
    color: "from-blue-500 to-indigo-600",
    url: "https://docs.villa.cash",
    railwayUrl: `${RAILWAY_PROJECT}/service/developers`,
    description: "Developer documentation",
  },
};

const ENVIRONMENTS = [
  { name: "Local Hub", env: "local" },
  { name: "Production", env: "production" },
  { name: "Construction", env: "construction" },
  { name: "Key (Production)", env: "key" },
  { name: "Fake Key (Staging)", env: "fake-key" },
  { name: "Docs", env: "docs" },
];

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const Icons = {
  GitCommit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v6m0 6v6" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Terminal: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  GitHub: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  Railway: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.113 10.27A.51.51 0 000 10.595v2.807a.5.5 0 00.5.5h5.443a.5.5 0 00.5-.5v-2.807a.51.51 0 00-.113-.325L3.158 6.5a.5.5 0 00-.816 0L.113 10.27zM17.5 13.902h5.943a.5.5 0 00.444-.27l.057-.11A11.95 11.95 0 0024 10.395c0-1.186-.173-2.33-.493-3.413a.5.5 0 00-.48-.361H17.5a.5.5 0 00-.5.5v6.281a.5.5 0 00.5.5zM6.5 17.379v2.621a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-2.621a.5.5 0 00-.5-.5H7a.5.5 0 00-.5.5zM17 10.121V7.5a.5.5 0 00-.5-.5H7.5a.5.5 0 00-.5.5v2.621a.5.5 0 00.5.5h9a.5.5 0 00.5-.5z" />
    </svg>
  ),
};

function GlassCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl transition-all duration-300",
        onClick && "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  );
}

function StatusIndicator({ status, pulse }: { status: "ok" | "error" | "warning" | "neutral" | "running"; pulse?: boolean }) {
  const colors = {
    ok: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    warning: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    neutral: "bg-slate-500",
    running: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  };

  return (
    <div className={cn("w-2.5 h-2.5 rounded-full", colors[status], pulse && "animate-pulse")} />
  );
}

function PipelineNode({ 
  title, 
  status, 
  icon, 
  details, 
  isActive,
  url,
  secondaryUrl,
  secondaryLabel,
}: { 
  title: string; 
  status: "success" | "running" | "failed" | "pending"; 
  icon: React.ReactNode; 
  details?: string;
  isActive?: boolean;
  url?: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
}) {
  const statusColors = {
    success: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
    running: "border-blue-500/50 text-blue-400 bg-blue-500/10",
    failed: "border-red-500/50 text-red-400 bg-red-500/10",
    pending: "border-white/10 text-slate-500 bg-white/5",
  };

  return (
    <div className="flex flex-col gap-2">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-full hover:scale-105",
          statusColors[status],
          isActive && "ring-2 ring-offset-2 ring-offset-slate-950 ring-blue-500/50"
        )}
      >
        <div className="mb-2 text-2xl">{icon}</div>
        <div className="font-bold text-sm tracking-wide uppercase">{title}</div>
        {details && <div className="text-xs opacity-70 mt-1">{details}</div>}
        {status === "running" && (
          <div className="mt-2 w-full bg-blue-900/30 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
          </div>
        )}
      </a>
      {secondaryUrl && (
        <a 
          href={secondaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-500 hover:text-slate-300 text-center flex items-center justify-center gap-1"
        >
          <Icons.Railway />
          {secondaryLabel || "Railway"}
        </a>
      )}
    </div>
  );
}

function EnvironmentCard({ service, onAction, actionLoading }: { service: ServiceStatus; onAction: (action: string) => void; actionLoading: boolean }) {
  const config = SERVICE_CONFIG[service.env] || SERVICE_CONFIG.local;
  const build = service.data?.build;
  const runtime = service.data?.runtime;
  
  return (
    <GlassCard className="p-5 flex flex-col h-full group relative overflow-hidden">
      {/* Gradient accent */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", config.color)} />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl", config.color)}>
            {config.icon}
          </div>
          <div>
            <a 
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              {config.name}
              <Icons.ExternalLink />
            </a>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>
        </div>
        <StatusIndicator 
          status={service.status === "ok" ? "ok" : service.status === "error" ? "error" : "warning"} 
          pulse={service.status === "checking"} 
        />
      </div>

      <div className="flex-grow space-y-2 mb-4">
        {service.data ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Version</span>
              <span className="font-mono text-slate-200">{build?.version || "unknown"}</span>
            </div>
            {build && build.sha !== "local" && build.sha !== "unknown" && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Commit</span>
                <a 
                  href={`https://github.com/rockfridrich/villa/commit/${build.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-400 hover:text-blue-300"
                >
                  {build.sha.slice(0, 7)}
                </a>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Latency</span>
              <span className={cn(
                "font-mono",
                (service.latency || 0) < 200 ? "text-emerald-400" : 
                (service.latency || 0) < 500 ? "text-amber-400" : "text-red-400"
              )}>
                {service.latency}ms
              </span>
            </div>
            {runtime && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Uptime</span>
                <span className="font-mono text-slate-200">{formatUptime(runtime.uptime)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-20 text-slate-600 text-sm italic">
            {service.status === "checking" ? "Checking..." : service.error || "Offline"}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition"
        >
          <Icons.ExternalLink />
          Open
        </a>
        {config.railwayUrl && (
          <a
            href={config.railwayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition"
          >
            <Icons.Railway />
            Railway
          </a>
        )}
        {service.env === "local" && (
          <button
            onClick={() => onAction("launch-local")}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-lg text-xs text-white transition"
          >
            <Icons.Terminal />
            {service.status === "ok" ? "Restart" : "Launch"}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

export default function TelemetryDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(
    ENVIRONMENTS.map((e) => ({ ...e, status: "checking" as const })),
  );
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [buildStatus, setBuildStatus] = useState<BuildStatusData | null>(null);
  const [versionStatus, setVersionStatus] = useState<VersionStatus | null>(null);
  const [cloudflare, setCloudflare] = useState<CloudflareData | null>(null);
  const [database, setDatabase] = useState<DatabaseData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const checkServices = useCallback(async () => {
    const results = await Promise.all(
      ENVIRONMENTS.map(async (env) => {
        try {
          const res = await fetch(`/api/health/${env.env}`, { cache: "no-store" });
          if (!res.ok) {
            return { ...env, status: "error" as const, error: `HTTP ${res.status}` };
          }
          const data: HealthProxyResponse = await res.json();
          if (data.status === "error") {
            return { ...env, status: "error" as const, latency: data.latency, error: data.error };
          }
          return { ...env, status: "ok" as const, latency: data.latency, data: data.data };
        } catch (err) {
          return { ...env, status: "error" as const, error: err instanceof Error ? err.message : "Unknown error" };
        }
      }),
    );
    setServices(results);
    setLastRefresh(new Date());
  }, []);

  const executeAction = useCallback(
    async (action: string) => {
      setActionLoading(true);
      setActionMessage(null);
      try {
        const res = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (data.success) {
          setActionMessage({ type: "success", text: `${action} completed` });
          setTimeout(() => { checkServices(); setActionMessage(null); }, 3000);
        } else {
          setActionMessage({ type: "error", text: data.error || "Action failed" });
        }
      } catch (err) {
        setActionMessage({ type: "error", text: err instanceof Error ? err.message : "Action failed" });
      } finally {
        setActionLoading(false);
      }
    },
    [checkServices],
  );

  const fetchGitHubData = useCallback(async () => {
    try {
      const [pipelineRes, actionsRes, commitsRes, buildRes, versionRes, cfRes, dbRes] = await Promise.allSettled([
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/github/actions").then((r) => r.json()),
        fetch("/api/github/commits").then((r) => r.json()),
        fetch("/api/build-status").then((r) => r.json()),
        fetch("/api/version-status").then((r) => r.json()),
        fetch("/api/cloudflare").then((r) => r.json()),
        fetch("/api/database").then((r) => r.json()),
      ]);
      if (pipelineRes.status === "fulfilled" && !pipelineRes.value.error) setPipeline(pipelineRes.value);
      if (actionsRes.status === "fulfilled" && actionsRes.value.runs) setWorkflowRuns(actionsRes.value.runs);
      if (commitsRes.status === "fulfilled" && commitsRes.value.commits) setCommits(commitsRes.value.commits);
      if (buildRes.status === "fulfilled" && !buildRes.value.error) setBuildStatus(buildRes.value);
      if (versionRes.status === "fulfilled" && !versionRes.value.error) setVersionStatus(versionRes.value);
      if (cfRes.status === "fulfilled") setCloudflare(cfRes.value);
      if (dbRes.status === "fulfilled") setDatabase(dbRes.value);
    } catch {}
  }, []);

  useEffect(() => {
    checkServices();
    fetchGitHubData();
    const serviceInterval = setInterval(checkServices, 30000);
    const githubInterval = setInterval(fetchGitHubData, 60000);
    return () => { clearInterval(serviceInterval); clearInterval(githubInterval); };
  }, [checkServices, fetchGitHubData]);

  const getStageStatus = (id: string): "success" | "running" | "failed" | "pending" => {
    if (!pipeline) return "pending";
    if (id === "local") return "success";
    if (id === "ci") {
      const ci = pipeline.stages.find((s) => s.name === "CI");
      return ci?.status || "pending";
    }
    const stage = pipeline.stages.find((s) => s.name.toLowerCase() === id);
    return stage?.status || "pending";
  };

  const onlineCount = services.filter(s => s.status === "ok").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              V
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight">Villa Telemetry</h1>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {onlineCount}/{services.length} Services Online
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/rockfridrich/villa"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <Icons.GitHub />
            </a>
            <div className="text-xs text-slate-500 font-mono">
              {lastRefresh ? lastRefresh.toLocaleTimeString() : "--:--:--"}
            </div>
            <button
              onClick={() => { checkServices(); fetchGitHubData(); }}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Toast */}
        {actionMessage && (
          <div className={cn(
            "fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3",
            actionMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {actionMessage.type === "success" ? <Icons.Check /> : <Icons.Alert />}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
        )}

        {/* Deploy in Progress Banner */}
        {versionStatus?.deployInProgress.running && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-medium text-blue-400">Deploy in progress</span>
              <span className="text-slate-400">•</span>
              <code className="text-sm font-mono text-slate-300">{versionStatus.deployInProgress.sha}</code>
            </div>
            <a
              href={versionStatus.deployInProgress.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View on GitHub <Icons.ExternalLink />
            </a>
          </div>
        )}

        {/* Pipeline */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Delivery Pipeline</h2>
            <a 
              href="https://github.com/rockfridrich/villa/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
            >
              View all workflows <Icons.ExternalLink />
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 -z-10 -translate-y-1/2" />
            
            <PipelineNode 
              title="Code" 
              status="success" 
              icon="💻" 
              details="Local Dev"
              url="https://github.com/rockfridrich/villa"
            />
            <PipelineNode 
              title="CI/CD" 
              status={getStageStatus("ci")} 
              icon="⚙️" 
              details="GitHub Actions" 
              isActive={getStageStatus("ci") === "running"}
              url="https://github.com/rockfridrich/villa/actions"
            />
            <PipelineNode 
              title="Staging" 
              status={getStageStatus("construction")} 
              icon="🏗️" 
              details="construction.villa.cash"
              url="https://construction.villa.cash"
              secondaryUrl="https://railway.app/dashboard"
              secondaryLabel="Railway Dashboard"
            />
            <PipelineNode 
              title="Production" 
              status={getStageStatus("production")} 
              icon="🚀" 
              details="villa.cash"
              url="https://villa.cash"
              secondaryUrl="https://railway.app/dashboard"
              secondaryLabel="Railway Dashboard"
            />
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Environments */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-white">Environments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <EnvironmentCard 
                  key={service.name} 
                  service={service} 
                  onAction={executeAction}
                  actionLoading={actionLoading}
                />
              ))}
            </div>

            {/* Version Status */}
            {versionStatus && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Version Sync</h3>
                  <a
                    href={`https://github.com/rockfridrich/villa/commit/${versionStatus.mainSha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-slate-400">main:</span>
                    <code className="bg-white/10 px-2 py-0.5 rounded text-blue-400 font-mono hover:text-blue-300">
                      {versionStatus.mainShortSha}
                    </code>
                  </a>
                </div>
                <div className="space-y-2">
                  {versionStatus.environments.map((env) => (
                    <div key={env.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={env.isCurrent ? "ok" : env.deployedSha === "static" ? "neutral" : "warning"} />
                        <a href={env.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-200 hover:text-blue-400 flex items-center gap-1.5">
                          {env.name}
                          <Icons.ExternalLink />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {env.deployedSha !== "static" && env.deployedSha !== "local" && env.deployedSha !== "error" ? (
                          <a
                            href={`https://github.com/rockfridrich/villa/commit/${env.deployedSha}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-slate-400 hover:text-blue-400"
                          >
                            {env.deployedSha.slice(0, 7)}
                          </a>
                        ) : (
                          <span className="font-mono text-slate-500">{env.deployedSha}</span>
                        )}
                        {env.isCurrent && <span className="text-emerald-400 font-medium">✓ Current</span>}
                        {!env.isCurrent && env.commitsBehind > 0 && (
                          <span className="text-amber-400 font-medium">{env.commitsBehind} behind</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => executeAction("deploy-construction")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition"
                >
                  🏗️ Deploy to Staging
                </button>
                
                <button
                  onClick={() => executeAction("run-e2e")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-200 transition"
                >
                  <span>🧪 Run E2E Tests</span>
                  <Icons.Play />
                </button>

                <button
                  onClick={() => executeAction("launch-docker")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-200 transition"
                >
                  <span>🐳 Launch Docker</span>
                  <Icons.Terminal />
                </button>

                <button
                  onClick={() => executeAction("verify-deployments")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-200 transition"
                >
                  <span>✅ Verify All</span>
                  <Icons.Check />
                </button>
              </div>
            </GlassCard>

            {/* Live Activity */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h3>
                <a
                  href="https://github.com/rockfridrich/villa/commits/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  View all
                </a>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {buildStatus?.run && (
                  <a
                    href={buildStatus.run.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border-b border-white/5 bg-blue-500/5 hover:bg-blue-500/10 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-400 uppercase">Build</span>
                      <StatusIndicator status={buildStatus.run.status === "in_progress" ? "running" : buildStatus.run.conclusion === "success" ? "ok" : "error"} pulse={buildStatus.run.status === "in_progress"} />
                    </div>
                    <div className="text-sm font-medium text-slate-200">{buildStatus.run.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{formatRelativeTime(buildStatus.run.createdAt)}</div>
                  </a>
                )}

                {commits.slice(0, 8).map((commit) => (
                  <a
                    key={commit.sha}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-slate-500"><Icons.GitCommit /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">{commit.message}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <code className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{commit.shortSha}</code>
                          <span>•</span>
                          <span className="truncate">{commit.author}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(commit.date)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </GlassCard>

            {/* Cloudflare Traffic */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Traffic (24h)</h3>
                <a
                  href="https://dash.cloudflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  Cloudflare <Icons.ExternalLink />
                </a>
              </div>
              {cloudflare ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Requests</span>
                    <span className="font-mono text-white">{cloudflare.requests.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Cache Hit</span>
                    <span className="font-mono text-emerald-400">
                      {cloudflare.requests.total > 0 
                        ? Math.round((cloudflare.requests.cached / cloudflare.requests.total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Bandwidth</span>
                    <span className="font-mono text-white">
                      {(cloudflare.bandwidth.total / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  {cloudflare.threats > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Threats Blocked</span>
                      <span className="font-mono text-red-400">{cloudflare.threats}</span>
                    </div>
                  )}
                  {cloudflare.error && (
                    <div className="text-xs text-amber-400">{cloudflare.error}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">Loading...</div>
              )}
            </GlassCard>

            {/* Database */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Database</h3>
                {database?.links.console && (
                  <a
                    href={database.links.console}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {database.provider} <Icons.ExternalLink />
                  </a>
                )}
              </div>
              {database ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Status</span>
                    <span className={cn("font-medium", database.status === "ok" ? "text-emerald-400" : "text-amber-400")}>
                      {database.status === "ok" ? "Connected" : database.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Provider</span>
                    <span className="text-white">{database.provider}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Region</span>
                    <span className="text-slate-300">{database.region}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Backups</span>
                    <span className="text-slate-300">
                      {database.backups.count > 0 
                        ? `${database.backups.count} (latest: ${database.backups.latest})`
                        : "None found"}
                    </span>
                  </div>
                  <button
                    onClick={() => executeAction("backup-db")}
                    disabled={actionLoading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-200 transition"
                  >
                    💾 Create Backup
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">Loading...</div>
              )}
            </GlassCard>

            {/* Links */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <a href="https://github.com/rockfridrich/villa" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <Icons.GitHub /> Repository
                </a>
                <a href="https://github.com/rockfridrich/villa/pulls" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <Icons.GitCommit /> Pull Requests
                </a>
                <a href={RAILWAY_PROJECT} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <Icons.Railway /> Railway
                </a>
                <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  ☁️ Cloudflare
                </a>
                <a href="https://cloud.digitalocean.com/databases" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  🗄️ Database
                </a>
                <a href="https://github.com/rockfridrich/villa/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <Icons.Alert /> Issues
                </a>
              </div>
            </GlassCard>

          </div>
        </div>
      </main>
    </div>
  );
}
