"use client";

import AppDownloadCard from "./AppDownloadCard";
import Positions from "./Positions";

/**
 * Right column for the homepage.
 *
 * On desktop (`lg:`): sticky to the viewport top, scrolls internally,
 * 80 wide. Below `lg:`: rendered inline below `main` (via AppShell)
 * so it drops the sticky/h-screen styling. Some slots also hide on
 * mobile (see comments below).
 */
export default function RightSidebar() {
  return (
    // Sticks BELOW the 52px TopNav (h-13), not at top-0: this column scrolls
    // internally, so at top-0 its first card sat under the bar with no way
    // to reach it. Height matches, so its scroll area ends at the viewport.
    //
    // pt matches AppShell's wide column (py-10) so the first card here lines
    // up with the first row of `main` rather than floating above it.
    <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-13 lg:h-[calc(100vh-3.25rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:px-4 lg:pt-10 lg:pb-6">
      {/* The event SearchBox used to lead this column; it now lives in
       *  components/deprecated/SearchBox.tsx, ready to drop back in. */}
      {/* One shape at every width now that the card is a tagline and a
       *  button; the desktop/mobile split existed for the QR code. */}
      <AppDownloadCard />
      <Positions />
      <p className="flex gap-2 text-xs text-muted-foreground lg:px-3">
        <a href="mailto:support@omen.trading" className="hover:underline">
          Support
        </a>
        <a href="https://omen.trading/privacy" className="hover:underline">
          Privacy
        </a>
        <a href="https://omen.trading/terms" className="hover:underline">
          Terms
        </a>
      </p>
    </aside>
  );
}
