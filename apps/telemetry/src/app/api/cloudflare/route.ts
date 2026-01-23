import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CloudflareAnalytics {
  requests: {
    total: number;
    cached: number;
    uncached: number;
  };
  bandwidth: {
    total: number;
    cached: number;
  };
  threats: number;
  countries: { code: string; requests: number }[];
  fetchedAt: string;
  error?: string;
}

export async function GET() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    return NextResponse.json({
      requests: { total: 0, cached: 0, uncached: 0 },
      bandwidth: { total: 0, cached: 0 },
      threats: 0,
      countries: [],
      fetchedAt: new Date().toISOString(),
      error: "Cloudflare credentials not configured",
    } as CloudflareAnalytics);
  }

  try {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const until = now.toISOString();

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();
    const totals = data.result?.totals || {};
    const requests = totals.requests || {};
    const bandwidth = totals.bandwidth || {};

    return NextResponse.json({
      requests: {
        total: requests.all || 0,
        cached: requests.cached || 0,
        uncached: requests.uncached || 0,
      },
      bandwidth: {
        total: bandwidth.all || 0,
        cached: bandwidth.cached || 0,
      },
      threats: totals.threats?.all || 0,
      countries: (data.result?.requests_by_country || [])
        .slice(0, 5)
        .map((c: { clientCountryName: string; requests: number }) => ({
          code: c.clientCountryName,
          requests: c.requests,
        })),
      fetchedAt: new Date().toISOString(),
    } as CloudflareAnalytics);
  } catch (error) {
    return NextResponse.json({
      requests: { total: 0, cached: 0, uncached: 0 },
      bandwidth: { total: 0, cached: 0 },
      threats: 0,
      countries: [],
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    } as CloudflareAnalytics);
  }
}
