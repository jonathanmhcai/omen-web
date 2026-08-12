import { Mail } from "lucide-react";

/**
 * Page header for the daily brief: date eyebrow, title, one-line subtitle,
 * and the trader lookup as `children`. The lookup lives inside the card
 * because it scopes everything below it — as a bare field between cards it
 * read as decoration rather than the page's control.
 */
export default function BriefHero({ children }: { children: React.ReactNode }) {
  // ET, not the server's zone: the brief is a 9am ET product, so the date
  // on the page should be the date on the email.
  const date = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative rounded-xl border border-border bg-card px-5 py-6 sm:px-6 sm:py-7">
      {/* The clip lives on this wrapper, not the card: the card must not
       *  clip its children or it eats the lookup's results dropdown.
       *  Decorative, cropped by the top-right corner — it sits beside the
       *  title block, clear of the full-width control below. Thin stroke:
       *  lucide's default weight reads as a heavy blob at this size. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      >
        <Mail
          strokeWidth={1}
          className="absolute -right-7 -top-7 h-28 w-28 -rotate-12 text-muted-foreground/15 sm:h-36 sm:w-36 sm:text-muted-foreground/25"
        />
      </div>
      <div className="relative flex flex-col gap-1.5 pr-16 sm:pr-28">
        <p className="text-xs text-muted-foreground">{date}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Daily brief</h1>
        <p className="text-sm text-muted-foreground">
          News on your Polymarket positions.
        </p>
      </div>
      <div className="relative mt-5">{children}</div>
    </div>
  );
}
