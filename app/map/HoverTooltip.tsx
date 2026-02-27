interface HoverTooltipProps {
  x: number;
  y: number;
  country: string;
  eventCount: number;
  volume24hr: number;
}

export default function HoverTooltip({ x, y, country, eventCount, volume24hr }: HoverTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg bg-white px-3 py-2 shadow-lg border border-black/10"
      style={{ left: x + 12, top: y - 12 }}
    >
      <p className="text-sm font-semibold capitalize text-zinc-900">{country}</p>
      <p className="text-xs text-zinc-500">{eventCount} events &middot; ${Math.round(volume24hr).toLocaleString()} 24h</p>
    </div>
  );
}
