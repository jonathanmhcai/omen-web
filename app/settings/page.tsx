"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import AppShell from "../components/AppShell";
import { useAuthUser } from "../hooks/useAuthUser";

export default function SettingsPage() {
  const router = useRouter();
  const { ready, authenticated, user, logout, exportWallet } = usePrivy();
  const { user: authUser } = useAuthUser();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);
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

  if (!ready || !authenticated) {
    return <AppShell>{null}</AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-4 px-3 text-2xl font-semibold">Settings</h1>

      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col px-4 py-3">
            {user?.email?.address && (
              <span className="text-sm font-medium">{user.email.address}</span>
            )}
            {user?.wallet?.address && (
              <span className="text-xs text-muted-foreground">
                {user.wallet.address.slice(0, 6)}...
                {user.wallet.address.slice(-4)}
              </span>
            )}
            {user?.id && !user?.email?.address && !user?.wallet?.address && (
              <span className="text-xs text-muted-foreground">{user.id}</span>
            )}
          </div>

          {authUser?.isAdmin && <SettingsLinkRow href="/admin" label="Admin" />}

          <label className="flex cursor-pointer items-center justify-between border-t border-border px-4 py-3 text-sm hover:bg-accent">
            Dark mode
            <Switch checked={darkMode} onCheckedChange={setDarkModeValue} />
          </label>

          <button
            onClick={logout}
            className="block w-full border-t border-border px-4 py-3 text-left text-sm text-red-500 hover:bg-accent"
          >
            Log out
          </button>
        </div>

        {user?.wallet ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">Backup / Security</h2>
              <p className="text-xs text-muted-foreground">
                Export your wallet&apos;s private key for safekeeping. Your
                private key gives full control over your wallet and funds.
              </p>
              <p className="text-xs text-muted-foreground">
                Never share it with anyone, store it in a secure offline
                location, and be aware that anyone with access to it can move
                your assets permanently.
              </p>
            </div>
            <Button onClick={exportWallet}>Export Wallet</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">No Wallet</h2>
            <p className="text-xs text-muted-foreground">
              You don&apos;t have a wallet created yet. Sign up through the
              mobile app to get started.
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
    </AppShell>
  );
}

function SettingsLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-t border-border px-4 py-3 text-sm hover:bg-accent"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
