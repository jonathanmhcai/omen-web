import { NextResponse } from "next/server";
import { POLYMARKET_API_BASE } from "../../../lib/constants";

const UPSTREAM_TIMEOUT_MS = 10_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const res = await fetch(
      `${POLYMARKET_API_BASE}/events/slug/${encodeURIComponent(slug)}`,
      {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        next: { revalidate: 15 },
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Polymarket API error: ${res.status}` },
        { status: res.status }
      );
    }
    return NextResponse.json(await res.json());
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "Polymarket request timed out" : "Polymarket request failed" },
      { status: 504 }
    );
  }
}
