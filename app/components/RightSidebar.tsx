"use client";

import AppDownloadCard from "./AppDownloadCard";
import Positions from "./Positions";
import SearchBox from "./SearchBox";

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
    <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:px-4 lg:py-6">
      {/* Hidden on mobile: SearchBox is rendered at the top of the
       *  homepage `main` on small screens so it's discoverable, not
       *  buried below the entire feed. */}
      <div className="hidden lg:block">
        <SearchBox />
      </div>
      {/* Hidden on mobile: the install-app prompt is laid out for the
       *  desktop right column and would look out of place stacked
       *  full-width below the feed. */}
      <div className="hidden lg:block">
        <AppDownloadCard />
      </div>
      <Positions />
      <p className="flex gap-2 px-3 text-xs text-muted-foreground">
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
