"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { capture } from "../../lib/analytics";

/**
 * Handle input for the daily brief. Submitting navigates to
 * /?user=<handle> (lowercased so shared links dedupe against the
 * server's per-handle cache) — the URL is the state, so results are
 * shareable and back/reload behave. Accepts pasted @handles and
 * polymarket.com profile URLs.
 */

/** trim, unwrap polymarket.com/@handle URLs, strip a leading @, lowercase. */
function normalize(raw: string): string {
  let v = raw.trim();
  const urlMatch = v.match(/polymarket\.com\/@([^/?#\s]+)/i);
  if (urlMatch) v = urlMatch[1];
  if (v.startsWith("@")) v = v.slice(1);
  return v.toLowerCase();
}

export default function BriefLookup({ initial }: { initial: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const current = initial.toLowerCase();
  const normalized = normalize(value);
  // Already viewing this trader's brief — the only visibly-disabled state.
  // An empty input keeps the button enabled (submit is just a no-op) so the
  // resting page doesn't open on a grayed-out control.
  const sameAsCurrent = normalized !== "" && normalized === current;

  function submit() {
    if (normalized === "" || sameAsCurrent || isPending) return;
    capture("brief_lookup_submitted", { handle: normalized });
    startTransition(() => {
      router.push(`/?user=${encodeURIComponent(normalized)}`);
    });
  }

  function clear() {
    setValue("");
    inputRef.current?.focus();
    // Clearing while viewing a brief reverts to the landing immediately.
    if (initial) {
      startTransition(() => {
        router.push("/");
      });
    }
  }

  return (
    <form
      className="flex w-full max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="relative w-full">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          autoFocus={initial === ""}
          placeholder="Enter Polymarket username or address"
          className="w-full rounded-md border bg-background px-4 py-2 pr-9 text-sm outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          // A lone text input in a form trips password managers' save
          // heuristics — name it as a lookup and opt out explicitly.
          name="polymarket-handle"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
        {value !== "" && (
          <button
            type="button"
            aria-label="Clear"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={sameAsCurrent || isPending}
        className="shrink-0 cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-default disabled:opacity-50"
      >
        {isPending ? "Generating…" : "Generate brief"}
      </button>
    </form>
  );
}
