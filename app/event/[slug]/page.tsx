import type { Metadata } from "next";
import AppShell from "../../components/AppShell";
import RightSidebar from "../../components/RightSidebar";
import { EventDetail } from "../../components/event/EventDetail";
import { POLYMARKET_API_BASE } from "../../lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Per-event metadata — sets the browser tab title (and OG fallback)
 * to the event's title, suffixed via the root layout's
 * `template: "%s | Omen"`. Hits Polymarket gamma directly (same
 * upstream as the /api/events proxy route) so we don't bounce a
 * request through our own Next server during SSR. Falls back to a
 * static "Event" when the fetch fails so a broken metadata path
 * never blocks the page from rendering.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(
      `${POLYMARKET_API_BASE}/events/slug/${encodeURIComponent(slug)}`,
      {
        signal: AbortSignal.timeout(10_000),
        // Cache long enough that a hot event doesn't re-hit upstream on
        // every nav, short enough to pick up title edits without a
        // deploy. Matches the proxy route's revalidate.
        next: { revalidate: 15 },
      }
    );
    if (!res.ok) return { title: "Event" };
    const event = (await res.json()) as { title?: string };
    return { title: event.title?.trim() || "Event" };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <EventDetail slug={slug} />
    </AppShell>
  );
}
