"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useCashBalance } from "../hooks/useCashBalance";
import { useCookieString } from "../hooks/useCookieString";
import { useDepositAddresses } from "../hooks/useDepositAddresses";
import { NAV } from "../lib/nav";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import DepositModal from "./DepositModal";

/**
 * Sticky top header for screens below `lg:` (1024px) — replaces the
 * left Sidebar on mobile. Row layout: Omen wordmark · (right cluster)
 * balance + Deposit when authed / Log In when not · ☰ menu.
 *
 * The ☰ opens a compact DropdownMenu with the same nav items as the
 * desktop sidebar. Balance + Deposit (and the Log In CTA when unauthed)
 * live in the header rather than the menu so the primary action is one
 * tap away.
 *
 * Hidden at `lg:` and above; the desktop Sidebar takes over there.
 */
export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, login } = usePrivy();
  const { user: authUser } = useAuthUser();
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const likelyAuthed = !!sessionToken || authenticated;

  // Defer client-only auth signals until after first paint to avoid an
  // SSR/CSR mismatch on the menu's auth-conditional rows. The mount-
  // gate flip is intentional setState-in-effect: it's a hydration
  // boundary, not a derived value, so the lint rule doesn't apply.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      <Link href="/" className="text-xl font-semibold leading-none">
        Omen
      </Link>

      <div className="ml-auto flex items-center gap-2">
        {mounted && likelyAuthed && <HeaderBalance />}
        {mounted && ready && !authenticated && (
          <Button size="sm" onClick={login}>
            Log In
          </Button>
        )}

        {/* `modal={false}` keeps Radix from locking body scroll + adding
         *  scrollbar-compensation padding while open — defaults caused a
         *  visible width shift of the page underneath on mobile.
         *
         *  Gated behind `mounted` so the Radix subtree (and its useId-
         *  generated trigger id) only renders after hydration. Upstream
         *  client-only providers (Privy) wrap the tree with extra layers
         *  on the client that aren't present during SSR, which shifts
         *  useId's tree path and produces a different id than the
         *  server rendered. Rendering a static placeholder for SSR/first
         *  paint sidesteps the mismatch entirely. */}
        {mounted ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="rounded-md p-2 text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 p-1"
            >
              {NAV.filter(
                (item) => !item.adminOnly || authUser?.isAdmin
              ).map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <DropdownMenuItem
                    key={item.href}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-sm",
                      active && "bg-accent font-semibold"
                    )}
                    onSelect={(e) => {
                      // Privy login triggers a modal; gate before we
                      // navigate away. Otherwise let router.push handle it
                      // — DropdownMenuItem closes on its own after
                      // onSelect.
                      if (item.requiresAuth && ready && !authenticated) {
                        e.preventDefault();
                        login();
                        return;
                      }
                      router.push(item.href);
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-md p-2 text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * Compact balance + Deposit pill rendered inline in the mobile header
 * for authed users. The amount is a single line of tabular numerals so
 * it doesn't reflow as it ticks; the Deposit button matches the size
 * of the ☰ trigger so the right cluster reads as one row.
 */
function HeaderBalance() {
  const { balance } = useCashBalance();
  const { data: depositData } = useDepositAddresses();
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <>
      {balance != null ? (
        <span className="text-sm font-semibold tabular-nums">
          ${balance.toFixed(2)}
        </span>
      ) : (
        <span className="h-4 w-14 animate-pulse rounded bg-muted" />
      )}
      <Button
        size="sm"
        onClick={() => setShowDeposit(true)}
        disabled={!depositData?.addresses}
      >
        Deposit
      </Button>

      {showDeposit && depositData?.addresses && (
        <DepositModal
          addresses={depositData.addresses}
          onClose={() => setShowDeposit(false)}
        />
      )}
    </>
  );
}
