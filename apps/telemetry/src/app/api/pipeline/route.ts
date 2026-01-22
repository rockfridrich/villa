import { NextResponse } from "next/server";
import { getCached, setCache, CACHE_TTL } from "@/lib/cache";
import { getWorkflowRuns, getRecentCommits } from "@/lib/github";
import type { PipelineResponse, PipelineStage, CommitInfo } from "@/lib/types";
import { ENVIRONMENT_URLS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cacheKey = "pipeline:overview";
  const cached = getCached<PipelineResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [workflowRuns, commits, constructionHealth, prodHealth] =
      await Promise.allSettled([
        getWorkflowRuns(5),
        getRecentCommits(1),
        fetchHealthQuick(ENVIRONMENT_URLS.construction),
        fetchHealthQuick(ENVIRONMENT_URLS.production),
      ]);

    const stages: PipelineStage[] = [];

    const ciRun =
      workflowRuns.status === "fulfilled"
        ? workflowRuns.value.find((r) => r.name === "CI Pipeline")
        : null;

    if (ciRun) {
      stages.push({
        name: "CI",
        status: mapWorkflowStatus(ciRun.status, ciRun.conclusion),
        url: ciRun.html_url,
        details: ciRun.conclusion || ciRun.status,
      });
    }

    const deployRun =
      workflowRuns.status === "fulfilled"
        ? workflowRuns.value.find((r) => r.name === "Deploy")
        : null;

    if (deployRun) {
      stages.push({
        name: "Deploy",
        status: mapWorkflowStatus(deployRun.status, deployRun.conclusion),
        url: deployRun.html_url,
        details: deployRun.conclusion || deployRun.status,
      });
    }

    stages.push({
      name: "Construction",
      status:
        constructionHealth.status === "fulfilled" && constructionHealth.value
          ? "success"
          : "failed",
      url: "https://construction.villa.cash",
      details:
        constructionHealth.status === "fulfilled" && constructionHealth.value
          ? "healthy"
          : "unreachable",
    });

    stages.push({
      name: "Production",
      status:
        prodHealth.status === "fulfilled" && prodHealth.value
          ? "success"
          : "failed",
      url: "https://villa.cash",
      details:
        prodHealth.status === "fulfilled" && prodHealth.value
          ? "healthy"
          : "unreachable",
    });

    const lastCommit: CommitInfo | null =
      commits.status === "fulfilled" && commits.value[0]
        ? {
            sha: commits.value[0].sha,
            shortSha: commits.value[0].sha.slice(0, 7),
            message: commits.value[0].commit.message
              .split("\n")[0]
              .slice(0, 72),
            author: commits.value[0].commit.author.name,
            date: commits.value[0].commit.author.date,
            url: commits.value[0].html_url,
          }
        : null;

    const lastDeployInfo = {
      production:
        prodHealth.status === "fulfilled" && prodHealth.value?.build?.sha
          ? prodHealth.value.build.sha.slice(0, 7)
          : null,
      staging:
        constructionHealth.status === "fulfilled" &&
        constructionHealth.value?.build?.sha
          ? constructionHealth.value.build.sha.slice(0, 7)
          : null,
    };

    const result: PipelineResponse = {
      stages,
      lastCommit,
      lastDeploy: lastDeployInfo,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL.PIPELINE);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pipeline status",
      },
      { status: 500 },
    );
  }
}

function mapWorkflowStatus(
  status: string,
  conclusion: string | null,
): PipelineStage["status"] {
  if (status === "in_progress" || status === "queued") return "running";
  if (status === "completed") {
    if (conclusion === "success") return "success";
    if (conclusion === "failure" || conclusion === "cancelled") return "failed";
  }
  return "pending";
}

interface HealthResponse {
  build?: { sha?: string };
}

async function fetchHealthQuick(url: string): Promise<HealthResponse | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
