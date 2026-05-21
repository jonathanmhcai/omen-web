"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthUser } from "../hooks/useAuthUser";
import { useCookieString } from "../hooks/useCookieString";
import { NAV } from "../lib/nav";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import BalanceCard from "./BalanceCard";

const AVATAR_CACHE_KEY = "omen.profile-avatar-url";

// Module-scoped so it persists across Sidebar remounts. Each page wraps
// its own AppShell, so client-side navigation tears down and rebuilds
// the Sidebar — without this, the `mounted` gate below would re-arm on
// every nav and the BalanceCard / avatar would blink out for one paint.
let hasHydrated = false;

export default function Sidebar() {
  const { ready, authenticated, login } = usePrivy();
  const { user: authUser, loading: authLoading } = useAuthUser();
  const pathname = usePathname();

  // Cookies are sent in the SSR request and accessible synchronously on
  // the client, so this is a stable initial signal of whether the user
  // is (or recently was) signed in — without waiting for Privy to
  // hydrate or `/me` to return.
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const likelyAuthed = !!sessionToken || authenticated;

  // Track first-mount so SSR (and the matching first client render) can
  // render a stable placeholder, deferring all client-only state
  // (cookies, localStorage, Privy hydration) until after hydration
  // completes. Without this gate, `useCookieString` returns different
  // values on the server vs the first client paint, causing a structural
  // hydration mismatch. After hydration completes once, subsequent
  // mounts (e.g. page nav) initialize as already-mounted so the
  // BalanceCard paints immediately from React Query's cache.
  const [mounted, setMounted] = useState(hasHydrated);

  // Persist the avatar URL across reloads so the profile slot paints
  // from cache instead of waiting for `/me` to refetch.
  const [cachedAvatarUrl, setCachedAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    setCachedAvatarUrl(localStorage.getItem(AVATAR_CACHE_KEY));
    if (!hasHydrated) {
      hasHydrated = true;
      setMounted(true);
    }
  }, []);
  useEffect(() => {
    if (authUser?.avatar_url) {
      localStorage.setItem(AVATAR_CACHE_KEY, authUser.avatar_url);
      setCachedAvatarUrl(authUser.avatar_url);
    } else if (ready && !authenticated) {
      localStorage.removeItem(AVATAR_CACHE_KEY);
      setCachedAvatarUrl(null);
    }
  }, [authUser, ready, authenticated]);

  // Prefer the live avatar; fall back to cached while we don't yet know
  // the user is signed out.
  const displayAvatarUrl =
    authUser?.avatar_url ?? (likelyAuthed ? cachedAvatarUrl : null);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-2 px-4 py-6 lg:flex">
      <Link
        href="/"
        className="self-start px-3 pb-2 text-2xl font-semibold leading-none"
      >
        Omen
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.filter((item) => !item.adminOnly || authUser?.isAdmin).map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
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
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-lg outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring",
                active ? "font-bold" : "font-medium"
              )}
            >
              {item.href === "/profile" && mounted ? (
                displayAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayAvatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : likelyAuthed && (!ready || authLoading || !authUser) ? (
                  <div className="h-6 w-6 shrink-0 rounded-full bg-muted" />
                ) : (
                  <Icon className="h-6 w-6" />
                )
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {mounted && likelyAuthed && (
        <div className="mt-2 mx-1">
          <BalanceCard />
        </div>
      )}

      {ready && !authenticated && (
        <div className="mt-2 px-1">
          <Button onClick={login} className="w-full">
            Log In
          </Button>
        </div>
      )}
    </aside>
  );
}
