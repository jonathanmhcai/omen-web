"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "./hooks/useAuthUser";
import { useFeedTags, type FeedTag } from "./hooks/useFeedTags";
import { useStories } from "./hooks/useStories";
import AppShell from "./components/AppShell";
import RightSidebar from "./components/RightSidebar";
import SearchBox from "./components/SearchBox";
import { StoryCard, StoryCardSkeleton } from "./components/StoryCard";

export default function Page() {
  const { ready, authenticated } = usePrivy();
  const { user: authUser, loading: authLoading } = useAuthUser();
  const tabs = useFeedTags();
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Defensive clamp: if a server-side tab change shrinks the list below
  // the user's selection, snap back to the first tab rather than reading
  // an out-of-range index. While `tabs` is loading, fall back to index 0
  // and an undefined slug so stories fetch the unfiltered feed in parallel.
  const clampedIndex = tabs ? Math.min(selectedIndex, tabs.length - 1) : 0;
  const activeTab = tabs?.[clampedIndex];
  const {
    stories,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStories(activeTab?.slug ?? undefined, activeTab?.excludeSlugs);

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
      {tabs ? (
        <FeedTabs
          tabs={tabs}
          selectedIndex={clampedIndex}
          onSelect={setSelectedIndex}
        />
      ) : (
        <FeedTabsSkeleton />
      )}
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

/**
 * Placeholder strip shown while /feed-tags is in flight on a cold load.
 * Matches the FeedTabs height + hairline so the story-card column
 * doesn't shift downward when the real strip swaps in.
 */
function FeedTabsSkeleton() {
  return (
    <div className="sticky top-12 z-10 -mx-4 mb-4 bg-[#f1f5f9] px-4 lg:top-0 dark:bg-background">
      <div className="relative">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-6 py-3">
            {[64, 56, 48, 60, 44].map((w, i) => (
              <div
                key={i}
                className="h-4 shrink-0 animate-pulse rounded bg-muted"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
      </div>
    </div>
  );
}

/**
 * Feed-filter tab strip. Mirrors the mobile app's left-aligned TabBar:
 * label-only tabs with a measured underline indicator that translates +
 * resizes between the selected and previous tabs. Sticky to the top of
 * the main column so it stays visible while scrolling the feed.
 */
function FeedTabs({
  tabs,
  selectedIndex,
  onSelect,
}: {
  tabs: readonly FeedTag[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(
    null
  );

  // Measure the active tab synchronously (pre-paint) so the indicator
  // doesn't visibly jump on first render. ResizeObserver re-measures
  // when a font loads or the viewport reflows. The tabs.length dep is
  // load-bearing: when /feed-tags resolves and changes the count, the
  // refs array is rebuilt and we need to re-measure against the new
  // active button.
  useLayoutEffect(() => {
    const el = tabRefs.current[selectedIndex];
    if (!el) return;
    const measure = () =>
      setIndicator({ x: el.offsetLeft, width: el.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, [selectedIndex, tabs.length]);

  return (
    <div className="sticky top-12 z-10 -mx-4 mb-4 bg-[#f1f5f9] px-4 lg:top-0 dark:bg-background">
      {/* Outer `relative` hosts the full-width bottom hairline that
       *  stays anchored to the visible row width regardless of scroll. */}
      <div className="relative">
        {/* Inner scroller is also `relative` so the indicator (absolute
         *  inside it) shares an offsetParent with the buttons — the
         *  indicator's `translateX(offsetLeft)` then lines up with the
         *  active button. Both buttons and indicator scroll together
         *  inside this container so they stay aligned during a horizontal
         *  scroll. `w-max` on the inner row lets the row size to its
         *  content so children can overflow + scroll. */}
        <div className="relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "shrink-0 py-3 text-base leading-none transition-colors focus-visible:outline-none",
                  selectedIndex === index
                    ? "font-semibold text-foreground"
                    : "font-normal text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-0 h-0.5 bg-foreground transition-[transform,width] duration-200 ease-out",
              indicator ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: `translateX(${indicator?.x ?? 0}px)`,
              width: indicator?.width ?? 0,
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
      </div>
    </div>
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
