import { NextResponse } from "next/server";

// Disable caching - data can change
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.villa.cash";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;

  try {
    const response = await fetch(`${API_URL}/profiles/${address}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Villa-Hub/0.3.0-beta.2",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying profile request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
