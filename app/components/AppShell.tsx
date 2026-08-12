"use client";

import { cn } from "@/lib/utils";
import TopNav from "./TopNav";

/**
 * Responsive shell: sticky `TopNav` bar on top (wordmark left, nav
 * items right) at every breakpoint.
 *
 * `lg:` and up (≥1024px): centered `max-w-xl` main column with an
 * optional right slot. An empty left spacer mirrors the right column's
 * width so the main column sits at the same viewport-centered position
 * on every page, whether or not it has a right rail.
 *
 * Below `lg:`: full-width main, then the page's `rightSidebar` content
 * stacked below it.
 */
export default function AppShell({
  children,
  rightSidebar,
  wide = false,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  /** Rail-less pages (settings) use the daily brief's roomier column so
   *  content edges don't shift between `/` and the rest of the app. */
  wide?: boolean;
}) {
  const column = wide ? "max-w-2xl px-6" : "max-w-xl px-4";
  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <div className="flex justify-center">
        <div className="hidden w-80 shrink-0 lg:block" />
        <main className={cn("w-full", column, wide ? "py-10" : "py-6")}>
          {children}
        </main>
        <div className="hidden w-80 shrink-0 lg:block">{rightSidebar}</div>
      </div>
      {/* Right-slot content stacked below main on mobile. Hidden at lg+
       *  since the right column above already renders it there. */}
      {rightSidebar && (
        <div className={cn("mx-auto w-full pb-8 lg:hidden", column)}>
          {rightSidebar}
        </div>
      )}
    </div>
  );
}
