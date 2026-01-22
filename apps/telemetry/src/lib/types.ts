export interface HealthData {
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

export interface HealthProxyResponse {
  environment: string;
  url: string;
  status: "ok" | "error";
  latency: number;
  data?: HealthData;
  error?: string;
  fetchedAt: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  sha: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export interface GitHubActionsResponse {
  runs: WorkflowRun[];
  total: number;
  fetchedAt: string;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  deployStatus?: {
    production: "deployed" | "pending" | "unknown";
    staging: "deployed" | "pending" | "unknown";
  };
}

export interface GitHubCommitsResponse {
  commits: CommitInfo[];
  fetchedAt: string;
}

export interface PipelineStage {
  name: string;
  status: "success" | "running" | "failed" | "pending";
  duration?: number;
  url?: string;
  details?: string;
}

export interface PipelineResponse {
  stages: PipelineStage[];
  lastCommit: CommitInfo | null;
  lastDeploy: {
    production: string | null;
    staging: string | null;
  };
  fetchedAt: string;
}

export type Environment =
  | "local"
  | "construction"
  | "production"
  | "docs"
  | "fake-key"
  | "key";

export const ENVIRONMENT_URLS: Record<Environment, string> = {
  local: "http://localhost:3000/api/health",
  construction: "https://construction.villa.cash/api/health",
  production: "https://villa.cash/api/health",
  docs: "https://docs.villa.cash",
  "fake-key": "https://fake-key.villa.cash/api/health",
  key: "https://key.villa.cash/api/health",
};

export const PIPELINE_STAGES = [
  {
    id: "local",
    name: "Local Dev",
    description: "bun dev + bun verify",
    url: "http://localhost:3000",
    trigger: "manual",
  },
  {
    id: "pr",
    name: "Pull Request",
    description: "CI: lint, type, E2E tests",
    url: null,
    trigger: "auto",
  },
  {
    id: "construction",
    name: "Construction",
    description: "Auto-deploy on merge to main",
    url: "https://construction.villa.cash",
    trigger: "auto",
  },
  {
    id: "production",
    name: "Production",
    description: "Deploy on v* tag",
    url: "https://villa.cash",
    trigger: "manual",
  },
] as const;

export const ENVIRONMENT_HEALTH_ENDPOINTS = {
  construction: "https://construction.villa.cash/api/health",
  production: "https://villa.cash/api/health",
  docs: "https://docs.villa.cash",
  "fake-key": "https://fake-key.villa.cash/api/health",
  key: "https://key.villa.cash/api/health",
} as const;
