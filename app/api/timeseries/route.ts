import { NextRequest, NextResponse } from "next/server";

const CLOB_PRICES_HISTORY_URL = "https://clob.polymarket.com/prices-history";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const res = await fetch(`${CLOB_PRICES_HISTORY_URL}?${searchParams}`);

  if (!res.ok) {
    return NextResponse.json(
      { error: `Polymarket CLOB error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
