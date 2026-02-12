import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "../../../lib/constants";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/admin/users${request.nextUrl.search}`, {
    headers: { Authorization: authorization },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
