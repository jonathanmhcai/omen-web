"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { API_BASE } from "../lib/constants";
import { traderLabel } from "../lib/trader";
import TraderAvatar from "./TraderAvatar";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

/**
 * Trader search bar. Search-as-you-type over Polymarket profiles
 * (username fuzzy match, or a pasted 0x address) via the server's
 * /traders/search. Results show pfp + username; ArrowUp/ArrowDown move
 * the highlight and Enter selects the highlighted row (mouse click too).
 *
 * Selecting a result opens that trader's profile at /traders/<wallet> —
 * by wallet (not name) so it always resolves, and works for ANY Polymarket
 * trader, seeded or not. `onSelect` overrides the default navigation.
 */

type SearchResult = {
  wallet: string;
  name: string | null;
  pseudonym: string | null;
  profileImage: string | null;
};

/** Unwrap a pasted polymarket.com/@handle URL and strip a leading @ before
 *  querying — without rewriting what the user sees in the input. */
function normalizeQuery(raw: string): string {
  let v = raw.trim();
  const urlMatch = v.match(/polymarket\.com\/@([^/?#\s]+)/i);
  if (urlMatch) v = urlMatch[1];
  if (v.startsWith("@")) v = v.slice(1);
  return v;
}

export default function TraderSearch({
  onSelect,
  placeholder = "Search for a Polymarket trader",
  className,
  autoFocus = false,
  initialQuery = "",
  id,
  onClear,
}: {
  onSelect?: (result: SearchResult) => void;
  /** Fired when the ✕ empties the field — lets a caller drop whatever the
   *  selection was driving (on the brief page, the brief itself). */
  onClear?: () => void;
  placeholder?: string;
  /** Merged over the wrapper — pass `max-w-none` to fill the column. */
  className?: string;
  autoFocus?: boolean;
  /** For an external <label htmlFor>. */
  id?: string;
  /** Pre-fills the input to show what's already selected. Not searched
   *  until the user edits it. Callers remount (via `key`) to reseed. */
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // The seeded value is a selection, not a search: without this the debounce
  // would fire on mount and drop the results list over the page.
  const [touched, setTouched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  // The trader the input currently stands for, if any — drives the avatar
  // in the field. Cleared implicitly by `touched`: once the query is edited
  // the input is a search again, not a selection.
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Ignore stale responses: only the latest issued request may apply.
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the results when clicking/tapping outside the search.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // "/" focuses the search, matching the events search on /stories.
  useKeyboardShortcuts([
    {
      key: "/",
      action: () => {
        inputRef.current?.focus();
      },
    },
  ]);

  // Resolve the seeded handle to a profile once, so the selected state can
  // show its pfp — the caller only has the handle from the URL. Same endpoint
  // as the typeahead (exact hit for a 0x address, username match otherwise);
  // a miss just leaves the placeholder circle.
  useEffect(() => {
    const q = normalizeQuery(initialQuery);
    if (!q) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/traders/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results?: SearchResult[] };
        const needle = q.toLowerCase();
        const hit = (data.results ?? []).find(
          (r) => r.wallet === needle || r.name?.toLowerCase() === needle
        );
        if (!cancelled && hit) setSelected(hit);
      } catch {
        // offline or a blip — the field still shows the handle
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

  useEffect(() => {
    if (!touched) return;
    const q = normalizeQuery(query);
    if (!q) return; // empty-query clearing is handled in onChange
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/traders/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results?: SearchResult[] };
        if (id !== reqId.current) return; // a newer query superseded this one
        setResults(data.results ?? []);
        setHighlight(0);
        setOpen(true);
      } catch {
        // network blip — leave the last results in place
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, touched]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    // Show the pick as the selected state straight away — navigation to the
    // brief takes a few seconds, and `touched: false` keeps the debounce
    // from searching for the label we just wrote in.
    setSelected(result);
    setQuery(traderLabel(result));
    setTouched(false);
    if (onSelect) {
      onSelect(result);
      return;
    }
    // Default: our profile page, by wallet (always resolves, any trader).
    router.push(`/traders/${result.wallet}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = results[highlight];
      if (sel) handleSelect(sel);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // The field stands for a selection only while its seeded/picked text is
  // untouched. The slot is reserved from first paint (the handle is known
  // before the profile is), so the avatar filling in shifts nothing.
  const showSelected = !touched && query !== "";

  return (
    <div ref={wrapperRef} className={cn("relative w-full max-w-md", className)}>
      {showSelected &&
        (selected ? (
          <TraderAvatar
            src={selected.profileImage}
            wallet={selected.wallet}
            alt={traderLabel(selected)}
            className="pointer-events-none absolute left-3 top-1/2 h-7 w-7 -translate-y-1/2"
          />
        ) : (
          // Still resolving the seeded handle — a plain circle, since the
          // generated gradient keys off a wallet we don't have yet.
          <span className="pointer-events-none absolute left-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-muted" />
        ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setTouched(true);
          setQuery(v);
          if (!v.trim()) {
            setResults([]);
            setOpen(false);
          }
        }}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          // Select the seeded handle so typing replaces it outright — the
          // common intent on a page that's already showing that trader.
          if (!touched && query) e.target.select();
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        // text-base (not sm) is deliberate: it's the primary control on the
        // brief page, and ≥16px is what stops iOS zooming in on focus.
        className={cn(
          "w-full rounded-md border bg-background px-4 py-2.5 pr-9 text-base outline-none focus:ring-1 focus:ring-ring",
          showSelected && "pl-12"
        )}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        // A lone text input trips password managers' save heuristics — name
        // it as a lookup and opt out explicitly.
        name="trader-search"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setTouched(true);
            setQuery("");
            setResults([]);
            setOpen(false);
            setSelected(null);
            inputRef.current?.focus();
            onClear?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        // Hidden below `sm` — there's no key to press on a touch keyboard.
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground sm:flex">
          /
        </kbd>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-background py-1 text-left shadow-md">
          {results.map((r, i) => {
            const label = traderLabel(r);
            const short = `${r.wallet.slice(0, 6)}…${r.wallet.slice(-4)}`;
            return (
              <li
                key={r.wallet}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep input focus
                  handleSelect(r);
                }}
                // px-4 puts the avatar on the input's own text inset; py-1.5
                // keeps a row (40px) about as tall as the field above it.
                className={`flex cursor-pointer items-center gap-3 px-4 py-1.5 ${
                  i === highlight ? "bg-muted" : ""
                }`}
              >
                <TraderAvatar
                  src={r.profileImage}
                  wallet={r.wallet}
                  alt={label}
                  className="h-7 w-7 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                {/* Anchors the right end of a full-width row, and separates
                 *  traders sharing a username. Skipped when the label already
                 *  fell back to this same wallet. */}
                {label !== short && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {short}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
