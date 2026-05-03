"use client";

import { ReactNode, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PolymarketEvent } from "../../lib/types";
import { formatDollars } from "../../lib/format";

// Match http(s) URLs; trailing punctuation is split off so a URL at the
// end of a sentence doesn't capture the period/paren/etc. Mirrors the
// regex pair used by mobile's ExpandableDescription.
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCTUATION_REGEX = /[),.;\]]+$/;

function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_REGEX)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    const trailing = match[0].match(TRAILING_PUNCTUATION_REGEX)?.[0] ?? "";
    const url = trailing ? match[0].slice(0, -trailing.length) : match[0];
    if (url) {
      nodes.push(
        <a
          key={`l-${start}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {url}
        </a>
      );
    }
    if (trailing) nodes.push(trailing);
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const content = useMemo(() => linkifyText(text), [text]);
  return (
    <div>
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground ${
          expanded ? "" : "line-clamp-5"
        }`}
      >
        {content}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-sm font-medium text-primary hover:opacity-80"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}

export function AboutTab({ event }: { event: PolymarketEvent }) {
  return (
    <div className="flex flex-col gap-6">
      {event.description && (
        <section>
          <h3 className="mb-3 text-lg font-semibold">Rules</h3>
          <ExpandableText text={event.description} />
        </section>
      )}

      <section>
        <h3 className="mb-3 text-lg font-semibold">Details</h3>
        <dl className="flex flex-col text-sm [&>*:nth-child(odd)]:bg-black/5 dark:[&>*:nth-child(odd)]:bg-white/5 [&>*]:rounded-md">
          <DetailRow label="Volume" value={formatDollars(event.volume)} />
          <DetailRow label="24hr Volume" value={formatDollars(event.volume24hr)} />
          <DetailRow label="Liquidity" value={formatDollars(event.liquidity)} />
          {event.slug && (
            <a
              href={`https://polymarket.com/event/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 hover:opacity-80"
            >
              <dt className="font-medium text-muted-foreground">Resolution</dt>
              <dd className="flex items-center gap-1">
                <span>Polymarket</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </dd>
            </a>
          )}
        </dl>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
