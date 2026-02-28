import type { Metadata } from "next";
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
    default: "Omen",
    template: "%s | Omen",
  },
  description: "Monitor the situation.",
  metadataBase: new URL("https://app.omen.trading"),
  openGraph: {
    title: "Omen",
    description: "Monitor the situation.",
    siteName: "Omen",
    url: "https://app.omen.trading",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Omen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Omen",
    description: "Monitor the situation.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = stored ? stored === 'dark' : true;
                  if (prefersDark) {
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
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" expand richColors />
      </body>
    </html>
  );
}
