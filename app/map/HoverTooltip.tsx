interface HoverTooltipProps {
  x: number;
  y: number;
  country: string;
  eventCount: number;
}

export default function HoverTooltip({ x, y, country, eventCount }: HoverTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg bg-white px-3 py-2 shadow-lg border border-black/10"
      style={{ left: x + 12, top: y - 12 }}
    >
      <p className="text-sm font-semibold capitalize text-zinc-900">{country}</p>
      <p className="text-xs text-zinc-500">{eventCount} events</p>
    </div>
  );
}
