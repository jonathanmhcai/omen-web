import { ImageResponse } from "next/og";
import { API_BASE } from "../../lib/constants";
import {
  BORDER,
  Headline,
  Meta,
  OG_HEADERS,
  OG_SIZE,
  PAGE,
  PLATE_WIDTH,
  SplitCard,
  TEXT,
  fallbackToSiteCard,
  inlineImage,
  loadFonts,
} from "../shared";

export const runtime = "edge";

type BriefResponse = {
  payload: {
    dateLine: string;
    sections: { stories: { imageUrl: string | null }[] }[];
  };
};
/** GET /traders/:handle wraps the profile alongside balances. */
type TraderResponse = {
  trader: {
    wallet: string | null;
    name: string | null;
    pseudonym: string | null;
    profileImage: string | null;
  } | null;
};
type Trader = TraderResponse["trader"];

const MAX_TILES = 3;
const AVATAR = 88;
/** Inset and gap for the mosaic, so the tiles read as a feed of cards on the
 *  gray page rather than one bled-together block of photography. */
const TILE_PAD = 30;
const TILE_GAP = 22;

/** `?user=` accepts a handle or a raw wallet, so prefer the resolved profile
 *  name and only fall back to the param, shortened if it's an address. */
function displayName(param: string, trader: Trader | null): string {
  const resolved = trader?.name?.trim() || trader?.pseudonym?.trim();
  if (resolved) return resolved;
  return /^0x[a-f0-9]{6,}$/i.test(param)
    ? `${param.slice(0, 6)}…${param.slice(-4)}`
    : param;
}

/** Deterministic stand-in when a trader has no profile image, in the spirit
 *  of TraderAvatar's wallet-seeded gradient. */
function seedHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export async function GET(request: Request) {
  const user = new URL(request.url).searchParams.get("user");
  if (!user) return fallbackToSiteCard(request);

  // Only the network work is guarded; satori renders while the response
  // streams, so a layout error surfaces there rather than here.
  let data;
  try {
    const [typography, res, trader] = await Promise.all([
      loadFonts(),
      fetch(
        `${API_BASE}/daily-brief/preview?handle=${encodeURIComponent(user)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        },
      ),
      // Identity is a nice-to-have: a failed lookup costs the avatar, not
      // the card.
      fetch(`${API_BASE}/traders/${encodeURIComponent(user)}`, {
        signal: AbortSignal.timeout(6000),
      })
        .then(async (r) =>
          r.ok ? ((await r.json()) as TraderResponse).trader : null,
        )
        .catch(() => null),
    ]);
    if (!res.ok) return fallbackToSiteCard(request);
    const { payload } = (await res.json()) as BriefResponse;

    // A brief has no single subject, so its plate is a mosaic of the stories
    // it actually contains. Over-fetch and take the first few that decode:
    // roughly half of stories have no usable image.
    const candidates = payload.sections
      .flatMap((s) => s.stories)
      .map((s) => s.imageUrl)
      .filter((u): u is string => !!u)
      .slice(0, MAX_TILES + 3);
    const tiles = (await Promise.all(candidates.map(inlineImage)))
      .filter((u): u is string => u !== null)
      .slice(0, MAX_TILES);

    data = {
      typography,
      payload,
      tiles,
      trader,
      avatar: await inlineImage(trader?.profileImage),
    };
  } catch (e: unknown) {
    console.log(
      `[og/brief] ${user}: ${e instanceof Error ? e.message : "Unknown error"}`,
    );
    return fallbackToSiteCard(request);
  }

  const { typography, payload, tiles, trader, avatar } = data;
  const name = displayName(user, trader);
  const hue = seedHue(trader?.wallet ?? user);
  const tileWidth = PLATE_WIDTH - TILE_PAD * 2;
  const tileHeight = tiles.length
    ? Math.floor(
        (OG_SIZE.height - TILE_PAD * 2 - TILE_GAP * (tiles.length - 1)) /
          tiles.length,
      )
    : 0;

  const mosaic = tiles.length ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: `${PLATE_WIDTH}px`,
        height: `${OG_SIZE.height}px`,
        backgroundColor: PAGE,
        borderLeft: `1px solid ${BORDER}`,
        padding: `${TILE_PAD}px`,
        gap: `${TILE_GAP}px`,
      }}
    >
      {tiles.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src.slice(-24)}
          src={src}
          alt=""
          width={tileWidth}
          height={tileHeight}
          style={{
            width: `${tileWidth}px`,
            height: `${tileHeight}px`,
            objectFit: "cover",
            borderRadius: "14px",
          }}
        />
      ))}
    </div>
  ) : null;

  return new ImageResponse(
    <SplitCard fontFamily={typography.fontFamily} plateNode={mosaic}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "22px",
          marginBottom: "26px",
        }}
      >
        {/* Ground and hairline live on the wrapper, not the img. Polymarket
            profile images are a mix of transparent PNGs and opaque ones on
            white, so without a ring the circle disappears into the card on
            either kind. Matches TraderAvatar's bg-muted. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: `${AVATAR}px`,
            height: `${AVATAR}px`,
            borderRadius: `${AVATAR / 2}px`,
            overflow: "hidden",
            backgroundColor: avatar ? "#e9eef4" : `hsl(${hue}, 62%, 60%)`,
            border: avatar ? "1px solid rgba(15, 23, 42, 0.12)" : "none",
            color: "#ffffff",
            fontSize: "38px",
            fontWeight: 600,
          }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={AVATAR}
              height={AVATAR}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            name.replace(/^0x/i, "").slice(0, 1).toUpperCase()
          )}
        </div>
        <span
          style={{
            fontSize: "46px",
            fontWeight: 600,
            color: TEXT,
            letterSpacing: "-0.03em",
          }}
        >
          @{name}
        </span>
      </div>
      {/* Fixed, not payload.title: that's the email's "Thursday brief", and
          the card should read the same whatever day the link is opened. */}
      <Headline text="Daily brief" plate={!!mosaic} />
      <Meta text={payload.dateLine} />
    </SplitCard>,
    { ...OG_SIZE, fonts: typography.fonts, headers: OG_HEADERS },
  );
}
