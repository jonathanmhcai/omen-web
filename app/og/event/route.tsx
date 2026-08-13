import { ImageResponse } from "next/og";
import { POLYMARKET_API_BASE } from "../../lib/constants";
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
  formatShortDollars,
  inlineImage,
  loadFonts,
} from "../shared";

export const runtime = "edge";

type GammaMarket = {
  question?: string;
  groupItemTitle?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  oneDayPriceChange?: number;
  volumeNum?: number;
  volume?: string | number;
  closed?: boolean;
};
type GammaEvent = {
  title?: string;
  icon?: string;
  image?: string;
  volume?: number;
  markets?: GammaMarket[];
};

/** Sits beside the title, so it tracks the headline's cap height rather than
 *  the old full-height plate. */
const ICON = 72;

/** Gamma returns these as JSON-encoded strings on some endpoints and real
 *  arrays on others; normalize before reading. */
function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function yesPrice(m: GammaMarket): number | null {
  const outcomes = asArray(m.outcomes);
  const prices = asArray(m.outcomePrices);
  if (!prices.length) return null;
  const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  const n = Number(prices[yesIdx >= 0 ? yesIdx : 0]);
  return Number.isFinite(n) ? n : null;
}

function marketVolume(m: GammaMarket): number {
  const n = m.volumeNum ?? Number(m.volume ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return fallbackToSiteCard(request);

  // Only the network work is guarded; satori renders while the response
  // streams, so a layout error surfaces there rather than here.
  let data;
  try {
    const [typography, res] = await Promise.all([
      loadFonts(),
      fetch(`${POLYMARKET_API_BASE}/events/slug/${encodeURIComponent(slug)}`, {
        signal: AbortSignal.timeout(6000),
      }),
    ]);
    if (!res.ok) return fallbackToSiteCard(request);
    const event = (await res.json()) as GammaEvent;
    data = { typography, event, icon: await inlineImage(event.icon ?? event.image) };
  } catch (e: unknown) {
    console.log(`[og/event] ${slug}: ${e instanceof Error ? e.message : "Unknown error"}`);
    return fallbackToSiteCard(request);
  }

  const { typography, event, icon } = data;
  const title = event.title?.trim() || "Event";

  const open = (event.markets ?? []).filter((m) => !m.closed);
  // Ranked by probability, not volume: on a grouped event the heaviest
  // markets are routinely 2-3% longshots, which would make every card read as
  // a list of things that won't happen.
  const ranked = (open.length ? open : (event.markets ?? []))
    .slice()
    .sort(
      (a, b) => (yesPrice(b) ?? 0) - (yesPrice(a) ?? 0) || marketVolume(b) - marketVolume(a)
    );

  const top = ranked[0];
  // A grouped event's outcomes carry a short label ("December 31, 2026"); a
  // plain yes/no market has none, since its question restates the title.
  const topLabel = (top?.groupItemTitle || "").trim();

  return new ImageResponse(
    (
      // No plate: an event's art is a 1:1 icon, not editorial photography, so
      // it reads as a mark beside the title rather than a full-height image.
      <SplitCard fontFamily={typography.fontFamily}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "22px" }}>
          {icon && (
            <div
              style={{
                display: "flex",
                width: `${ICON}px`,
                height: `${ICON}px`,
                borderRadius: "16px",
                overflow: "hidden",
                // Ground and hairline for the icons that are a logo on white
                // or a transparent PNG, which would otherwise have no edge.
                backgroundColor: "#f1f5f9",
                border: "1px solid rgba(15, 23, 42, 0.12)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon}
                alt=""
                width={ICON}
                height={ICON}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          <Headline text={title} plate={false} width={icon ? 806 : 900} />
        </div>
        {event.volume != null && event.volume > 0 && (
          <Meta text={`${formatShortDollars(event.volume)} traded`} />
        )}
        {top && (
          <Base
            label={topLabel || "Chance"}
            value={formatPricePercent(yesPrice(top))}
            delta={deltaLabel(top.oneDayPriceChange)}
            plate={false}
          />
        )}
      </SplitCard>
    ),
    { ...OG_SIZE, fonts: typography.fonts, headers: OG_HEADERS }
  );
}
