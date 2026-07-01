import Image from "next/image";
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
            className="group inline-flex flex-col items-center gap-2"
          >
            <Image
              src="/traders-illustration.png"
              alt="Traders"
              width={112}
              height={112}
              priority
              className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
            />
            <span className="text-sm font-medium">Traders</span>
          </Link>
          <Link
            href="/stories"
            className="group inline-flex flex-col items-center gap-2"
          >
            <Image
              src="/news-illustration.png"
              alt="News"
              width={112}
              height={112}
              priority
              className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
            />
            <span className="text-sm font-medium">News</span>
          </Link>
          <Link
            href="https://omen.trading/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-col items-center gap-2"
          >
            <Image
              src="/mobile-illustration.png"
              alt="Mobile app"
              width={112}
              height={112}
              priority
              className="transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
            />
            <span className="text-sm font-medium">Mobile app</span>
          </Link>
        </div>
      </main>
    </SiteChrome>
  );
}
