"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { MapPin } from "lucide-react";
import { useSearchEvents } from "../hooks/useSearchEvents";
import { useMapPageContext } from "./MapPageContext";
import { matchLocation, slugToDisplayName } from "./geo";
import type { PolymarketEvent } from "../lib/types";

export default function SearchModal() {
  const ctx = useMapPageContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { events, loading } = useSearchEvents(debouncedQuery);

  // Filter to only mappable events, preserve API relevancy order
  const mappableResults = useMemo(() => {
    return events
      .map((event) => {
        const match = matchLocation(event);
        if (!match) return null;
        return { event, slug: match.slug, locationName: slugToDisplayName(match.slug) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [events]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setInput("");
      setDebouncedQuery("");
    }
  }, [open]);

  const handleResultClick = useCallback(
    (slug: string, event: PolymarketEvent) => {
      ctx.flyToLocationRef.current?.(slug);
      ctx.onEvent(event, slug);
      setOpen(false);
    },
    [ctx.flyToLocationRef, ctx.onEvent]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        title="Search"
      >
        <Search className="h-4 w-4 text-foreground" />
      </button>

      {open &&
        createPortal(
          <div data-search-modal className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
              ref={panelRef}
              className="relative w-full max-w-lg mx-4 flex flex-col rounded-lg border border-border bg-popover shadow-2xl"
              style={{ height: 420 }}
            >
              {/* Search input */}
              <div className="relative flex items-center border-b border-border shrink-0">
                <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search events..."
                  className="w-full h-11 pl-10 pr-10 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {input ? (
                  <button
                    onClick={() => {
                      setInput("");
                      setDebouncedQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="absolute right-3 text-[10px] text-muted-foreground/60 border border-border rounded px-1 py-0.5">
                    ESC
                  </kbd>
                )}
              </div>

              {/* Results body */}
              <div className="flex-1 overflow-y-auto">
                {!debouncedQuery.trim() && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Search for events by name</p>
                    <p className="text-xs mt-1 opacity-60">Results will show mappable locations</p>
                  </div>
                )}

                {debouncedQuery.trim().length > 0 && loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                  </div>
                )}

                {debouncedQuery.trim().length > 0 && !loading && mappableResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">No mappable results found</p>
                    <p className="text-xs mt-1 opacity-60">Try a different search term</p>
                  </div>
                )}

                {debouncedQuery.trim().length > 0 && !loading &&
                  mappableResults.map((result) => (
                    <button
                      key={result.event.id}
                      onClick={() => handleResultClick(result.slug, result.event)}
                      className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        {result.event.image && (
                          <img
                            src={result.event.image}
                            alt=""
                            className="mt-0.5 h-8 w-8 shrink-0 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {result.event.title}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>${Math.round(result.event.volume || 0).toLocaleString()} vol</span>
                            <span>${Math.round(result.event.volume24hr || 0).toLocaleString()} 24h</span>
                            {result.event.endDate && (
                              <span>
                                Ends{" "}
                                {new Date(result.event.endDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-1 text-foreground/40">
                              <MapPin className="h-3 w-3" />
                              {result.locationName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
