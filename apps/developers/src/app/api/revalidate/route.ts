import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

interface RevalidateRequest {
  paths?: string[];
  tags?: string[];
  purgeAll?: boolean;
}

async function purgeCloudflareCache(
  zoneId: string,
  token: string,
  options: { files?: string[]; purgeEverything?: boolean }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const body = options.purgeEverything
    ? { purge_everything: true }
    : { files: options.files };

  const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/purge_cache`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!data.success) {
    return {
      success: false,
      error: data.errors?.map((e: { message: string }) => e.message).join(", ") || "Unknown error",
    };
  }

  return { success: true, id: data.result?.id };
}

export async function POST(request: Request) {
  const token = request.headers.get("x-revalidate-token");
  const expectedToken = process.env.REVALIDATE_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "REVALIDATE_TOKEN not configured" },
      { status: 500 }
    );
  }

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!cfToken || !cfZoneId) {
    return NextResponse.json(
      { error: "CloudFlare credentials not configured" },
      { status: 500 }
    );
  }

  let body: RevalidateRequest = {};
  try {
    body = await request.json();
  } catch {
    body = { purgeAll: true };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://docs.villa.cash";

  if (body.purgeAll) {
    const result = await purgeCloudflareCache(cfZoneId, cfToken, {
      purgeEverything: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      purged: "all",
      cacheId: result.id,
      timestamp: new Date().toISOString(),
    });
  }

  if (body.paths?.length) {
    const urls = body.paths.map((path) =>
      path.startsWith("http") ? path : `${baseUrl}${path}`
    );

    const result = await purgeCloudflareCache(cfZoneId, cfToken, {
      files: urls,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      purged: urls,
      cacheId: result.id,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    { error: "No paths or purgeAll specified" },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/revalidate",
    methods: ["POST"],
    headers: {
      required: ["x-revalidate-token"],
    },
    body: {
      paths: "string[] - URLs or paths to purge",
      purgeAll: "boolean - purge entire cache",
    },
    examples: [
      {
        description: "Purge specific paths",
        body: { paths: ["/", "/playground", "/architecture"] },
      },
      {
        description: "Purge entire cache",
        body: { purgeAll: true },
      },
    ],
  });
}
