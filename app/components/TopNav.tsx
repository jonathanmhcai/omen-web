"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useCookieString } from "../hooks/useCookieString";
import { NAV, isNavItemActive } from "../lib/nav";
import { SESSION_TOKEN_KEY } from "../lib/constants";
// Restore alongside the HeaderBalance block at the bottom of this file.
// import { useCashBalance } from "../hooks/useCashBalance";
// import { useDepositAddresses } from "../hooks/useDepositAddresses";
// import { useTradingEnabled } from "../hooks/useTradingEnabled";
// import DepositModal from "./DepositModal";

// Module-scoped so it persists across TopNav remounts. Each page wraps
// its own AppShell, so client-side navigation tears down and rebuilds
// the bar — without this, the `mounted` gate below would re-arm on
// every nav and the balance / Log In cluster would blink out for one
// paint.
let hasHydrated = false;

/**
 * Sticky top bar — the app shell's only nav surface at every
 * breakpoint. Row layout: Omen wordmark left; right cluster is inline
 * nav links (lg+ only), balance + Deposit when authed / Log In when
 * not, then the ☰ dropdown (below lg only) with the same nav items.
 */
export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, login } = usePrivy();
  const { user: authUser } = useAuthUser();
  // Cookie-based fast path: Privy takes a beat to hydrate + report
  // `ready`, but the session cookie is readable immediately. It lets the
  // bar show the right auth affordances during that window instead of
  // nothing. Stale cookies self-heal — useAuthUser clears the cookie once
  // Privy settles on unauthenticated.
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const likelyAuthed = !!sessionToken || authenticated;

  // Defer client-only auth signals until after first paint to avoid an
  // SSR/CSR mismatch on the auth-conditional cluster. The mount-gate
  // flip is intentional setState-in-effect: it's a hydration boundary,
  // not a derived value, so the lint rule doesn't apply.
  const [mounted, setMounted] = useState(hasHydrated);
  useEffect(() => {
    if (!hasHydrated) {
      hasHydrated = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
  }, []);

  // Auth-gated items are hidden outright rather than shown as login
  // prompts. `mounted` keeps SSR and the first client paint agreeing —
  // the auth signals are client-only. `likelyAuthed` (cookie) rather than
  // `authenticated` so returning users see Settings immediately instead
  // of it popping in after Privy hydrates.
  const visibleNav = NAV.filter((item) => {
    if (item.adminOnly) return authUser?.isAdmin;
    if (item.requiresAuth) return mounted && likelyAuthed;
    return true;
  });

  // Show Log In as soon as we can tell the visitor is signed out: with no
  // session cookie that's right away, with one only after Privy confirms.
  const showLogin = mounted && !authenticated && (ready || !likelyAuthed);

  return (
    // Outer padding + inner max-width mirror Footer's container so the
    // header and footer content edges line up.
    <header className="sticky top-0 z-40 w-full bg-page/95 px-6 backdrop-blur md:px-12 lg:px-16 xl:px-24">
      <div className="mx-auto flex max-w-4xl items-center gap-2 py-2">
        <Link href="/" className="text-xl font-semibold leading-none">
          Omen
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden items-center lg:flex">
            {visibleNav.map((item) => {
              const active = !item.external && isNavItemActive(item.href, pathname);
              const linkClass = cn(
                "rounded-full px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground"
              );
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(linkClass, "flex items-center gap-0.5")}
                  >
                    {item.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    if (item.requiresAuth && ready && !authenticated) {
                      e.preventDefault();
                      login();
                    }
                  }}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Balance + Deposit hidden for now, even where trading is
              enabled. Restore by uncommenting this line, the HeaderBalance
              components below, and their imports. */}
          {/* {mounted && likelyAuthed && <HeaderBalance />} */}
          {/* Below lg the same action lives in the ☰ dropdown. The click
              no-ops until Privy is ready (sub-second) — better a briefly
              inert button than no sign-in affordance on the front door. */}
          {showLogin && (
            <Button
              size="sm"
              onClick={() => ready && login()}
              className="hidden lg:inline-flex"
            >
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
          <div className="lg:hidden">
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
                  {visibleNav.map((item) => {
                    const Icon = item.icon;
                    const active =
                      !item.external && isNavItemActive(item.href, pathname);
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 text-sm",
                          active && "bg-accent font-semibold"
                        )}
                        onSelect={(e) => {
                          // Privy login triggers a modal; gate before we
                          // navigate away. Otherwise let router.push handle
                          // it — DropdownMenuItem closes on its own after
                          // onSelect.
                          if (item.requiresAuth && ready && !authenticated) {
                            e.preventDefault();
                            login();
                            return;
                          }
                          if (item.external) {
                            window.open(item.href, "_blank", "noopener,noreferrer");
                            return;
                          }
                          router.push(item.href);
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-70" />
                        <span>{item.label}</span>
                        {item.external && (
                          <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-70" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  {showLogin && (
                    <>
                      {visibleNav.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className="rounded-md px-2.5 py-1.5 text-sm font-medium"
                        onSelect={() => ready && login()}
                      >
                        <LogIn className="h-4 w-4 shrink-0 opacity-70" />
                        <span>Log In</span>
                      </DropdownMenuItem>
                    </>
                  )}
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
        </div>
      </div>
    </header>
  );
}

/**
 * Compact balance + Deposit pill rendered inline in the bar for authed
 * users. The amount is a single line of tabular numerals so it doesn't
 * reflow as it ticks; the Deposit button matches the size of the ☰
 * trigger so the right cluster reads as one row.
 *
 * Hidden entirely for unredeemed users, gated OUTSIDE the inner
 * component so its hooks (balance polling, deposit-address fetch)
 * never run for them.
 *
 * COMMENTED OUT — the bar shows no balance for now. Restore this block,
 * the call site above, and the commented imports at the top together.
 */
// function HeaderBalance() {
//   const tradingEnabled = useTradingEnabled();
//   if (!tradingEnabled) return null;
//   return <HeaderBalanceInner />;
// }
//
// function HeaderBalanceInner() {
//   const { balance } = useCashBalance();
//   const { data: depositData } = useDepositAddresses();
//   const [showDeposit, setShowDeposit] = useState(false);
//
//   return (
//     <>
//       {balance != null ? (
//         <span className="text-sm font-semibold tabular-nums">
//           ${balance.toFixed(2)}
//         </span>
//       ) : (
//         <span className="h-4 w-14 animate-pulse rounded bg-muted" />
//       )}
//       <Button
//         size="sm"
//         onClick={() => setShowDeposit(true)}
//         disabled={!depositData?.addresses}
//       >
//         Deposit
//       </Button>
//
//       {showDeposit && depositData?.addresses && (
//         <DepositModal
//           addresses={depositData.addresses}
//           onClose={() => setShowDeposit(false)}
//         />
//       )}
//     </>
//   );
// }
