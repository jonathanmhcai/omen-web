interface HoverTooltipProps {
  x: number;
  y: number;
  location: string;
  eventCount: number;
  volume24hr: number;
}

function formatLocationName(slug: string): string {
  const name = slug.startsWith("us-") ? slug.slice(3) : slug;
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HoverTooltip({ x, y, location, eventCount, volume24hr }: HoverTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg bg-white px-3 py-2 shadow-lg border border-black/10"
      style={{ left: x + 12, top: y - 12 }}
    >
      <p className="text-sm font-semibold text-zinc-900">{formatLocationName(location)}</p>
      <p className="text-xs text-zinc-500">{eventCount} events &middot; ${Math.round(volume24hr).toLocaleString()} 24h</p>
    </div>
  );
}
