import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    build: {
      version: process.env.NEXT_PUBLIC_VERSION || "unknown",
      hash: process.env.NEXT_PUBLIC_BUILD_HASH || "unknown",
      sha: process.env.NEXT_PUBLIC_GIT_SHA || "unknown",
      time: process.env.NEXT_PUBLIC_BUILD_TIME || "unknown",
    },
    runtime: {
      uptime: Math.floor(uptime),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      node: process.version,
    },
    env: process.env.NEXT_PUBLIC_ENV || "development",
  });
}
