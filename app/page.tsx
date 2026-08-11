import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import SiteChrome from "./components/SiteChrome";

/**
 * Bare landing page — a stacked list of entry-point cards: the trader
 * directory (`/traders`), the signals feed (`/stories`), and the mobile app.
 */
const ENTRIES = [
  {
    href: "/traders",
    external: false,
    icon: "/traders-illustration.png",
    title: "Traders",
    subtitle: "Directory of top Polymarket creators",
  },
  {
    href: "/stories",
    external: false,
    icon: "/news-illustration.png",
    title: "News",
    subtitle: "News feed matched to markets",
  },
  {
    href: "/daily-brief",
    external: false,
    icon: "/brief-illustration.png",
    title: "Daily brief",
    subtitle: "Daily news on your positions",
  },
  {
    href: "https://omen.trading/",
    external: true,
    icon: "/mobile-illustration.png",
    title: "App",
    subtitle: "Get Omen on iOS",
  },
] as const;

export default function Home() {
  return (
    <SiteChrome showHeader={false}>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-4xl flex-col gap-10 md:flex-row md:items-stretch md:gap-14">
          <div className="flex flex-1 flex-col justify-center gap-2 text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              Omen Trading
            </h1>
            <p className="text-muted-foreground">
              Signals for prediction market traders
            </p>
          </div>
          <div className="hidden w-px self-stretch bg-border md:block" />
          <div className="flex w-full flex-col gap-3 md:max-w-sm">
            {ENTRIES.map((entry) => {
              const TrailingIcon = entry.external ? ArrowUpRight : ChevronRight;
              return (
                <Link
                  key={entry.title}
                  href={entry.href}
                  {...(entry.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent active:bg-accent"
                >
                  <Image
                    src={entry.icon}
                    alt=""
                    width={44}
                    height={44}
                    priority
                    className="shrink-0 transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{entry.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.subtitle}
                    </span>
                  </div>
                  <TrailingIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </SiteChrome>
  );
}
