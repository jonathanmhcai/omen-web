import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const geistBold = await fetch(
    new URL(
      "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.woff"
    )
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          backgroundColor: "#000000",
          padding: 60,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontFamily: "Geist",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          Omen
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Geist",
          data: geistBold,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    }
  );
}
