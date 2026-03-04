"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePositions } from "../hooks/usePositions";
import { useDepositAddresses } from "../hooks/useDepositAddresses";
import { useMapPageContext } from "./MapPageContext";
import { Wallet, BarChart3, Settings, Sun, Moon, Globe, Map, Activity, Flame, RotateCw } from "lucide-react";
import SearchModal from "./SearchModal";
import DepositModal from "../components/DepositModal";
import WithdrawModal from "../components/WithdrawModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function HeaderAccount() {
  const { login, logout, authenticated, user: privyUser } = usePrivy();
  const { user, loading } = useAuthUser();
  const { balance } = useUsdcBalance();
  const positions = usePositions();
  const { data: depositData } = useDepositAddresses();
  const ctx = useMapPageContext();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Open deposit/withdraw via keyboard shortcuts (close the other to prevent stacking)
  useEffect(() => {
    const onDeposit = () => { setShowWithdraw(false); setShowDeposit(true); };
    const onWithdraw = () => { setShowDeposit(false); setShowWithdraw(true); };
    window.addEventListener("open-deposit", onDeposit);
    window.addEventListener("open-withdraw", onWithdraw);
    return () => {
      window.removeEventListener("open-deposit", onDeposit);
      window.removeEventListener("open-withdraw", onWithdraw);
    };
  }, []);

  const displayName = user?.display_name || user?.username;
  const initials = displayName?.[0]?.toUpperCase() ?? "?";

  const posCount = positions.data?.positions.length ?? 0;
  const posValue = positions.data?.totalValue ?? 0;

  if (loading) return null;

  if (!user) return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {/* Search */}
      <SearchModal />

      {/* Hot Markets */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => ctx.onHotMarketsToggle()}
            className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Flame className="h-4 w-4 text-orange-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Trending Events</TooltipContent>
      </Tooltip>

      {/* Live Trades */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => ctx.onLiveTradesToggle()}
            className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Activity className="h-4 w-4 text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Pulse</TooltipContent>
      </Tooltip>

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
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
          <DropdownMenuItem onClick={() => window.dispatchEvent(new Event("toggle-spin"))}>
            <span className="flex items-center gap-2">
              <RotateCw className="h-3.5 w-3.5" />
              Spin Globe
            </span>
            <kbd className="ml-auto text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">S</kbd>
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

      {/* Hot Markets */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => ctx.onHotMarketsToggle()}
            className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Flame className="h-4 w-4 text-orange-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Trending Events</TooltipContent>
      </Tooltip>

      {/* Live Trades */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => ctx.onLiveTradesToggle()}
            className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <Activity className="h-4 w-4 text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Pulse</TooltipContent>
      </Tooltip>

      {/* Balance */}
      {balance !== null && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground cursor-pointer">
              <Wallet className="h-3.5 w-3.5" />
              ${balance.toFixed(2)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium">${balance.toFixed(2)} USDC</p>
              <p className="text-xs text-muted-foreground font-normal">Polygon</p>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setShowWithdraw(true)}>
              Withdraw
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {showWithdraw && (
        <WithdrawModal onClose={() => setShowWithdraw(false)} />
      )}

      {/* Positions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => ctx.onPositionsToggle()}
            className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{posCount}</span>
            <span className="font-medium text-foreground">${posValue.toFixed(2)}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-1.5">
            Positions
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">P</kbd>
          </span>
        </TooltipContent>
      </Tooltip>

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
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
          <DropdownMenuItem onClick={() => window.dispatchEvent(new Event("toggle-spin"))}>
            <span className="flex items-center gap-2">
              <RotateCw className="h-3.5 w-3.5" />
              Spin Globe
            </span>
            <kbd className="ml-auto text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">S</kbd>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1 text-sm transition-colors hover:text-foreground cursor-pointer">
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
