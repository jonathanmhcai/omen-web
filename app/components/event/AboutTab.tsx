"use client";

import { PolymarketEvent } from "../../lib/types";
import { formatDateOnly, formatDollars } from "../../lib/format";

/**
 * Event metadata rows — mirrors the mobile About tab (volume,
 * liquidity, lifecycle dates). The description used to live here as
 * a "Rules" section but is now rendered directly under the chart by
 * `EventDescription` (matches the mobile layout where the rules sit
 * right below the chart for at-a-glance reading).
 */
export function AboutTab({ event }: { event: PolymarketEvent }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Volume", value: formatDollars(event.volume) },
    { label: "24hr Volume", value: formatDollars(event.volume24hr) },
    { label: "Liquidity", value: formatDollars(event.liquidity) },
    { label: "Created", value: formatDateOnly(event.creationDate) || "—" },
    { label: "Start", value: formatDateOnly(event.startDate) || "—" },
    { label: "End", value: formatDateOnly(event.endDate) || "—" },
  ];
  return (
    <dl className="flex flex-col text-sm [&>*:nth-child(odd)]:bg-black/5 dark:[&>*:nth-child(odd)]:bg-white/5 [&>*]:rounded-md">
      {rows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
    </dl>
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
