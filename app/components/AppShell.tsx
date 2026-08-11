"use client";

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
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <div className="flex justify-center">
        <div className="hidden w-80 shrink-0 lg:block" />
        <main className="w-full max-w-xl px-4 py-6">{children}</main>
        <div className="hidden w-80 shrink-0 lg:block">{rightSidebar}</div>
      </div>
      {/* Right-slot content stacked below main on mobile. Hidden at lg+
       *  since the right column above already renders it there. */}
      {rightSidebar && (
        <div className="mx-auto w-full max-w-xl px-4 pb-8 lg:hidden">
          {rightSidebar}
        </div>
      )}
    </div>
  );
}
