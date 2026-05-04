"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppShell from "../../components/AppShell";
import RightSidebar from "../../components/RightSidebar";
import { StoryCard, StoryCardSkeleton } from "../../components/StoryCard";
import { useStory } from "../../hooks/useStory";

export default function StoryClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: story, isLoading, isError } = useStory(id);

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {story ? (
        <StoryCard story={story} />
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
