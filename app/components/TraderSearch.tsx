"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../lib/constants";
import { traderLabel } from "../lib/trader";
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

export default function TraderSearch({
  onSelect,
}: {
  onSelect?: (result: SearchResult) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    const q = query.trim();
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
  }, [query]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
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

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          if (!v.trim()) {
            setResults([]);
            setOpen(false);
          }
        }}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search for a Polymarket trader"
        className="w-full rounded-md border bg-background px-4 py-2 pr-9 text-sm outline-none focus:ring-1 focus:ring-ring"
        autoComplete="off"
        spellCheck={false}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResults([]);
            setOpen(false);
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
          /
        </kbd>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-background py-1 text-left shadow-md">
          {results.map((r, i) => (
            <li
              key={r.wallet}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep input focus
                handleSelect(r);
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                i === highlight ? "bg-muted" : ""
              }`}
            >
              {r.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.profileImage}
                  alt={traderLabel(r)}
                  className="h-7 w-7 shrink-0 rounded-full bg-muted object-cover"
                />
              ) : (
                <div className="h-7 w-7 shrink-0 rounded-full bg-muted" />
              )}
              <span className="truncate text-sm">{traderLabel(r)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
