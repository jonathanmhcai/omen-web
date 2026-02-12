"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Button from "./components/button/Button";
import { useAuthUser } from "./hooks/useAuthUser";
import { Loader } from "lucide-react";

export default function Home() {
  const { login, logout, exportWallet, ready, authenticated, user } = usePrivy();
  const { user: authUser, loading: authLoading, error: authError } = useAuthUser();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const footer = (
    <p className="text-gray-600 text-xs pt-6">
      Questions or concerns? Contact{" "}
      <a href="mailto:support@omen.trading" className="underline">
        support@omen.trading
      </a>
    </p>
  );

  if (!ready) return null;

  if (authenticated && authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader className="h-10 w-10 animate-spin duration-1000" />
      </div>
    );
  }

  if (authenticated && authError) {
    return (
      <div className="flex min-h-screen flex-col items-center px-4 pt-24">
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Omen</h1>
            <button
              onClick={logout}
              className="rounded-md p-1.5 text-zinc-500 hover:text-foreground dark:text-zinc-400 text-sm"
            >
              Log out
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">No Account Found</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You don&apos;t have an Omen account yet. Sign up through the mobile app to get started.
            </p>
            <a
              href="https://omen.trading"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium underline"
            >
              Download the app at omen.trading
            </a>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  if (authenticated && authUser) {
    return (
      <div className="flex min-h-screen flex-col items-center px-4 pt-24">
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Omen</h1>
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-md p-1.5 text-zinc-500 hover:text-foreground dark:text-zinc-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="flex w-56 flex-col gap-1 p-2">
                <div className="border-b border-border px-3 py-2 text-sm">
                  {user?.email?.address && (
                    <p className="font-medium">{user.email.address}</p>
                  )}
                  {user?.wallet?.address && (
                    <p className="text-xs text-muted-foreground">
                      {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                    </p>
                  )}
                  {user?.id && !user?.email?.address && !user?.wallet?.address && (
                    <p className="text-xs text-muted-foreground">{user.id}</p>
                  )}
                </div>
                {authUser?.isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent block"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  Dark mode
                  <span className="text-xs text-muted-foreground">{darkMode ? "On" : "Off"}</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          </div>
          {user?.wallet ? (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">Backup / Security</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Export your wallet&apos;s private key for safekeeping. Your private key gives full control over your wallet and funds.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Never share it with anyone, store it in a secure offline location, and be aware that anyone with access to it can move your assets permanently.
                </p>
              </div>
              <Button onClick={exportWallet}>Export Wallet</Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">No Wallet</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You don&apos;t have a wallet created yet. Sign up through the mobile app to get started.
              </p>
              <a
                href="https://omen.trading"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium underline"
              >
                Download the app at omen.trading
              </a>
            </div>
          )}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-24">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Omen</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage your wallet and account.
          </p>
        </div>
        <Button onClick={login}>Log In</Button>
        <p className="-mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          By signing up you agree to our{" "}
          <a href="https://omen.trading/terms" target="_blank" rel="noopener noreferrer" className="underline">
            Terms of Service
          </a>
          .
        </p>
      </div>
      {footer}
    </div>
  );
}
