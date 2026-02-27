"use client";

import { useAuthUser } from "../hooks/useAuthUser";

export default function MapFooter() {
  const { user } = useAuthUser();

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="absolute bottom-0 left-0 z-50 flex items-center gap-3 p-4">
      {user && (
        <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-black/5">
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
          </div>
        </div>
      )}
    </div>
  );
}
