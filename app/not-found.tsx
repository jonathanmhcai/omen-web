import Link from "next/link";
import SiteChrome from "./components/SiteChrome";

/**
 * App-wide 404. The root layout renders no chrome of its own (each page
 * brings AppShell or SiteChrome), so without this file a bad URL lands
 * on Next's bare default — no nav, no way back in.
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          This page doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </main>
    </SiteChrome>
  );
}
