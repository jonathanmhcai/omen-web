"use client";

import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";

/**
 * Responsive shell.
 *
 * `lg:` and up (≥1024px): three-column layout — fixed left Sidebar,
 * centered `max-w-xl` main column, fixed right slot. The right column
 * reserves space even when empty so `justify-center` doesn't shift the
 * sidebar inward when the right slot is absent (matches the pre-mobile
 * behavior).
 *
 * Below `lg:`: stacks vertically — sticky `MobileNav` header on top
 * (with the ☰ menu + Omen wordmark + login/settings), then full-width
 * main, then the page's `rightSidebar` content rendered below. The
 * desktop `Sidebar` and the right column wrapper are hidden via
 * Tailwind so only one nav surface is mounted per breakpoint.
 */
export default function AppShell({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-background">
      <MobileNav />
      <div className="flex justify-center">
        <Sidebar />
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
