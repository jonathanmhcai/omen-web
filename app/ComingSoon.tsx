"use client";

import Image from "next/image";

export default function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <header
        className="flex items-center justify-between border-b border-border bg-background px-5"
        style={{ height: 48, flexShrink: 0 }}
      >
        <h1 className="text-lg font-semibold">Omen</h1>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-md flex-col items-center gap-7 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Omen on web is coming soon
          </h2>
          <p className="text-base text-muted-foreground">
            Download the iOS app
          </p>
          <a
            href="https://apps.apple.com/app/id6755767414"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Omen on the App Store"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Image
              src="/download-on-app-store.svg"
              alt="Download on the App Store"
              width={150}
              height={50}
              priority
              unoptimized
            />
          </a>
        </div>
      </main>

      <footer
        className="flex items-center justify-between border-t border-border bg-background px-5 text-xs text-muted-foreground/50"
        style={{ height: 28, flexShrink: 0 }}
      >
        <span />
        <span className="flex items-center gap-2">
          <a
            href="https://x.com/OmenTrading"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="mailto:support@omen.trading"
            className="hover:text-muted-foreground"
          >
            Support
          </a>
          <a
            href="https://omen.trading/terms"
            className="hover:text-muted-foreground"
          >
            Terms
          </a>
          <a
            href="https://omen.trading/privacy"
            className="hover:text-muted-foreground"
          >
            Privacy
          </a>
        </span>
      </footer>
    </div>
  );
}
