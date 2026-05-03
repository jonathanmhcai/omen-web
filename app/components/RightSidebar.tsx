"use client";

import AppDownloadCard from "./AppDownloadCard";
import Positions from "./Positions";
import SearchBox from "./SearchBox";

export default function RightSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-80 shrink-0 flex-col gap-4 overflow-y-auto px-4 py-6">
      <SearchBox />
      <AppDownloadCard />
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
