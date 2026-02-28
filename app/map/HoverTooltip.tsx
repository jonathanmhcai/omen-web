interface HoverTooltipProps {
  x: number;
  y: number;
  locations: string[];
  eventCount: number;
  volume24hr: number;
}

function formatLocationName(slug: string): string {
  if (slug === "us-washington-dc") return "United States";
  const name = slug.startsWith("us-") ? slug.slice(3) : slug;
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatClusterLabel(locations: string[]): string {
  // All US states → just "United States"
  if (locations.every((l) => l.startsWith("us-"))) return "United States";

  const MAX_NAMED = 2;
  const names = locations.map(formatLocationName);
  if (names.length <= MAX_NAMED) return names.join(", ");
  return `${names.slice(0, MAX_NAMED).join(", ")} + ${names.length - MAX_NAMED} more`;
}

export default function HoverTooltip({ x, y, locations, eventCount, volume24hr }: HoverTooltipProps) {
  const label = locations.length === 1 ? formatLocationName(locations[0]) : formatClusterLabel(locations);

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg bg-popover px-3 py-2 shadow-lg border border-border"
      style={{ left: x + 12, top: y - 12 }}
    >
      <p className="text-sm font-semibold text-popover-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        {eventCount > 0
          ? `${eventCount} events \u00b7 $${Math.round(volume24hr).toLocaleString()} 24h`
          : "No activity"}
      </p>
    </div>
  );
}
