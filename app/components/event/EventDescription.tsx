"use client";

import { ReactNode, useMemo, useState } from "react";

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

/**
 * Collapsible event description used directly below the chart on the
 * event-detail page (mirrors mobile's `ExpandableDescription`, which
 * is placed below the chart rather than tucked inside an About tab).
 * `collapsedLines` matches the mobile default of 3 — small enough to
 * not crowd the chart, large enough to convey context.
 */
export function EventDescription({
  text,
  collapsedLines = 3,
}: {
  text: string;
  collapsedLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = useMemo(() => linkifyText(text), [text]);
  return (
    <div>
      <p
        className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
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
