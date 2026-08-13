import { ImageResponse } from "next/og";
import {
  BORDER,
  OG_HEADERS,
  OG_SIZE,
  SECONDARY,
  TEXT,
  inlineImage,
  loadFonts,
} from "./shared";

export const runtime = "edge";

/** Gray page behind the white story cards, as in the app and the email. */
const PAGE = "#f7f7f8";

type Source = { url: string; square?: boolean };

/**
 * A frozen snapshot of three real brief stories. The site card is the one
 * OG image with no subject of its own, so its content is authored rather
 * than fetched — but the images are still third-party URLs that can rot,
 * hence the inlining below.
 */
const STORIES: {
  headline: string;
  sources: Source[];
  sourcesText: string;
  meta: string;
  imageUrl: string;
}[] = [
  {
    headline: "Karoline Leavitt to step down as White House press secretary",
    sources: [
      { url: "https://pbs.twimg.com/profile_images/1874154135869616128/nJDmubGJ_normal.jpg", square: true },
      { url: "https://pbs.twimg.com/profile_images/931156393108885504/EqEMtLhM_normal.jpg" },
    ],
    sourcesText: "@Reuters, @FT, +17 more",
    meta: "Updated 12m ago",
    imageUrl: "https://pbs.twimg.com/media/HPi9n7cXIAAh4bK.jpg",
  },
  {
    headline: "Traders assign 45% probability to September Fed rate hike",
    sources: [
      { url: "https://pbs.twimg.com/profile_images/72647502/tyler_normal.jpg" },
    ],
    sourcesText: "@zerohedge, +2 more",
    meta: "Published 1h ago",
    imageUrl:
      "https://images.moneycontrol.com/static-mcnews/2026/08/20260812111656_Us-inflation.png",
  },
  {
    headline: "US asks Ukraine to halt strikes on tankers using Russian port",
    sources: [
      { url: "https://pbs.twimg.com/profile_images/1623046069109006343/nPSI3ntN_normal.jpg" },
      { url: "https://pbs.twimg.com/profile_images/931156393108885504/EqEMtLhM_normal.jpg" },
    ],
    sourcesText: "@AFpost, @FT, +2 more",
    meta: "Updated 3h ago",
    imageUrl: "https://pbs.twimg.com/media/HPiZwyEbAAABknu.jpg",
  },
];

const AVATAR = 30;
const THUMB = 124;

export async function GET() {
  /**
   * Every image is inlined before satori sees it. Satori fetches `src` URLs
   * itself and throws when one fails, and it renders while the response
   * streams, so that throw can't be caught here — a single deleted tweet
   * would take out the site card, which is also the fallback the per-page
   * cards redirect to. Inlining turns that into a missing thumbnail.
   */
  const [typography, assets] = await Promise.all([
    loadFonts(),
    Promise.all(
      STORIES.map(async (story) => ({
        thumb: await inlineImage(story.imageUrl),
        avatars: (
          await Promise.all(
            story.sources.map(async (s) => {
              const url = await inlineImage(s.url);
              return url ? { url, square: !!s.square } : null;
            })
          )
        ).filter((a) => a !== null),
      }))
    ),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: "#ffffff",
          fontFamily: typography.fontFamily,
        }}
      >
        {/* Left: brand top, promise bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "500px",
            height: "100%",
            padding: "56px 48px 60px 64px",
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
          <span
            style={{
              fontSize: "88px",
              fontWeight: 700,
              color: "#0a0a0a",
              lineHeight: 0.98,
              letterSpacing: "-0.045em",
            }}
          >
            Trade the news.
          </span>
        </div>

        {/* Right: the brief itself — story cards straight off the email */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            height: "100%",
            backgroundColor: PAGE,
            borderLeft: `1px solid ${BORDER}`,
            padding: "36px 40px 0",
            gap: "22px",
            // Reads as a feed mid-scroll: the last card runs off the bottom
            // edge instead of the stack sitting centered.
            overflow: "hidden",
          }}
        >
          {STORIES.map((story, i) => (
            <div
              key={story.headline}
              style={{
                display: "flex",
                // Thumb hangs off the top of the text column, as in the
                // email (verticalAlign: top), not centered against it.
                alignItems: "flex-start",
                // Yoga shrinks overflowing children by default, which would
                // squash the stack to fit instead of bleeding.
                flexShrink: 0,
                backgroundColor: "#ffffff",
                border: `1px solid ${BORDER}`,
                borderRadius: "14px",
                padding: "26px 30px 22px",
                gap: "22px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 600,
                    color: TEXT,
                    lineHeight: 1.32,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {story.headline}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "14px",
                  }}
                >
                  {assets[i].avatars.map((s, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={s.url.slice(-24)}
                      src={s.url}
                      alt=""
                      width={AVATAR}
                      height={AVATAR}
                      style={{
                        width: `${AVATAR}px`,
                        height: `${AVATAR}px`,
                        borderRadius: s.square ? "8px" : `${AVATAR / 2}px`,
                        border: "2px solid #ffffff",
                        marginLeft: j > 0 ? "-10px" : 0,
                      }}
                    />
                  ))}
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: 400,
                      color: SECONDARY,
                      paddingLeft: assets[i].avatars.length ? "10px" : 0,
                    }}
                  >
                    {story.sourcesText}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "21px",
                    fontWeight: 400,
                    color: SECONDARY,
                    marginTop: "10px",
                  }}
                >
                  {story.meta}
                </span>
              </div>
              {assets[i].thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assets[i].thumb}
                  alt=""
                  width={THUMB}
                  height={THUMB}
                  style={{
                    width: `${THUMB}px`,
                    height: `${THUMB}px`,
                    borderRadius: "12px",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: typography.fonts, headers: OG_HEADERS }
  );
}
