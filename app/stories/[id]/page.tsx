import type { Metadata } from "next";
import { API_BASE } from "../../lib/constants";
import StoryClient from "./StoryClient";

/**
 * Per-story metadata — tab title from the headline, suffixed via the root
 * layout's `template: "%s | Omen"`, plus a story-specific share card.
 *
 * openGraph/twitter have to be spelled out: the root layout sets its own
 * `openGraph.title`, and a child that doesn't redeclare it inherits that
 * value verbatim, so setting `title` alone leaves the unfurl reading
 * "Omen | Trade the news".
 *
 * Falls back to a static "Story" when the server can't be reached or the id
 * doesn't resolve, so a broken fetch never blocks the page from rendering.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(
      `${API_BASE}/stories/${encodeURIComponent(id)}`,
      // Cache long enough that a hot story doesn't re-hit the API on
      // every navigation, but short enough to pick up headline edits
      // without a deploy.
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { title: "Story" };
    const story = (await res.json()) as { headline?: string };
    const title = story.headline?.trim() || "Story";
    const image = `/og/story?id=${encodeURIComponent(id)}`;
    return {
      title,
      openGraph: { title, images: [{ url: image, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", title, images: [image] },
    };
  } catch {
    return { title: "Story" };
  }
}

export default function StoryPage() {
  return <StoryClient />;
}
