import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBuildInfo() {
  const version = process.env.NEXT_PUBLIC_VERSION || "0.3.0-rc.1.1";
  const sha = process.env.NEXT_PUBLIC_GIT_SHA || "unknown";
  const buildHash =
    process.env.NEXT_PUBLIC_BUILD_HASH ||
    (sha !== "unknown" ? sha.slice(0, 8) : "unknown");
  const buildTime =
    process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

  return { version, buildHash, buildTime, sha };
}

function getEnvironment() {
  return process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
}

export async function GET() {
  const build = getBuildInfo();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    build: {
      version: build.version,
      hash: build.buildHash,
      sha: build.sha,
      time: build.buildTime,
    },
    runtime: {
      uptime: Math.floor(process.uptime()),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      node: process.version,
    },
    env: getEnvironment(),
  });
}
