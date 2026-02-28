"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import { useMapPageContext } from "./MapPageContext";
import { Wallet, BarChart3, Settings, Sun, Moon, Globe, Map } from "lucide-react";

export default function HeaderAccount() {
  const { logout, user: privyUser } = usePrivy();
  const { user } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const ctx = useMapPageContext();
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  if (!user) return null;

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {/* Balance */}
      {balance !== null && (
        <div className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground">
          <Wallet className="h-3.5 w-3.5" />
          ${balance.toFixed(2)}
        </div>
      )}

      {/* Positions */}
      {positions.data && posCount > 0 && (
        <button
          onClick={() => { ctx.onPositionsToggle(); setShowAccount(false); setShowSettings(false); }}
          className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground transition-colors hover:text-foreground"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{posCount}</span>
          <span className="font-medium text-foreground">${posValue.toFixed(2)}</span>
        </button>
      )}

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => { setShowSettings((v) => !v); setShowAccount(false); }}
          className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-4 w-4 text-foreground" />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg bg-popover/90 backdrop-blur-sm shadow-lg border border-border overflow-hidden">
            <div className="flex flex-col py-1">
              <button
                onClick={ctx.toggleDarkMode}
                className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {ctx.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  Theme
                </span>
                <span className="text-xs text-muted-foreground">{ctx.darkMode ? "Dark" : "Light"}</span>
              </button>
              <button
                onClick={ctx.toggleProjection}
                className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {ctx.projection === "globe" ? <Globe className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
                  Projection
                </span>
                <span className="text-xs text-muted-foreground">{ctx.projection === "globe" ? "Globe" : "Flat"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account */}
      <div className="relative">
        <button
          onClick={() => { setShowAccount((v) => !v); setShowSettings(false); }}
          className="flex items-center gap-2 px-2 py-1 text-sm transition-colors hover:text-foreground"
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              {initials}
            </div>
          )}
          {user.username && (
            <span className="text-muted-foreground">@{user.username}</span>
          )}
        </button>

        {showAccount && (
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
                  onClick={() => setShowAccount(false)}
                  className="px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => { setShowAccount(false); logout(); }}
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
