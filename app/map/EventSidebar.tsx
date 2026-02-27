import { PolymarketEvent } from "../lib/types";

interface EventSidebarProps {
  country: string;
  events: PolymarketEvent[];
  onClose: () => void;
}

export default function EventSidebar({ country, events, onClose }: EventSidebarProps) {
  const sorted = [...events].sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0));
  return (
    <div className="absolute right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-black/10 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-semibold capitalize text-zinc-900">{country}</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:text-zinc-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((e) => (
          <div
            key={e.id}
            className="border-b border-black/5 px-4 py-3 hover:bg-zinc-50"
          >
            <p className="text-sm font-medium text-zinc-900">{e.title}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              <span>${Math.round(e.volume || 0).toLocaleString()} vol</span>
              <span>${Math.round(e.volume24hr || 0).toLocaleString()} 24h</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-black/10 px-4 py-2 text-xs text-zinc-400">
        {events.length} events
      </div>
    </div>
  );
}
