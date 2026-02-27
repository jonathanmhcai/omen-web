"use client";

import { useState } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import PositionsCard from "./PositionsCard";

export default function HeaderAccount() {
  const { user } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const [showPositions, setShowPositions] = useState(false);

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Balance */}
      {balance !== null && (
        <div className="rounded-full bg-zinc-50 px-3 py-1.5 border border-black/5 text-sm font-medium text-emerald-600">
          ${balance.toFixed(2)}
        </div>
      )}

      {/* Positions */}
      {positions.data && posCount > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowPositions((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1.5 border border-black/5 text-sm transition-colors hover:bg-zinc-100"
          >
            <span className="text-zinc-700">{posCount} pos</span>
            <span className="font-medium text-zinc-900">${posValue.toFixed(2)}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-zinc-400 transition-transform ${showPositions ? "rotate-180" : ""}`}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          {showPositions && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <PositionsCard data={positions.data} loading={positions.loading} error={positions.error} onClose={() => setShowPositions(false)} />
            </div>
          )}
        </div>
      )}

      {/* Account */}
      <div className="flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1.5 border border-black/5 text-sm">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
            {initials}
          </div>
        )}
        {displayName && (
          <span className="font-medium text-zinc-900">{displayName}</span>
        )}
        {user.username && user.display_name && (
          <span className="text-zinc-400">@{user.username}</span>
        )}
      </div>
    </div>
  );
}
