import { ImageResponse } from "next/og";

export const runtime = "edge";

const PHONE_MOCK_URL = "https://omen.trading/phone-mock.png";

async function loadGoogleFont(font: string, weight: number = 400) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&display=swap`;
  const css = await fetch(url).then((res) => res.text());
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.ok) {
      return await response.arrayBuffer();
    }
  }
  throw new Error("Failed to load font data");
}

export async function GET() {
  try {
    let fontData: ArrayBuffer | null = null;
    try {
      fontData = await loadGoogleFont("Inter", 600);
    } catch {
      console.log("Font loading failed, will use fallback");
    }

    const fontFamily = fontData ? "Inter" : "Inter, system-ui, sans-serif";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "flex-start",
            backgroundColor: "#ffffff",
            padding: "0 80px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              height: "100%",
              justifyContent: "center",
              gap: "24px",
              paddingRight: "40px",
            }}
          >
            <span
              style={{
                fontSize: "104px",
                fontWeight: 600,
                color: "#111111",
                fontFamily,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Omen
            </span>
            <span
              style={{
                fontSize: "40px",
                fontWeight: 600,
                color: "#444444",
                fontFamily,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                maxWidth: "560px",
              }}
            >
              Prediction markets across sports, politics, and culture.
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHONE_MOCK_URL}
            alt="Omen on iPhone"
            width={450}
            height={800}
            style={{
              width: "450px",
              height: "800px",
              marginTop: "50px",
              objectFit: "contain",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData
          ? [
              {
                name: "Inter",
                data: fontData,
                style: "normal" as const,
                weight: 600 as const,
              },
            ]
          : [],
      }
    );
  } catch (e: unknown) {
    console.log(
      `Error generating OG image: ${e instanceof Error ? e.message : "Unknown error"}`
    );
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}
