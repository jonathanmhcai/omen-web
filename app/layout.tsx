import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Omen | Trade the news",
    template: "%s | Omen",
  },
  description: "News moving your Polymarket positions.",
  metadataBase: new URL("https://app.omen.trading"),
  openGraph: {
    title: "Omen | Trade the news",
    description: "News moving your Polymarket positions.",
    siteName: "Omen",
    url: "https://app.omen.trading",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Omen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Omen | Trade the news",
    description: "News moving your Polymarket positions.",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Request cookies, threaded into react-cookie's provider so SSR sees
  // the session cookie. Lets the chrome render the correct auth
  // affordances (Settings cog vs Log in) in the first HTML instead of
  // popping them in after hydration. Reading cookies() opts every route
  // into per-request rendering — fine at our scale, and most pages were
  // dynamic already.
  const cookieHeader = (await cookies()).toString();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/omen-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Light by default; dark only as an explicit /settings choice.
                try {
                  if (localStorage.getItem('theme') === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers cookieHeader={cookieHeader}>{children}</Providers>
        <Toaster position="bottom-right" expand richColors />
      </body>
    </html>
  );
}
