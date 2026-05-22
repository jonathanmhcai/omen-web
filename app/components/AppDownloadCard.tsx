"use client";

import { ChevronRight, Star } from "lucide-react";
import { QRCode } from "react-qrcode-logo";

const APP_STORE_URL = "https://apps.apple.com/app/id6755767414";

/**
 * Promo card for the iOS app. Two shapes:
 *
 * - Default (desktop right sidebar): preview thumb + title + QR code
 *   that the user scans with their phone. Not directly tappable —
 *   the QR is the affordance.
 * - `compact` (mobile right-slot, where there's no point in showing a
 *   QR to a phone user): preview thumb + title in a horizontal row
 *   with a chevron; the whole card is an <a> to the App Store.
 */
export default function AppDownloadCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const heroAndText = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-preview.png"
        alt=""
        className="block h-16 w-14 shrink-0 rounded-xl object-cover object-top dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-preview-dark.png"
        alt=""
        className="hidden h-16 w-14 shrink-0 rounded-xl object-cover object-top dark:block"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Available on iOS
        </span>
        <h2 className="text-base font-semibold">Get Omen</h2>
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="h-3 w-3 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">5.0</span>
        </div>
      </div>
    </>
  );

  if (compact) {
    return (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent active:bg-accent"
      >
        {heroAndText}
        <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
      </a>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">{heroAndText}</div>
      <div
        aria-label="Scan to open Omen on the App Store"
        className="relative rounded-2xl bg-white p-1.5"
      >
        <QRCode
          value={APP_STORE_URL}
          size={180}
          bgColor="#ffffff"
          fgColor="#000000"
          qrStyle="dots"
          eyeRadius={6}
          ecLevel="H"
        />
        {/* Render the center icon as a sibling <img> rather than via
            QRCode's logoImage. The library composites logoImage onto
            the canvas async, so on each remount (each page nav rebuilds
            AppShell) the icon blinked out for a frame. ecLevel "H"
            tolerates ~30% obstruction, so we don't need
            removeQrCodeBehindLogo to keep scans working. */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/omen-icon.png" alt="" className="block h-[46px] w-[46px]" />
          </span>
        </span>
      </div>
    </div>
  );
}
