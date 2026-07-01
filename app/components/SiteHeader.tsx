import Link from "next/link";

/**
 * Marketing-style top header — the Omen wordmark linking home. Mirrors
 * omen-website's header, themed for omen-web (no hardcoded white bg / black
 * text, so it works in dark mode). Used by SiteChrome on the bare public
 * pages (landing, /traders); AppShell pages have their own nav.
 */
export default function SiteHeader() {
  return (
    <header className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-full py-4 md:max-w-5xl xl:max-w-6xl">
        <Link href="/" className="inline-block">
          <span className="text-2xl font-semibold tracking-wide">Omen</span>
        </Link>
      </div>
    </header>
  );
}
