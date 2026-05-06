"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import Link from "next/link";
import StorySubtables from "../../../components/admin/story-subtables/StorySubtables";
import { useAdminStory } from "../../../hooks/admin/useAdminStory";
import { type AdminStoryStatus } from "../../../lib/types";
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

function StatusBadge({ status }: { status: AdminStoryStatus }) {
  const base = "rounded-full px-2 py-0.5 text-xs font-medium";
  const className =
    status === "published"
      ? `${base} bg-green-500/15 text-green-700 dark:text-green-400`
      : status === "active"
        ? `${base} bg-amber-500/15 text-amber-700 dark:text-amber-400`
        : status === "merged"
          ? `${base} bg-violet-500/15 text-violet-700 dark:text-violet-400`
          : `${base} bg-zinc-500/15 text-zinc-600 dark:text-zinc-400`;
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

  // Title prefers the LLM-generated headline; the tweet-derived seed is
  // shown below as supporting context so admin can compare what the model
  // produced against the raw source.
  const titleHeadline = story.llm_headline ?? story.headline;
  const showRawBelow = story.llm_headline !== null;

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
        <h2 className="text-lg font-semibold">{titleHeadline}</h2>
        <div className="mt-1.5">
          <StatusBadge status={story.status} />
        </div>
      </div>

      {story.status === "merged" && story.merged_into_story_id && (
        // Surface the redirect target prominently. The detail page itself
        // intentionally still shows this row's frozen state (centroid,
        // tweets, links) — useful for debugging "why did the worker pick
        // that survivor?" — but the banner makes clear that user-facing
        // traffic for this id resolves to the survivor on the public API.
        <div className="mb-4 rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-sm">
          <span className="mr-2 font-medium text-violet-700 dark:text-violet-400">
            Merged
          </span>
          <span className="text-muted-foreground">
            {story.merged_at
              ? `on ${formatExactDate(story.merged_at)} `
              : ""}
            into{" "}
          </span>
          <Link
            href={`/admin/stories/${story.merged_into_story_id}`}
            className="font-mono text-xs hover:underline"
          >
            {story.merged_into_story_id}
          </Link>
        </div>
      )}

      {showRawBelow && (
        <div className="mb-4 text-sm text-muted-foreground">
          <span className="mr-2 rounded bg-zinc-500/10 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            raw seed
          </span>
          {story.headline}
        </div>
      )}

      {story.bullets.length > 0 && (
        <ul className="mb-6 list-disc space-y-1 pl-5 text-sm">
          {story.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      <div className="mb-8 flex flex-col">
        <Field label="ID">
          <CopyValue label={story.id} value={story.id} />
        </Field>
        <Field label="Status">
          <StatusBadge status={story.status} />
        </Field>
        <Field label="Tweets / Authors">
          {story.media_count} tweets, {story.distinct_author_count} distinct
          authors
        </Field>
        <Field label="Linked">
          {events.length} events, {markets.length} markets
        </Field>
        <Field label="Created">{formatExactDate(story.created_at)}</Field>
        <Field label="Latest media">
          {formatExactDate(story.latest_media_at)}
        </Field>
        <Field label="Promoted">
          {story.promoted_at ? formatExactDate(story.promoted_at) : "—"}
        </Field>
        <Field label="Published">
          {story.published_at ? formatExactDate(story.published_at) : "—"}
        </Field>
        <Field label="Merged">
          {story.merged_at ? formatExactDate(story.merged_at) : "—"}
        </Field>
        <Field label="Merged into">
          {story.merged_into_story_id ? (
            <Link
              href={`/admin/stories/${story.merged_into_story_id}`}
              className="font-mono text-xs hover:underline"
            >
              {story.merged_into_story_id}
            </Link>
          ) : (
            "—"
          )}
        </Field>
        <Field label="LLM metadata generated">
          {story.metadata_generated_at
            ? formatExactDate(story.metadata_generated_at)
            : "—"}
        </Field>
        <Field label="LLM runs">
          {story.metadata_runs_count} / 3
        </Field>
        <Field label="Searched image">
          {story.searched_image_url ? (
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.searched_image_url}
                alt="searched hero"
                className="h-12 w-12 rounded object-cover"
              />
              <a
                href={story.searched_image_url}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-xs hover:underline"
              >
                {story.searched_image_url}
              </a>
            </span>
          ) : story.searched_image_attempted_at ? (
            <span className="text-muted-foreground">no image found</span>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Searched image attempted">
          {story.searched_image_attempted_at
            ? formatExactDate(story.searched_image_attempted_at)
            : "—"}
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
