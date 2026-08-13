/**
 * Shared system for the per-page OG cards (`/og/story`, `/og/event`,
 * `/og/brief`). One layout, three subjects: white ground, wordmark top-left,
 * the subject set large, a hairline rule, and one hero number at the base,
 * with a full-bleed image plate down the right edge.
 *
 * Sized for the real viewing context: a 1200x630 card renders at ~500px wide
 * in a timeline (0.42x), so anything under ~24px here is illegible there.
 * That budget is why the cards carry four elements instead of eight.
 *
 * The plate is optional by design, not as a fallback: only ~56% of stories
 * have a hero image, so the imageless layout has to stand on its own.
 */

// Mobile app light theme (omen/src/theme/colors.ts).
export const TEXT = "#0f172a";
export const INK = "#0a0a0a";
export const SECONDARY = "rgba(15, 23, 42, 0.6)";
export const BORDER = "#e2e8f0";
export const SUCCESS = "#16a34a";
export const ERROR = "#dc2626";
/** Gray page behind white cards, as in the app and the email. */
export const PAGE = "#f7f7f8";

export const OG_SIZE = { width: 1200, height: 630 };
export const PLATE_WIDTH = 500;

/** Crawlers re-fetch aggressively and the cards quote live odds, so cache at
 *  the edge for minutes, not hours, and serve stale while revalidating. */
export const OG_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
};

/**
 * Degrade to the site card. A per-page card depends on an upstream API and
 * third-party images, so it will fail sometimes; a 404/500 here would make
 * the link unfurl with no image at all, which is worse than a generic one.
 */
export function fallbackToSiteCard(request: Request): Response {
  // Built by hand rather than Response.redirect(): that returns a response
  // with immutable headers, which Next then fails to write to, turning the
  // fallback into the 500 it was meant to prevent.
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/og", request.url).toString(),
      // Short: a transient upstream blip shouldn't pin the generic card over
      // a real story for the full card TTL.
      "Cache-Control": "public, max-age=0, s-maxage=60",
    },
  });
}

async function loadGoogleFont(font: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&display=swap`;
  const css = await fetch(url).then((res) => res.text());
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
  if (resource) {
    const response = await fetch(resource[1]);
    if (response.ok) return await response.arrayBuffer();
  }
  throw new Error("Failed to load font data");
}

export type OgFonts = {
  fontFamily: string;
  fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 400 | 600 | 700 }[];
};

/** Satori has no synthetic weights, so every weight in the design has to be
 *  fetched — an unloaded one silently renders at another weight. */
export async function loadFonts(): Promise<OgFonts> {
  const [regular, semibold, bold] = await Promise.all([
    loadGoogleFont("Inter", 400).catch(() => null),
    loadGoogleFont("Inter", 600).catch(() => null),
    loadGoogleFont("Inter", 700).catch(() => null),
  ]);
  const fonts = [
    regular && { name: "Inter", data: regular, style: "normal" as const, weight: 400 as const },
    semibold && { name: "Inter", data: semibold, style: "normal" as const, weight: 600 as const },
    bold && { name: "Inter", data: bold, style: "normal" as const, weight: 700 as const },
  ].filter((f) => f !== null);
  return { fontFamily: fonts.length ? "Inter" : "system-ui, sans-serif", fonts };
}

const DECODABLE = /^image\/(png|jpeg|jpg|gif)$/;

/**
 * Inline a remote image as a data URI, or null if it can't be used.
 *
 * Satori fetches `src` URLs itself and THROWS when one fails, which would 500
 * the whole route — a dead image would cost the entire preview, not just the
 * picture. Fetching here keeps failure local. Also filters to formats resvg
 * can decode: a webp hero (several stories have them) throws the same way.
 */
export async function inlineImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!DECODABLE.test(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    // Chunked: String.fromCharCode(...bytes) overflows the call stack on
    // anything bigger than a thumbnail.
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "22 sources · 30m ago" — the story's credibility and freshness in the one
 *  line the card can afford. Mirrors storyMeta() in omen-server's payload.ts
 *  for which timestamp counts. */
export function sourceMetaLine(
  distinctCount: number,
  createdAt: string,
  latestMediaAt: string
): string {
  const updated = new Date(latestMediaAt).getTime() - new Date(createdAt).getTime() > 60_000;
  const stamp = timeAgo(updated ? latestMediaAt : createdAt);
  const sources = `${distinctCount} source${distinctCount === 1 ? "" : "s"}`;
  return `${sources} · ${stamp}`;
}

/** Probability as the app writes it: <1% and >99% never round to 0/100. */
export function formatPricePercent(price: number | null | undefined): string {
  if (price == null) return "--";
  const pct = price * 100;
  if (pct > 0 && pct < 1) return "<1%";
  if (pct > 99 && pct < 100) return ">99%";
  return `${Math.round(pct)}%`;
}

export function formatShortDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}b`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

/**
 * Headlines run 40-110 characters, so a fixed size either overflows into the
 * block below or wastes the card on short ones. Step the size down until the
 * estimated line count fits, and truncate only as a last resort.
 *
 * Inter semibold averages ~0.5em per character in mixed case; the 8% slack
 * covers word-wrap ragging. It's an estimate, so pair it with a layout that
 * has slack rather than one tuned to the exact pixel.
 */
export function fitHeadline(
  text: string,
  { width, maxLines, max, min }: { width: number; maxLines: number; max: number; min: number }
): { size: number; text: string } {
  const linesAt = (size: number) =>
    Math.ceil((text.length * 1.08) / Math.max(1, Math.floor(width / (size * 0.5))));
  let size = max;
  while (size > min && linesAt(size) > maxLines) size -= 2;
  if (linesAt(size) <= maxLines) return { size, text };
  const budget = Math.floor((Math.floor(width / (size * 0.5)) * maxLines) / 1.08) - 1;
  const cut = text.slice(0, budget);
  const at = cut.lastIndexOf(" ");
  return { size, text: `${(at > budget * 0.6 ? cut.slice(0, at) : cut).trimEnd()}…` };
}

export function deltaLabel(change: number | null | undefined) {
  const pts = change == null ? null : Math.round(change * 100);
  if (pts == null || pts === 0) return null;
  return { text: `${pts > 0 ? "▲" : "▼"} ${Math.abs(pts)}`, color: pts > 0 ? SUCCESS : ERROR };
}

/**
 * The card shell: type column left, full-bleed image plate right. With no
 * plate the column runs the full width and the type steps up a size, so the
 * imageless card reads as intentional rather than as a hole.
 */
export function SplitCard({
  fontFamily,
  plate,
  plateNode,
  children,
}: {
  fontFamily: string;
  /**
   * Editorial photography only. Square art (an event's icon) belongs inline
   * with the title instead: a tall plate has to either crop a 1:1 mark or
   * letterbox it, and both look worse than showing it at its own size.
   */
  plate?: string | null;
  /** For plates that aren't a single image, e.g. the brief's mosaic. */
  plateNode?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasPlate = !!plate || !!plateNode;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#ffffff",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: hasPlate ? `${OG_SIZE.width - PLATE_WIDTH}px` : "1200px",
          height: "100%",
          // Top and left match the home card (app/og/route.tsx) so the
          // wordmark sits in the same place across the whole family.
          padding: "56px 56px 50px 64px",
        }}
      >
        <span
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: TEXT,
            letterSpacing: "-0.02em",
          }}
        >
          Omen
        </span>
        {/* Centred in the space under the wordmark rather than pinned to the
            bottom: content runs from a 4-line headline to a three-word event
            title, and bottom-anchoring turns that variance into a void. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            // Floor under the wordmark: a tall plateless card would otherwise
            // centre itself right up against it.
            marginTop: "44px",
            // Capped on the plateless cards so the rule ends with the text
            // block instead of running the full 1080px under content that
            // only occupies the left quarter.
            maxWidth: hasPlate ? "100%" : "900px",
          }}
        >
          {children}
        </div>
      </div>
      {plate ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={plate}
          alt=""
          width={PLATE_WIDTH}
          height={OG_SIZE.height}
          style={{
            width: `${PLATE_WIDTH}px`,
            height: `${OG_SIZE.height}px`,
            objectFit: "cover",
          }}
        />
      ) : (
        plateNode ?? null
      )}
    </div>
  );
}

/** The subject line: fluid so it fills short headlines and survives long ones. */
export function Headline({
  text,
  plate,
  width,
}: {
  text: string;
  plate: boolean;
  /** Override when something shares the row, e.g. an event's icon. */
  width?: number;
}) {
  const w = width ?? (plate ? 580 : 900);
  // Capped at 3 lines: a 4-line headline in the 580px column rags badly and
  // leaves a single orphan word on the last line.
  const h = fitHeadline(text, {
    width: w,
    maxLines: 3,
    max: 52,
    min: 38,
  });
  return (
    <span
      style={{
        fontSize: `${h.size}px`,
        fontWeight: 600,
        color: INK,
        lineHeight: 1.13,
        letterSpacing: "-0.032em",
        maxWidth: `${w}px`,
      }}
    >
      {h.text}
    </span>
  );
}

export function Meta({ text }: { text: string }) {
  return (
    <span style={{ fontSize: "22px", color: SECONDARY, marginTop: "18px" }}>{text}</span>
  );
}

/**
 * The base: a hairline, a label on the left, and the hero number on the
 * right. The number is the only thing on the card that survives being
 * scaled to a phone-sized preview, so it gets the weight.
 */
export function Base({
  label,
  value,
  delta,
  plate,
}: {
  label: string;
  value: string;
  delta?: { text: string; color: string } | null;
  plate: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${BORDER}`,
        marginTop: "32px",
        paddingTop: "26px",
      }}
    >
      {/* Number over label, both flush left. Splitting them to opposite
          edges left 1000px of dead space between the datum and the thing it
          refers to on the full-width cards. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
        <span
          style={{
            // Bigger without a plate: the number is the only thing carrying
            // the card, so it takes the weight the photo would have.
            fontSize: plate ? "80px" : "92px",
            fontWeight: 700,
            color: TEXT,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {delta && (
          <span style={{ fontSize: "27px", fontWeight: 600, color: delta.color }}>
            {delta.text}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "24px",
          color: SECONDARY,
          lineHeight: 1.3,
          marginTop: "12px",
          maxWidth: plate ? "560px" : "860px",
        }}
      >
        {label}
      </span>
    </div>
  );
}
