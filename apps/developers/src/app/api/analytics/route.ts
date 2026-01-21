import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const eventCounts = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, day, page, example_id, query } = body;

    const key = `${day}:${type}:${page || example_id || query || "default"}`;
    eventCounts.set(key, (eventCounts.get(key) || 0) + 1);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  const aggregates: Record<string, number> = {};

  for (const [key, count] of eventCounts) {
    aggregates[key] = count;
  }

  return NextResponse.json({
    aggregates,
    note: "Privacy-preserving analytics - no user data stored",
  });
}
