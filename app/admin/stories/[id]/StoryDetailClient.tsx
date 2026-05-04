"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import Link from "next/link";
import StorySubtables from "../../../components/admin/story-subtables/StorySubtables";
import { useAdminStory } from "../../../hooks/admin/useAdminStory";
import { formatExactDate } from "../../../lib/utils";

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      className="cursor-pointer text-left hover:underline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast("Copied to clipboard");
      }}
      title="Click to copy"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2 border-b border-black/[.04] dark:border-white/[.06]">
      <span className="w-44 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "candidate" | "active" }) {
  const className =
    status === "active"
      ? "rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
      : "rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400";
  return <span className={className}>{status}</span>;
}

export default function StoryDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAdminStory(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin duration-1000" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500">Error: {error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Story not found.</p>;
  }

  const { story, tweets, events, markets } = data;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/stories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to stories
        </Link>
      </div>

      <div className="mb-4 flex items-start gap-3">
        <h2 className="text-lg font-semibold">{story.headline}</h2>
        <div className="mt-1.5">
          <StatusBadge status={story.status} />
        </div>
      </div>

      <div className="mb-8 flex flex-col">
        <Field label="ID">
          <CopyValue label={story.id} value={story.id} />
        </Field>
        <Field label="Status">
          <StatusBadge status={story.status} />
        </Field>
        <Field label="Tweets / Authors">
          {story.media_count} tweets, {story.distinct_author_count} distinct authors
        </Field>
        <Field label="Linked">
          {events.length} events, {markets.length} markets
        </Field>
        <Field label="Created">{formatExactDate(story.created_at)}</Field>
        <Field label="Latest media">{formatExactDate(story.latest_media_at)}</Field>
        <Field label="Promoted">
          {story.promoted_at ? formatExactDate(story.promoted_at) : "—"}
        </Field>
        <Field label="Centroid model">{story.centroid_model ?? "—"}</Field>
        <Field label="Centroid embedded">
          {story.centroid_embedded_at
            ? formatExactDate(story.centroid_embedded_at)
            : "—"}
        </Field>
      </div>

      <StorySubtables tweets={tweets} events={events} markets={markets} />
    </div>
  );
}
