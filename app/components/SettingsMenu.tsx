"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAuthUser } from "../hooks/useAuthUser";

export default function SettingsMenu() {
  const { user, logout } = usePrivy();
  const { user: authUser } = useAuthUser();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const check = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const setDarkModeValue = useCallback((next: boolean) => {
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Settings"
          className="rounded-md p-3 text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
              {user.wallet.address.slice(0, 6)}...
              {user.wallet.address.slice(-4)}
            </p>
          )}
          {user?.id &&
            !user?.email?.address &&
            !user?.wallet?.address && (
              <p className="text-xs text-muted-foreground">{user.id}</p>
            )}
        </div>
        {authUser?.isAdmin && (
          <Link
            href="/admin"
            className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
          >
            Admin
          </Link>
        )}
        <label className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent">
          Dark mode
          <Switch checked={darkMode} onCheckedChange={setDarkModeValue} />
        </label>
        <button
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
        >
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}
