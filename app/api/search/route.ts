import { NextRequest, NextResponse } from "next/server";
import { POLYMARKET_API_BASE } from "../../lib/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const res = await fetch(`${POLYMARKET_API_BASE}/public-search?${searchParams}`);

  if (!res.ok) {
    return NextResponse.json(
      { error: `Polymarket API error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
