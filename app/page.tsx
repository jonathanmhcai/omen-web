"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Button from "./components/button/Button";
import { useAuthUser } from "./hooks/useAuthUser";
import { Loader } from "lucide-react";

export default function Home() {
  const { login, logout, ready, authenticated, user } = usePrivy();
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

  if (!ready) return null;

  if (authenticated && (authLoading || !authUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-10 w-10 animate-spin duration-1000" />
      </div>
    );
  }

  if (authenticated && authError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
          <p className="text-sm text-red-500">Authentication error: {authError}</p>
          <Button variant="secondary" onClick={logout}>Log Out</Button>
        </div>
      </div>
    );
  }

  if (authenticated && authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Omen</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to get started.
          </p>
        </div>
        <Button onClick={login}>Log In</Button>
      </div>
    </div>
  );
}
