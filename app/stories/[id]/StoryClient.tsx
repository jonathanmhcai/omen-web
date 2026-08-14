"use client";

import { useParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import RightSidebar from "../../components/RightSidebar";
import { StoryCard, StoryCardSkeleton } from "../../components/StoryCard";
import { useStory } from "../../hooks/useStory";

export default function StoryClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: story, isLoading, isError } = useStory(id);

  return (
    <AppShell wide rightSidebar={<RightSidebar />}>
      {story ? (
        <StoryCard story={story} showBullets expandSources />
      ) : isLoading ? (
        <StoryCardSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Story not found.
        </div>
      ) : null}
    </AppShell>
  );
}
