import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "../../../../lib/constants";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/polymarket/orders/v2`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
