import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  { name: "Production", url: "https://villa.cash/api/health", domain: "villa.cash" },
  { name: "Construction", url: "https://construction.villa.cash/api/health", domain: "construction.villa.cash" },
  { name: "Key", url: "https://key.villa.cash/api/health", domain: "key.villa.cash" },
  { name: "Docs", url: "https://docs.villa.cash", domain: "docs.villa.cash" },
];

async function getMainSha(): Promise<{ sha: string; shortSha: string }> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync("gh api repos/rockfridrich/villa/commits/main --jq '.sha'", {
      timeout: 5000,
    });
    const sha = stdout.trim();
    return { sha, shortSha: sha.slice(0, 7) };
  } catch {
    return { sha: "unknown", shortSha: "unknown" };
  }
}

async function getCommitsBehind(deployedSha: string, mainSha: string): Promise<number> {
  if (deployedSha === "local" || deployedSha === "unknown" || mainSha === "unknown") {
    return -1;
  }
  
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(
      `gh api repos/rockfridrich/villa/compare/${deployedSha}...${mainSha} --jq '.ahead_by'`,
      { timeout: 5000 }
    );
    return parseInt(stdout.trim(), 10) || 0;
  } catch {
    return -1;
  }
}

async function getDeploymentStatus(): Promise<VersionStatus["deployInProgress"]> {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(
      `gh api repos/rockfridrich/villa/actions/workflows/deploy.yml/runs --jq '.workflow_runs[0] | {status, conclusion, head_sha, html_url, created_at}'`,
      { timeout: 5000 }
    );
    
    const run = JSON.parse(stdout);
    const isRunning = run.status === "in_progress" || run.status === "queued";
    
    return {
      running: isRunning,
      sha: isRunning ? run.head_sha?.slice(0, 7) : undefined,
      url: isRunning ? run.html_url : undefined,
      startedAt: isRunning ? run.created_at : undefined,
    };
  } catch {
    return { running: false };
  }
}

async function getEnvironmentVersion(url: string): Promise<{ sha: string; version: string }> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return { sha: "error", version: "error" };
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return { sha: "static", version: "static" };
    }
    
    const data = await response.json();
    return {
      sha: data.build?.sha || "local",
      version: data.build?.version || data.version || "unknown",
    };
  } catch {
    return { sha: "error", version: "error" };
  }
}

export async function GET() {
  const cacheKey = "version-status";
  const cached = getCached<VersionStatus>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const [mainInfo, deployStatus, ...envVersions] = await Promise.all([
    getMainSha(),
    getDeploymentStatus(),
    ...ENVIRONMENTS.map((env) => getEnvironmentVersion(env.url)),
  ]);

  const environments = await Promise.all(
    ENVIRONMENTS.map(async (env, i) => {
      const { sha, version } = envVersions[i];
      const isCurrent = sha === mainInfo.shortSha || sha === mainInfo.sha;
      const commitsBehind = isCurrent ? 0 : await getCommitsBehind(sha, mainInfo.sha);
      
      return {
        name: env.name,
        url: `https://${env.domain}`,
        deployedSha: sha,
        deployedVersion: version,
        isCurrent,
        commitsBehind,
      };
    })
  );

  const result: VersionStatus = {
    mainSha: mainInfo.sha,
    mainShortSha: mainInfo.shortSha,
    environments,
    deployInProgress: deployStatus,
    fetchedAt: new Date().toISOString(),
  };

  setCache(cacheKey, result, CACHE_TTL.HEALTH);
  return NextResponse.json(result);
}
