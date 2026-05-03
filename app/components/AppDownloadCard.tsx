"use client";

import { Star } from "lucide-react";
import { QRCode } from "react-qrcode-logo";

const APP_STORE_URL = "https://apps.apple.com/app/id6755767414";

export default function AppDownloadCard() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
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
      </div>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Omen on the App Store"
        className="rounded-2xl bg-white p-1.5"
      >
        <QRCode
          value={APP_STORE_URL}
          size={180}
          bgColor="#ffffff"
          fgColor="#000000"
          qrStyle="dots"
          eyeRadius={6}
          ecLevel="H"
          logoImage="/omen-icon.png"
          logoWidth={44}
          logoHeight={44}
          logoPadding={4}
          logoPaddingStyle="square"
          removeQrCodeBehindLogo
        />
      </a>
    </div>
  );
}
