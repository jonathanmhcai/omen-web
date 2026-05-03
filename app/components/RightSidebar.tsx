"use client";

import { Search } from "lucide-react";
import AppDownloadCard from "./AppDownloadCard";
import Positions from "./Positions";

export default function RightSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-80 shrink-0 flex-col gap-4 overflow-y-auto px-4 py-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          disabled
          placeholder="Search"
          className="w-full cursor-not-allowed rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
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
