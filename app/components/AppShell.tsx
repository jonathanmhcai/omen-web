"use client";

import Sidebar from "./Sidebar";

/**
 * Three-column app shell: fixed-width left sidebar, centered max-w-xl
 * main column, fixed-width right slot. The right column reserves space
 * even when empty so the left sidebar's horizontal position stays
 * anchored across pages (otherwise `justify-center` would re-center the
 * row and shift the sidebar inward when the right slot is absent).
 */
export default function AppShell({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-[#f1f5f9] dark:bg-background">
      <Sidebar />
      <main className="w-full max-w-xl px-4 py-6">{children}</main>
      <div className="w-80 shrink-0">{rightSidebar}</div>
    </div>
  );
}
