"use client";

import { useEffect, useRef } from "react";
import { Newspaper } from "lucide-react";
import { StoryCard, StoryCardSkeleton } from "../StoryCard";
import { useEventStories } from "../../hooks/useEventStories";

/**
 * Stories whose feed-card surface set includes this event. Mirrors
 * the mobile `EventStoriesTab` — a story shown here is one whose
 * home-feed card would include this event. Markets are suppressed
 * (`showMarkets={false}`); the event page already frames the event
 * context and the endpoint omits the markets join.
 *
 * Infinite scroll via an IntersectionObserver on a sentinel `<div>`
 * at the bottom of the list. Triggers `fetchNextPage` when the
 * sentinel intersects the viewport; `react-query` dedupes overlapping
 * fetches so a fast scroll doesn't fan out requests.
 */
export function EventStoriesTab({
  polymarketEventId,
}: {
  polymarketEventId: string;
}) {
  const {
    stories,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEventStories(polymarketEventId);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isFetchingNextPage) {
            fetchNextPage();
            break;
          }
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StoryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
        <Newspaper className="h-8 w-8 opacity-60" />
        <p className="text-sm font-medium text-foreground">No stories yet</p>
        <p className="max-w-xs text-sm">
          Stories that move this event&apos;s markets will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          pressable
          showMarkets={false}
        />
      ))}
      {hasNextPage && <div ref={sentinelRef} className="h-1" />}
      {isFetchingNextPage && (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Loading more…
        </div>
      )}
    </div>
  );
}
