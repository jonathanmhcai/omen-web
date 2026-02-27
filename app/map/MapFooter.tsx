"use client";

import { useState } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import PositionsCard from "./PositionsCard";

export default function MapFooter() {
  const { user } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const [showPositions, setShowPositions] = useState(false);

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  return (
    <div className="absolute bottom-0 left-0 z-50 flex flex-col items-start gap-2 p-4">
      {user && showPositions && (
        <PositionsCard data={positions.data} loading={positions.loading} error={positions.error} onClose={() => setShowPositions(false)} />
      )}
      {user && (
        <button
          onClick={() => setShowPositions((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-black/5 transition-colors hover:bg-white/95"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
              {initials}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            {displayName && (
              <span className="font-medium text-zinc-900">{displayName}</span>
            )}
            {user.username && user.display_name && (
              <span className="text-zinc-400">@{user.username}</span>
            )}
            {balance !== null && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="font-medium text-emerald-600">${balance.toFixed(2)}</span>
              </>
            )}
            {positions.data && posCount > 0 && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="text-zinc-400">{posCount} pos</span>
                <span className="text-zinc-400">${posValue.toFixed(2)}</span>
              </>
            )}
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-0.5 text-zinc-400 transition-transform ${showPositions ? "rotate-180" : ""}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}
