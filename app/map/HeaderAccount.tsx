"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import { useDepositAddresses } from "../hooks/useDepositAddresses";
import { useMapPageContext } from "./MapPageContext";
import { Wallet, BarChart3, Settings, Sun, Moon, Globe, Map, Activity } from "lucide-react";
import SearchModal from "./SearchModal";
import DepositModal from "../components/DepositModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function HeaderAccount() {
  const { login, logout, authenticated, user: privyUser } = usePrivy();
  const { user, loading } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const { data: depositData } = useDepositAddresses();
  const ctx = useMapPageContext();
  const [showDeposit, setShowDeposit] = useState(false);

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  if (loading) return null;

  if (!user) return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {/* Search */}
      <SearchModal />

      {/* Live Trades */}
      <button
        onClick={() => ctx.onLiveTradesToggle()}
        className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        title="Live Trades"
      >
        <Activity className="h-4 w-4 text-foreground" />
      </button>

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={ctx.toggleDarkMode}>
            <span className="flex items-center gap-2">
              {ctx.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Theme
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{ctx.darkMode ? "Dark" : "Light"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={ctx.toggleProjection}>
            <span className="flex items-center gap-2">
              {ctx.projection === "globe" ? <Globe className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
              Projection
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{ctx.projection === "globe" ? "Globe" : "Flat"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Log In / Log Out */}
      <button
        onClick={authenticated ? () => logout() : login}
        className="px-3 py-1 text-sm font-medium text-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors"
      >
        {authenticated ? "Log out" : "Log in / Sign up"}
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {/* Search */}
      <SearchModal />

      {/* Live Trades */}
      <button
        onClick={() => ctx.onLiveTradesToggle()}
        className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        title="Live Trades"
      >
        <Activity className="h-4 w-4 text-foreground" />
      </button>

      {/* Balance */}
      {balance !== null && (
        <div className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground">
          <Wallet className="h-3.5 w-3.5" />
          ${balance.toFixed(2)}
        </div>
      )}

      {/* Deposit */}
      <button
        onClick={() => setShowDeposit(true)}
        className="px-3 py-1 text-sm font-medium text-foreground bg-accent hover:bg-accent/80 rounded-full transition-colors cursor-pointer"
      >
        Deposit
      </button>

      {showDeposit && depositData?.addresses && (
        <DepositModal
          addresses={depositData.addresses}
          onClose={() => setShowDeposit(false)}
        />
      )}

      {/* Positions */}
      {positions.data && posCount > 0 && (
        <button
          onClick={() => ctx.onPositionsToggle()}
          className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground transition-colors hover:text-foreground"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{posCount}</span>
          <span className="font-medium text-foreground">${posValue.toFixed(2)}</span>
        </button>
      )}

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4 text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={ctx.toggleDarkMode}>
            <span className="flex items-center gap-2">
              {ctx.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Theme
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{ctx.darkMode ? "Dark" : "Light"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={ctx.toggleProjection}>
            <span className="flex items-center gap-2">
              {ctx.projection === "globe" ? <Globe className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
              Projection
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{ctx.projection === "globe" ? "Globe" : "Flat"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1 text-sm transition-colors hover:text-foreground">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {initials}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {displayName && (
              <p className="font-medium text-foreground">{displayName}</p>
            )}
            {user.username && (
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            )}
            {privyUser?.email?.address && (
              <p className="text-xs text-muted-foreground">{privyUser.email.address}</p>
            )}
            {privyUser?.id && !privyUser?.email?.address && (
              <p className="text-xs text-muted-foreground">{privyUser.id}</p>
            )}
          </DropdownMenuLabel>
          {user.isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin">Admin</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href="mailto:support@omen.trading">Contact support</a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
