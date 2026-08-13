import { ImageResponse } from "next/og";
import { API_BASE } from "../../lib/constants";
import {
  Base,
  Headline,
  Meta,
  OG_HEADERS,
  OG_SIZE,
  SplitCard,
  deltaLabel,
  fallbackToSiteCard,
  formatPricePercent,
  inlineImage,
  loadFonts,
  sourceMetaLine,
} from "../shared";

export const runtime = "edge";

type Outcome = { outcome: string; price: number | null };
type Market = {
  question: string;
  outcomes: Outcome[];
  volume_24hr: number | null;
  volume_total: number | null;
  one_day_price_change: number | null;
};
type Story = {
  headline: string;
  created_at: string;
  latest_media_at: string;
  distinct_author_count: number;
  hero_image: { url: string | null; kind: string | null } | null;
  markets: Market[];
};

/**
 * The market the card quotes. Ranked by lifetime volume, not 24h: stories
 * link to several markets and the thin ones routinely out-trade the real one
 * on a given day by a few dollars, which would put a dead market on the card.
 */
function pickMarket(markets: Market[]): Market | null {
  if (!markets?.length) return null;
  return [...markets].sort(
    (a, b) =>
      (b.volume_total ?? 0) - (a.volume_total ?? 0) ||
      (b.volume_24hr ?? 0) - (a.volume_24hr ?? 0)
  )[0];
}

function pickOutcome(outcomes: Outcome[]): Outcome | null {
  if (!outcomes?.length) return null;
  return outcomes.find((o) => o.outcome?.toLowerCase() === "yes") ?? outcomes[0];
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fallbackToSiteCard(request);

  // Only the network work is guarded. Satori renders while the response
  // streams, so a layout error surfaces there and never reaches this catch —
  // which is why images are inlined up front rather than fetched by satori.
  let data;
  try {
    const [typography, res] = await Promise.all([
      loadFonts(),
      fetch(`${API_BASE}/stories/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(6000),
      }),
    ]);
    if (!res.ok) return fallbackToSiteCard(request);
    const story = (await res.json()) as Story;
    data = {
      typography,
      story,
      // Video heroes carry a usable jpg thumbnail, so take any hero URL and
      // let inlineImage reject whatever it can't decode.
      plate: await inlineImage(story.hero_image?.url),
      market: pickMarket(story.markets),
    };
  } catch (e: unknown) {
    console.log(`[og/story] ${id}: ${e instanceof Error ? e.message : "Unknown error"}`);
    return fallbackToSiteCard(request);
  }

  const { typography, story, plate, market } = data;
  const outcome = market ? pickOutcome(market.outcomes) : null;

  return new ImageResponse(
    (
      <SplitCard fontFamily={typography.fontFamily} plate={plate}>
        <Headline text={story.headline} plate={!!plate} />
        <Meta
          text={sourceMetaLine(
            story.distinct_author_count,
            story.created_at,
            story.latest_media_at
          )}
        />
        {market && (
          <Base
            label={market.question}
            value={formatPricePercent(outcome?.price ?? null)}
            delta={deltaLabel(market.one_day_price_change)}
            plate={!!plate}
          />
        )}
      </SplitCard>
    ),
    { ...OG_SIZE, fonts: typography.fonts, headers: OG_HEADERS }
  );
}
