"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import TraderSearch from "../TraderSearch";
import { capture } from "../../lib/analytics";

// Known-good examples from the trader directory's seed list (Polymarket
// usernames, not X handles) — all verified to resolve and produce briefs
// with stories.
const EXAMPLE_TRADERS = [
  "ImJustKen",
  "aenews2",
  "prophet.notes",
  "MEPP",
] as const;

/**
 * Trader lookup for the daily brief — the shared TraderSearch typeahead
 * (debounced search-as-you-type, pfp results, arrow keys, `/` to focus),
 * pointed at /?user=<handle> instead of the trader's profile. The URL is
 * the state, so results are shareable and back/reload behave.
 *
 * The label says which trader the page below belongs to, so the selected
 * state reads as the report's subject rather than as leftover input.
 * Lowercased so shared links dedupe against the server's per-handle cache;
 * the wallet stands in when a profile has no username.
 */
export default function BriefLookup({ initial }: { initial: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label htmlFor="brief-trader" className="text-xs font-medium">
          {initial
            ? "Selected Polymarket user"
            : "Enter your Polymarket username"}
        </label>
        {/* Suggestions are for a visitor with nothing on screen yet; once a
            brief is up they'd invite you away from what you asked for. */}
        {!initial && (
          <p className="text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline-block h-3 w-3 align-[-1px]" />
            Try{" "}
            {EXAMPLE_TRADERS.map((handle, i) => (
              <span key={handle}>
                {i > 0 && (i === EXAMPLE_TRADERS.length - 1 ? ", or " : ", ")}
                <Link
                  href={`/?user=${encodeURIComponent(handle)}`}
                  className="underline hover:text-foreground"
                >
                  {handle}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <TraderSearch
        id="brief-trader"
        className="max-w-none"
        placeholder="Polymarket username or 0x address"
        // Whose brief is on screen — the page.tsx `key` reseeds it on nav.
        initialQuery={initial}
        // The landing's primary action. On a brief page the reader came to
        // read, so don't steal focus from the brief.
        autoFocus={initial === ""}
        onSelect={(result) => {
          const handle = (result.name ?? result.wallet).toLowerCase();
          capture("brief_lookup_submitted", { handle });
          startTransition(() => {
            router.push(`/?user=${encodeURIComponent(handle)}`);
          });
        }}
        // Clearing the field drops the brief with it — the URL is the state,
        // so an empty input showing someone's brief would be a lie.
        onClear={
          initial
            ? () => startTransition(() => router.push("/"))
            : undefined
        }
      />

      {/* Generation takes a few seconds; the skeleton only appears once the
          new route commits, so hold the wait visible until then. */}
      {isPending && (
        <p className="mt-2 text-xs text-muted-foreground">Generating brief…</p>
      )}
    </div>
  );
}
