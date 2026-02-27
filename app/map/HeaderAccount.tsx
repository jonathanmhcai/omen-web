"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import { useMapPageContext } from "./MapPageContext";

export default function HeaderAccount() {
  const { logout, user: privyUser } = usePrivy();
  const { user } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const ctx = useMapPageContext();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Balance */}
      {balance !== null && (
        <div className="rounded-full bg-secondary px-3 py-1.5 border border-border text-sm font-medium text-emerald-600">
          ${balance.toFixed(2)}
        </div>
      )}

      {/* Positions */}
      {positions.data && posCount > 0 && (
        <button
          onClick={() => { ctx.onPositionsToggle(); setShowSettings(false); }}
          className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 border border-border text-sm transition-colors hover:bg-accent"
        >
          <span className="text-secondary-foreground">{posCount} positions</span>
          <span className="font-medium text-foreground">${posValue.toFixed(2)}</span>
        </button>
      )}

      {/* Account */}
      <div className="relative">
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 border border-border text-sm transition-colors hover:bg-accent"
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {initials}
            </div>
          )}
          {displayName && (
            <span className="font-medium text-foreground">{displayName}</span>
          )}
          {user.username && user.display_name && (
            <span className="text-muted-foreground">@{user.username}</span>
          )}
        </button>

        {showSettings && (
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg bg-popover/90 backdrop-blur-sm shadow-lg border border-border overflow-hidden">
            <div className="border-b border-border px-3 py-2.5 text-sm">
              {privyUser?.email?.address && (
                <p className="font-medium text-foreground">{privyUser.email.address}</p>
              )}
              {privyUser?.wallet?.address && (
                <p className="text-xs text-muted-foreground">
                  {privyUser.wallet.address.slice(0, 6)}...{privyUser.wallet.address.slice(-4)}
                </p>
              )}
              {privyUser?.id && !privyUser?.email?.address && !privyUser?.wallet?.address && (
                <p className="text-xs text-muted-foreground">{privyUser.id}</p>
              )}
            </div>
            <div className="flex flex-col py-1">
              {user.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                Dark mode
                <span className="text-xs text-muted-foreground">{darkMode ? "On" : "Off"}</span>
              </button>
              <button
                onClick={() => { setShowSettings(false); logout(); }}
                className="px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
