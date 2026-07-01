import Link from "next/link";
import SiteChrome from "./components/SiteChrome";

/**
 * Bare landing page — two entry points: the trader directory (`/traders`)
 * and the signals feed (`/stories`).
 */
export default function Home() {
  return (
    <SiteChrome>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex items-center gap-4">
          <Link
            href="/traders"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Traders
          </Link>
          <Link
            href="/stories"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            News
          </Link>
          <Link
            href="https://omen.trading/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Mobile app
          </Link>
        </div>
      </main>
    </SiteChrome>
  );
}
