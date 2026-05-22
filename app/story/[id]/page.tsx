import type { Metadata } from "next";
import { API_BASE } from "../../lib/constants";
import StoryClient from "./StoryClient";

/**
 * Per-story metadata — sets the browser tab title (and OG fallback)
 * to the story's headline, suffixed via the root layout's
 * `template: "%s | Omen"`. Falls back to a static "Story" when the
 * server can't be reached or the id doesn't resolve, so a broken
 * fetch never blocks the page from rendering.
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
    return { title: story.headline?.trim() || "Story" };
  } catch {
    return { title: "Story" };
  }
}

export default function StoryPage() {
  return <StoryClient />;
}
