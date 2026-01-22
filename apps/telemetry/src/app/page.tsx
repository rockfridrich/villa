"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";

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

const ENVIRONMENTS = [
  { name: "Local Hub", env: "local" },
  { name: "Production", env: "production" },
  { name: "Construction", env: "construction" },
  { name: "Key (Production)", env: "key" },
  { name: "Fake Key (Staging)", env: "fake-key" },
  { name: "Docs", env: "docs" },
];

function StatusBadge({ status }: { status: ServiceStatus["status"] }) {
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-medium",
        status === "checking" && "bg-yellow-100 text-yellow-800",
        status === "ok" && "bg-green-100 text-green-800",
        status === "error" && "bg-red-100 text-red-800",
      )}
    >
      {status === "checking" ? "..." : status.toUpperCase()}
    </span>
  );
}

function PipelineStatusBadge({ status }: { status: PipelineStage["status"] }) {
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-medium",
        status === "pending" && "bg-gray-100 text-gray-800",
        status === "running" && "bg-blue-100 text-blue-800",
        status === "success" && "bg-green-100 text-green-800",
        status === "failed" && "bg-red-100 text-red-800",
      )}
    >
      {status.toUpperCase()}
    </span>
  );
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

function LaunchButtons({
  onAction,
  loading,
}: {
  onAction: (action: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100">
      <button
        onClick={() => onAction("launch-local")}
        disabled={loading}
        className="flex-1 px-3 py-1.5 text-xs font-medium bg-ink text-cream rounded hover:bg-ink/90 transition disabled:opacity-50"
      >
        {loading ? "Starting..." : "Launch Dev"}
      </button>
      <button
        onClick={() => onAction("launch-docker")}
        disabled={loading}
        className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Starting..." : "Launch Docker"}
      </button>
    </div>
  );
}

function ServiceCard({
  service,
  onAction,
  actionLoading,
}: {
  service: ServiceStatus;
  onAction?: (action: string) => void;
  actionLoading?: boolean;
}) {
  const build = service.data?.build;
  const runtime = service.data?.runtime;
  const version = build?.version || service.data?.version || "unknown";
  const isLocal = service.env === "local";

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-ink">{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>

      {service.status === "ok" && service.data && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-mono">{version}</span>
            </div>
            {build && (
              <div>
                <span className="text-gray-500">Hash:</span>
                <span className="ml-2 font-mono text-xs">{build.hash}</span>
              </div>
            )}
          </div>

          {build && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">SHA:</span>
                <span className="ml-2 font-mono text-xs">
                  {build.sha.slice(0, 7)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Env:</span>
                <span className="ml-2">{service.data?.env || "unknown"}</span>
              </div>
            </div>
          )}

          {runtime && (
            <div className="pt-2 border-t border-neutral-100">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Uptime:</span>
                  <span className="ml-1">{formatUptime(runtime.uptime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Memory:</span>
                  <span className="ml-1">{runtime.memory.heapUsed}MB</span>
                </div>
                <div>
                  <span className="text-gray-500">Latency:</span>
                  <span className="ml-1">{service.latency}ms</span>
                </div>
              </div>
            </div>
          )}

          {build?.time && (
            <div className="text-xs text-gray-500 pt-1">
              Built: {build.time}
            </div>
          )}
        </div>
      )}

      {service.status === "error" && (
        <div className="space-y-2">
          <div className="text-sm text-red-600">{service.error}</div>
          {isLocal && onAction && (
            <LaunchButtons
              onAction={onAction}
              loading={actionLoading || false}
            />
          )}
        </div>
      )}

      {service.status === "checking" && (
        <div className="text-sm text-gray-500">Checking...</div>
      )}
    </div>
  );
}

function BuildComparison({ services }: { services: ServiceStatus[] }) {
  const builds = services
    .filter((s) => s.status === "ok" && s.data)
    .map((s) => ({
      name: s.name,
      hash: s.data?.build?.hash || "n/a",
      sha: s.data?.build?.sha || "n/a",
      version: s.data?.build?.version || s.data?.version || "unknown",
    }));

  if (builds.length < 2) return null;

  const allSameHash = builds.every(
    (b) => b.hash === builds[0].hash || b.hash === "n/a",
  );
  const allSameSha = builds.every(
    (b) => b.sha === builds[0].sha || b.sha === "n/a",
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">Build Comparison</h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-3 h-3 rounded-full",
              allSameHash ? "bg-green-500" : "bg-yellow-500",
            )}
          />
          <span className="text-sm">
            {allSameHash
              ? "All builds have same content hash"
              : "Content hash mismatch detected"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-3 h-3 rounded-full",
              allSameSha ? "bg-green-500" : "bg-yellow-500",
            )}
          />
          <span className="text-sm">
            {allSameSha
              ? "All builds from same commit"
              : "Different commits deployed"}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1">Environment</th>
              <th className="text-left py-1">Version</th>
              <th className="text-left py-1">Hash</th>
              <th className="text-left py-1">SHA</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {builds.map((b) => (
              <tr key={b.name}>
                <td className="py-1">{b.name}</td>
                <td className="py-1">{b.version}</td>
                <td className="py-1">{b.hash}</td>
                <td className="py-1">{b.sha.slice(0, 7)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineCard({ pipeline }: { pipeline: PipelineData | null }) {
  const workflowStages = [
    {
      id: "local",
      name: "Local",
      description: "bun dev + verify",
      trigger: "manual",
      icon: "💻",
    },
    {
      id: "pr",
      name: "PR",
      description: "CI checks",
      trigger: "auto",
      icon: "🔍",
    },
    {
      id: "construction",
      name: "Construction",
      description: "construction.villa.cash",
      trigger: "auto",
      icon: "🏗️",
    },
    {
      id: "production",
      name: "Production",
      description: "villa.cash",
      trigger: "manual",
      icon: "🚀",
    },
  ];

  const getStageStatus = (
    stageId: string,
  ): "success" | "running" | "failed" | "pending" => {
    if (!pipeline) return "pending";
    const stage = pipeline.stages.find(
      (s) => s.name.toLowerCase() === stageId || s.name === stageId,
    );
    if (stage) return stage.status;
    if (stageId === "local") return "pending";
    if (stageId === "pr") {
      const ci = pipeline.stages.find((s) => s.name === "CI");
      return ci?.status || "pending";
    }
    return "pending";
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink">Deployment Pipeline</h3>
        <span className="text-xs text-gray-400">
          Local → PR → Staging → Production
        </span>
      </div>

      <div className="flex items-stretch gap-1 mb-4">
        {workflowStages.map((stage, idx) => {
          const status = getStageStatus(stage.id);
          const isActive = status === "running";
          const isSuccess = status === "success";
          const isFailed = status === "failed";

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div
                className={clsx(
                  "flex-1 p-3 rounded-lg border-2 transition-all",
                  isActive && "border-blue-400 bg-blue-50 animate-pulse",
                  isSuccess && "border-green-400 bg-green-50",
                  isFailed && "border-red-400 bg-red-50",
                  !isActive &&
                    !isSuccess &&
                    !isFailed &&
                    "border-gray-200 bg-gray-50",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stage.icon}</span>
                  <span className="font-medium text-sm">{stage.name}</span>
                  {stage.trigger === "manual" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                      manual
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{stage.description}</p>
                <div className="mt-2">
                  <PipelineStatusBadge status={status} />
                </div>
              </div>
              {idx < workflowStages.length - 1 && (
                <div className="px-1 text-gray-300 text-lg">→</div>
              )}
            </div>
          );
        })}
      </div>

      {pipeline?.lastCommit && (
        <div className="text-xs border-t border-neutral-100 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">Latest:</span>
            <a
              href={pipeline.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:underline"
            >
              {pipeline.lastCommit.shortSha}
            </a>
            <span className="text-gray-700 truncate max-w-[300px]">
              {pipeline.lastCommit.message}
            </span>
            <span className="text-gray-400">
              {formatRelativeTime(pipeline.lastCommit.date)}
            </span>
          </div>
        </div>
      )}

      {pipeline &&
        (pipeline.lastDeploy.production || pipeline.lastDeploy.staging) && (
          <div className="text-xs mt-2 flex gap-4 flex-wrap">
            {pipeline.lastDeploy.staging && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-gray-500">Construction:</span>
                <a
                  href="https://construction.villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:underline"
                >
                  {pipeline.lastDeploy.staging}
                </a>
              </span>
            )}
            {pipeline.lastDeploy.production && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-500">Production:</span>
                <a
                  href="https://villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:underline"
                >
                  {pipeline.lastDeploy.production}
                </a>
              </span>
            )}
          </div>
        )}
    </div>
  );
}

function WorkflowCard({ runs }: { runs: WorkflowRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">GitHub Actions</h3>
        <div className="text-sm text-gray-500">Loading workflow runs...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">GitHub Actions</h3>
      <div className="space-y-2">
        {runs.slice(0, 5).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  run.conclusion === "success" && "bg-green-500",
                  run.conclusion === "failure" && "bg-red-500",
                  run.conclusion === null &&
                    run.status === "in_progress" &&
                    "bg-blue-500 animate-pulse",
                  run.conclusion === null &&
                    run.status !== "in_progress" &&
                    "bg-gray-400",
                )}
              />
              <a
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {run.name}
              </a>
              <span className="text-gray-400 text-xs">({run.branch})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {run.duration && <span>{formatDuration(run.duration)}</span>}
              <span>{formatRelativeTime(run.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitsCard({ commits }: { commits: CommitInfo[] }) {
  if (commits.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">Recent Commits</h3>
        <div className="text-sm text-gray-500">Loading commits...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <h3 className="font-medium text-ink mb-3">Recent Commits</h3>
      <div className="space-y-2">
        {commits.slice(0, 5).map((commit) => (
          <div key={commit.sha} className="flex items-start gap-2 text-sm">
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:underline shrink-0"
            >
              {commit.shortSha}
            </a>
            <span className="text-gray-700 truncate">{commit.message}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {formatRelativeTime(commit.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

function BuildStatusCard({
  buildStatus,
}: {
  buildStatus: BuildStatusData | null;
}) {
  if (!buildStatus || !buildStatus.run) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <h3 className="font-medium text-ink mb-3">Current Build</h3>
        <div className="text-sm text-gray-500">Loading build status...</div>
      </div>
    );
  }

  const { run, jobs } = buildStatus;
  const isRunning = run.status === "in_progress" || run.status === "queued";
  const isSuccess = run.conclusion === "success";
  const isFailed = run.conclusion === "failure";

  const activeJobs = jobs.filter(
    (j) => j.status === "in_progress" || j.status === "queued",
  );

  return (
    <div
      className={clsx(
        "bg-white rounded-lg border-2 p-4 shadow-sm",
        isRunning && "border-blue-400",
        isSuccess && "border-green-400",
        isFailed && "border-red-400",
        !isRunning && !isSuccess && !isFailed && "border-neutral-200",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-ink">Current Build</h3>
        <a
          href={run.url}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "px-2 py-1 rounded-full text-xs font-medium",
            isRunning && "bg-blue-100 text-blue-800 animate-pulse",
            isSuccess && "bg-green-100 text-green-800",
            isFailed && "bg-red-100 text-red-800",
            !isRunning &&
              !isSuccess &&
              !isFailed &&
              "bg-gray-100 text-gray-800",
          )}
        >
          {isRunning
            ? "BUILDING"
            : run.conclusion?.toUpperCase() || run.status.toUpperCase()}
        </a>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <span className="font-mono">{run.sha.slice(0, 7)}</span>
        <span className="mx-2">•</span>
        <span>{formatRelativeTime(run.createdAt)}</span>
      </div>

      {isRunning && activeJobs.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Currently running:
          </div>
          {activeJobs.map((job) => (
            <div key={job.name} className="text-xs text-blue-700">
              <span className="font-medium">{job.name}</span>
              {job.currentStep && (
                <span className="text-blue-600 ml-1">→ {job.currentStep}</span>
              )}
              <span className="text-blue-500 ml-2">
                ({job.completedSteps}/{job.totalSteps} steps)
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {jobs
          .filter((j) => j.status !== "skipped" || j.name.includes("Deploy"))
          .slice(0, 6)
          .map((job) => (
            <div
              key={job.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    job.conclusion === "success" && "bg-green-500",
                    job.conclusion === "failure" && "bg-red-500",
                    job.conclusion === "skipped" && "bg-gray-300",
                    job.status === "in_progress" && "bg-blue-500 animate-pulse",
                    job.status === "queued" && "bg-yellow-400",
                    !job.conclusion &&
                      job.status !== "in_progress" &&
                      job.status !== "queued" &&
                      "bg-gray-400",
                  )}
                />
                <span
                  className={clsx(
                    job.conclusion === "skipped" && "text-gray-400",
                  )}
                >
                  {job.name}
                </span>
              </div>
              {job.status === "in_progress" && (
                <span className="text-blue-600">
                  {job.completedSteps}/{job.totalSteps}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
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
      const [pipelineRes, actionsRes, commitsRes, buildRes] =
        await Promise.allSettled([
          fetch("/api/pipeline").then((r) => r.json()),
          fetch("/api/github/actions").then((r) => r.json()),
          fetch("/api/github/commits").then((r) => r.json()),
          fetch("/api/build-status").then((r) => r.json()),
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

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Villa Telemetry</h1>
            <p className="text-gray-500 text-sm">
              Infrastructure monitoring dashboard
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => {
                checkServices();
                fetchGitHubData();
              }}
              className="px-4 py-2 bg-ink text-cream rounded-lg hover:bg-ink/90 transition"
            >
              Refresh
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Last: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <PipelineCard pipeline={pipeline} />
        </div>

        {actionMessage && (
          <div
            className={clsx(
              "mb-4 px-4 py-2 rounded-lg text-sm",
              actionMessage.type === "success" && "bg-green-100 text-green-800",
              actionMessage.type === "error" && "bg-red-100 text-red-800",
            )}
          >
            {actionMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {services.map((service) => (
            <ServiceCard
              key={service.name}
              service={service}
              onAction={executeAction}
              actionLoading={actionLoading}
            />
          ))}
        </div>

        <BuildComparison services={services} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <BuildStatusCard buildStatus={buildStatus} />
          <WorkflowCard runs={workflowRuns} />
          <CommitsCard commits={commits} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <h3 className="font-medium text-ink mb-3">GitHub</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://github.com/rockfridrich/villa/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Actions (CI/CD)
              </a>
              <a
                href="https://github.com/rockfridrich/villa/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Releases & Tags
              </a>
              <a
                href="https://github.com/rockfridrich/villa/pulls"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Pull Requests
              </a>
              <a
                href="https://github.com/rockfridrich/villa/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Issues
              </a>
              <a
                href="https://github.com/rockfridrich/villa/compare"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Compare Branches
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <h3 className="font-medium text-ink mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => executeAction("deploy-construction")}
                disabled={actionLoading}
                className="w-full px-3 py-2 text-sm font-medium bg-yellow-500 text-white rounded hover:bg-yellow-600 transition disabled:opacity-50 text-left"
              >
                🏗️ Deploy to Construction
              </button>
              <button
                onClick={() => executeAction("deploy-docs")}
                disabled={actionLoading}
                className="w-full px-3 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 text-left"
              >
                📚 Deploy Docs
              </button>
              <button
                onClick={() => executeAction("deploy-fake-key")}
                disabled={actionLoading}
                className="w-full px-3 py-2 text-sm font-medium bg-purple-500 text-white rounded hover:bg-purple-600 transition disabled:opacity-50 text-left"
              >
                🔑 Deploy Fake Key
              </button>
              <button
                onClick={() => executeAction("run-e2e")}
                disabled={actionLoading}
                className="w-full px-3 py-2 text-sm font-medium bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50 text-left"
              >
                🧪 Run E2E Tests
              </button>
              <button
                onClick={() => executeAction("backup-db")}
                disabled={actionLoading}
                className="w-full px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50 text-left"
              >
                💾 Backup Database
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
            <h3 className="font-medium text-ink mb-3">Railway</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Railway Dashboard
              </a>
              <div className="pt-2 border-t border-neutral-100 mt-2">
                <p className="text-xs text-gray-500 mb-2">Environments:</p>
                <a
                  href="https://villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Production → villa.cash
                </a>
                <a
                  href="https://construction.villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Construction → construction.villa.cash
                </a>
                <a
                  href="https://docs.villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Docs → docs.villa.cash
                </a>
                <a
                  href="https://fake-key.villa.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  Fake Key → fake-key.villa.cash
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Telemetry Dashboard v0.3.0 | Auto-refreshes every 30s</p>
        </div>
      </div>
    </div>
  );
}
