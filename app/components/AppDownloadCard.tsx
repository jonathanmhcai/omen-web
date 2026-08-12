const WAITLIST_URL = "https://forms.gle/YTNDitkBSzWpAWnFA";

/**
 * Waitlist card for the sidebar, carrying omen-website's hero copy so the
 * pitch reads the same wherever someone meets it.
 *
 * One shape, unlike the App Store card it replaced
 * (components/deprecated/AppDownloadCard.tsx): that one needed a separate
 * compact variant because showing a QR code to a phone is pointless. A
 * preview, a tagline and a button work at any width.
 */
export default function AppDownloadCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {/* Served straight from public/, no /_next/image in the way. The
         *  files are pre-cropped to this box (224x256, ~60KB) rather than
         *  the 2160x3840 originals the old card shipped whole. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/app-preview-thumb.png"
          alt="Omen on iPhone"
          width={56}
          height={64}
          className="h-16 w-14 shrink-0 rounded-xl object-cover object-top dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/app-preview-thumb-dark.png"
          alt="Omen on iPhone"
          width={56}
          height={64}
          className="hidden h-16 w-14 shrink-0 rounded-xl object-cover object-top dark:block"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-semibold leading-snug tracking-tight">
            Trade Polymarket on mobile
          </h2>
          <p className="text-xs leading-snug text-muted-foreground">
            Real-time news alerts, instant execution
          </p>
        </div>
      </div>

      <a
        href={WAITLIST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Join waitlist
      </a>
    </div>
  );
}
