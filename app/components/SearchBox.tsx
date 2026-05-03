"use client";

import { Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useSearchEvents } from "../hooks/useSearchEvents";

const RECENT_SEARCHES_KEY = "omen_recent_searches_v2";
const MAX_RECENT = 5;

interface RecentEntry {
  slug: string;
  title: string;
  image?: string;
}

export default function SearchBox() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useLocalStorage<RecentEntry[]>(
    RECENT_SEARCHES_KEY,
    []
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (input.trim().length === 0) return;
    const t = setTimeout(() => setDebouncedQuery(input), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { events, loading } = useSearchEvents(debouncedQuery, "active");

  const hasQuery = debouncedQuery.trim().length > 0;

  const items = useMemo<RecentEntry[]>(() => {
    if (hasQuery) {
      return events.map((e) => ({ slug: e.slug, title: e.title, image: e.image }));
    }
    return recentSearches ?? [];
  }, [hasQuery, events, recentSearches]);

  // Reset/clamp the highlight when the result set changes — done during render
  // (not in an effect) to avoid a cascading re-render.
  const [lastSignature, setLastSignature] = useState("");
  const signature = `${debouncedQuery}|${items.length}`;
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setHighlightedIdx(0);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useKeyboardShortcuts([
    {
      key: "/",
      action: () => {
        inputRef.current?.focus();
        setOpen(true);
      },
    },
  ]);

  const recordRecent = useCallback(
    (entry: RecentEntry) => {
      setRecentSearches((prev) => {
        const list = prev ?? [];
        const filtered = list.filter((e) => e.slug !== entry.slug);
        return [entry, ...filtered].slice(0, MAX_RECENT);
      });
    },
    [setRecentSearches]
  );

  const navigateTo = useCallback(
    (entry: RecentEntry) => {
      recordRecent(entry);
      setOpen(false);
      setInput("");
      setDebouncedQuery("");
      router.push(`/event/${entry.slug}`);
    },
    [recordRecent, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      const next = Math.min(highlightedIdx + 1, items.length - 1);
      setHighlightedIdx(next);
      itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      const next = Math.max(highlightedIdx - 1, 0);
      setHighlightedIdx(next);
      itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      const item = items[highlightedIdx];
      if (item) {
        e.preventDefault();
        navigateTo(item);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (input) {
        setInput("");
        setDebouncedQuery("");
      } else {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  const showDropdown = open && (hasQuery || items.length > 0);

  const renderRows = (list: RecentEntry[], keyPrefix: string) =>
    list.map((item, i) => (
      <ResultRow
        key={`${keyPrefix}-${item.slug}`}
        refCallback={(el) => {
          itemRefs.current[i] = el;
        }}
        entry={item}
        highlighted={i === highlightedIdx}
        onMouseEnter={() => setHighlightedIdx(i)}
        onSelect={() => navigateTo(item)}
      />
    ));

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            if (v.trim().length === 0) setDebouncedQuery("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search events..."
          className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
        {input ? (
          <button
            onClick={() => {
              setInput("");
              setDebouncedQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground/60">
            /
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {hasQuery ? (
            <>
              {loading && items.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Searching…
                </div>
              )}
              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center text-xs text-muted-foreground">
                  <SearchX className="h-5 w-5 opacity-40" />
                  <span>No events found</span>
                </div>
              )}
              {renderRows(items, "r")}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <span className="text-xs text-muted-foreground">
                  Recent searches
                </span>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {renderRows(items, "recent")}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  entry,
  highlighted,
  onMouseEnter,
  onSelect,
  refCallback,
}: {
  entry: RecentEntry;
  highlighted: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
  refCallback: (el: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      ref={refCallback}
      href={`/event/${entry.slug}`}
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onSelect();
      }}
      className={`flex items-center gap-2 px-3 py-2 ${
        highlighted ? "bg-accent" : "hover:bg-accent/60"
      }`}
    >
      {entry.image ? (
        <img
          src={entry.image}
          alt=""
          className="h-6 w-6 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-6 w-6 shrink-0 rounded bg-muted" />
      )}
      <span className="truncate text-sm text-foreground">{entry.title}</span>
    </Link>
  );
}
