"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useStories } from "../../hooks/useStories";
import AppShell from "../AppShell";
import RightSidebar from "../RightSidebar";
import SearchBox from "../SearchBox";
import { StoryCard, StoryCardSkeleton } from "../StoryCard";

/**
 * DEPRECATED — the former `/stories` feed index, unrouted since the daily
 * brief took over the app's front door (2026-08-11). Story detail pages
 * (`/stories/[id]`) are still live. Not imported anywhere.
 */
export default function StoriesFeed() {
  const { ready, authenticated } = usePrivy();
  const { user: authUser, loading: authLoading } = useAuthUser();
  const {
    stories,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStories();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showSkeletons =
    !ready ||
    (authenticated && (authLoading || !authUser)) ||
    (isLoading && stories.length === 0);

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      {/* Mobile-only SearchBox at the top of main. SearchBox is hidden
       *  in RightSidebar at this breakpoint (see RightSidebar.tsx) —
       *  rendered here so it's discoverable above the feed rather than
       *  buried at the bottom of the page on small screens. */}
      <div className="mb-4 lg:hidden">
        <SearchBox />
      </div>
      {showSkeletons ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} pressable />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-8" />
      {isFetchingNextPage && <div className="py-4">Loading more…</div>}
      <ScrollToTopButton />
    </AppShell>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        // Mobile: pinned to the right edge (the desktop offset
        // calc(50% + 17rem) would land it off-screen below `lg:`).
        // Desktop: offset to just outside the centered max-w-xl column,
        // matching the gap between main and the right sidebar.
        "fixed bottom-6 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-opacity hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:left-[calc(50%+17rem)] lg:right-auto",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
