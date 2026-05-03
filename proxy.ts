import { NextRequest, NextResponse } from "next/server";

/**
 * Production-only gate: every page except `/admin` (and child routes)
 * redirects to omen.trading. The `matcher` already excludes `/admin`,
 * Next.js internals, API routes, and static assets, so the function
 * just needs to short-circuit outside production.
 */
export function proxy(_request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  return NextResponse.redirect("https://omen.trading");
}

export const config = {
  matcher: ["/((?!admin|api|_next/static|_next/image|favicon.ico|og).*)"],
};
