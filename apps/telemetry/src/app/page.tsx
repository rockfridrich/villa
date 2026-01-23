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

const ENVIRONMENTS = [
  { name: "Local Hub", env: "local" },
  { name: "Production", env: "production" },
  { name: "Construction", env: "construction" },
  { name: "Key (Production)", env: "key" },
  { name: "Fake Key (Staging)", env: "fake-key" },
  { name: "Docs", env: "docs" },
];

""

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
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

""

const Icons = {
  GitCommit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
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
  Play: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Server: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
};

""

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
    <div className={cn("w-2 h-2 rounded-full", colors[status], pulse && "animate-pulse")} />
  );
}

function PipelineNode({ 
  title, 
  status, 
  icon, 
  details, 
  isActive,
  url 
}: { 
  title: string; 
  status: "success" | "running" | "failed" | "pending"; 
  icon: React.ReactNode; 
  details?: string;
  isActive?: boolean;
  url?: string;
}) {
  const statusColors = {
    success: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
    running: "border-blue-500/50 text-blue-400 bg-blue-500/10",
    failed: "border-red-500/50 text-red-400 bg-red-500/10",
    pending: "border-white/5 text-slate-500 bg-white/5",
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-full",
      statusColors[status],
      isActive && "ring-2 ring-offset-2 ring-offset-slate-950 ring-blue-500/50"
    )}>
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="font-bold text-sm tracking-wide uppercase">{title}</div>
      {details && <div className="text-xs opacity-70 mt-1">{details}</div>}
      {status === "running" && (
        <div className="mt-2 w-full bg-blue-900/30 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[progress_1s_ease-in-out_infinite]" style={{ width: "50%" }} />
        </div>
      )}
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full hover:scale-105 transition-transform">
        {content}
      </a>
    );
  }

  return <div className="w-full">{content}</div>;
}

function EnvironmentCard({ service, onAction }: { service: ServiceStatus; onAction: (action: string) => void }) {
  const build = service.data?.build;
  const runtime = service.data?.runtime;
  
  return (
    <GlassCard className="p-5 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {service.name}
          </h3>
          <a 
            href={service.env === "local" ? "http://localhost:3000" : `https://${service.env === "production" ? "" : service.env + "."}villa.cash`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 font-mono mt-1 block"
          >
            {service.env}
          </a>
        </div>
        <StatusIndicator 
          status={service.status === "ok" ? "ok" : service.status === "error" ? "error" : "warning"} 
          pulse={service.status === "checking"} 
        />
      </div>

      <div className="flex-grow space-y-3">
        {service.data ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Version</span>
              <span className="font-mono text-slate-200">{build?.version || "v0.0.0"}</span>
            </div>
            {build && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Commit</span>
                <span className="font-mono text-slate-200">{build.sha.slice(0, 7)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Latency</span>
              <span className={cn(
                "font-mono",
                (service.latency || 0) < 200 ? "text-emerald-400" : "text-amber-400"
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
            {service.status === "checking" ? "Polling..." : "Offline"}
          </div>
        )}
      </div>

      {service.env === "local" && service.status === "error" && (
        <button 
          onClick={() => onAction("launch-local")}
          className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
        >
          Launch Dev Server
        </button>
      )}
    </GlassCard>
  );
}

export default function TelemetryDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(
    ENVIRONMENTS.map((e) => ({ ...e, status: "checking" as const })),
  );
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [buildStatus, setBuildStatus] = useState<BuildStatusData | null>(null);
  const [versionStatus, setVersionStatus] = useState<VersionStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  ""
  const checkServices = useCallback(async () => {
    const results = await Promise.all(
      ENVIRONMENTS.map(async (env) => {
        try {
          const res = await fetch(`/api/health/${env.env}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            return {
              ...env,
              status: "error" as const,
              error: `HTTP ${res.status}`,
            };
          }

          const data: HealthProxyResponse = await res.json();

          if (data.status === "error") {
            return {
              ...env,
              status: "error" as const,
              latency: data.latency,
              error: data.error,
            };
          }

          return {
            ...env,
            status: "ok" as const,
            latency: data.latency,
            data: data.data,
          };
        } catch (err) {
          return {
            ...env,
            status: "error" as const,
            error: err instanceof Error ? err.message : "Unknown error",
          };
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
          setActionMessage({
            type: "success",
            text: `${action} started successfully`,
          });
          setTimeout(() => {
            checkServices();
            setActionMessage(null);
          }, 3000);
        } else {
          setActionMessage({
            type: "error",
            text: data.error || "Action failed",
          });
        }
      } catch (err) {
        setActionMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Action failed",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [checkServices],
  );

  const fetchGitHubData = useCallback(async () => {
    try {
      const [pipelineRes, actionsRes, commitsRes, buildRes, versionRes] =
        await Promise.allSettled([
          fetch("/api/pipeline").then((r) => r.json()),
          fetch("/api/github/actions").then((r) => r.json()),
          fetch("/api/github/commits").then((r) => r.json()),
          fetch("/api/build-status").then((r) => r.json()),
          fetch("/api/version-status").then((r) => r.json()),
        ]);

      if (pipelineRes.status === "fulfilled" && !pipelineRes.value.error) {
        setPipeline(pipelineRes.value);
      }

      if (actionsRes.status === "fulfilled" && actionsRes.value.runs) {
        setWorkflowRuns(actionsRes.value.runs);
      }

      if (commitsRes.status === "fulfilled" && commitsRes.value.commits) {
        setCommits(commitsRes.value.commits);
      }

      if (buildRes.status === "fulfilled" && !buildRes.value.error) {
        setBuildStatus(buildRes.value);
      }

      if (versionRes.status === "fulfilled" && !versionRes.value.error) {
        setVersionStatus(versionRes.value);
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkServices();
    fetchGitHubData();
    const serviceInterval = setInterval(checkServices, 30000);
    const githubInterval = setInterval(fetchGitHubData, 60000);
    return () => {
      clearInterval(serviceInterval);
      clearInterval(githubInterval);
    };
  }, [checkServices, fetchGitHubData]);

  ""

  const getStageStatus = (id: string): "success" | "running" | "failed" | "pending" => {
    if (!pipeline) return "pending";
    if (id === "local") return "success"; ""
    if (id === "ci") {
       const ci = pipeline.stages.find((s) => s.name === "CI");
       return ci?.status || "pending";
    }
    const stage = pipeline.stages.find((s) => s.name.toLowerCase() === id);
    return stage?.status || "pending";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10" />
      
      ""
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              V
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight">Villa Telemetry</h1>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ops Dashboard</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-mono">
              Last update: {lastRefresh ? lastRefresh.toLocaleTimeString() : "--:--:--"}
            </div>
            <button
              onClick={() => {
                checkServices();
                fetchGitHubData();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Refresh Data"
            >
              <Icons.Refresh />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        ""
        {actionMessage && (
          <div className={cn(
            "fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5",
            actionMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {actionMessage.type === "success" ? <Icons.Check /> : <Icons.Alert />}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
        )}

        ""
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Delivery Pipeline</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            ""
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -z-10 -translate-y-1/2" />
            
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
              icon="🚧" 
              details="Construction"
              url="https://construction.villa.cash"
            />
            <PipelineNode 
              title="Production" 
              status={getStageStatus("production")} 
              icon="🚀" 
              details="villa.cash"
              url="https://villa.cash"
            />
          </div>
        </section>

        ""
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          ""
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Environments</h2>
              <div className="text-xs text-slate-500">
                {services.filter(s => s.status === "ok").length}/{services.length} Online
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <EnvironmentCard 
                  key={service.name} 
                  service={service} 
                  onAction={executeAction} 
                />
              ))}
            </div>

            ""
            {versionStatus && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white">Version Control</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Main:</span>
                    <code className="bg-white/10 px-2 py-0.5 rounded text-blue-400 font-mono">{versionStatus.mainShortSha}</code>
                  </div>
                </div>

                <div className="space-y-3">
                  {versionStatus.environments.map((env) => (
                    <div key={env.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={env.isCurrent ? "ok" : "warning"} />
                        <span className="text-sm font-medium text-slate-200">{env.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                         <span className="font-mono text-slate-400">{env.deployedSha === "static" ? "STATIC" : env.deployedSha.slice(0, 7)}</span>
                         {!env.isCurrent && env.commitsBehind > 0 && (
                           <span className="text-amber-400 font-medium">{env.commitsBehind} behind</span>
                         )}
                         {env.isCurrent && <span className="text-emerald-500 font-medium">Up to date</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          ""
          <div className="space-y-6">
            
            ""
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => executeAction("deploy-construction")}
                  disabled={actionLoading}
                  className="w-full group relative overflow-hidden rounded-lg bg-blue-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-slate-900">
                    🏗️ Deploy to Construction
                  </span>
                </button>
                
                <button
                   onClick={() => executeAction("run-e2e")}
                   disabled={actionLoading}
                   className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-200 transition"
                >
                  <span>🧪 Run E2E Tests</span>
                  <Icons.Play />
                </button>

                <button
                   onClick={() => executeAction("backup-db")}
                   disabled={actionLoading}
                   className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-200 transition"
                >
                  <span>💾 Backup Database</span>
                  <Icons.Server />
                </button>
              </div>
            </GlassCard>

            ""
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Activity</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                ""
                {buildStatus?.run && (
                  <div className="p-4 border-b border-white/5 bg-blue-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-400 uppercase">Current Build</span>
                      <StatusIndicator status={buildStatus.run.status === "in_progress" ? "running" : "neutral"} pulse />
                    </div>
                    <div className="text-sm font-medium text-slate-200 mb-1">{buildStatus.run.name}</div>
                    <div className="text-xs text-slate-500">{formatRelativeTime(buildStatus.run.createdAt)}</div>
                  </div>
                )}

                ""
                {commits.slice(0, 5).map((commit) => (
                  <div key={commit.sha} className="p-4 border-b border-white/5 hover:bg-white/5 transition">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-slate-500"><Icons.GitCommit /></div>
                      <div>
                        <a href={commit.url} target="_blank" className="text-sm font-medium text-slate-200 hover:text-blue-400 transition block">
                          {commit.message}
                        </a>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{commit.shortSha}</span>
                          <span>•</span>
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(commit.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        </div>
      </main>
    </div>
  );
}
