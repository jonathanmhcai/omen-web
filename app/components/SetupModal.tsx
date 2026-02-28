"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useSetup } from "../hooks/useSetup";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetupModal() {
  const router = useRouter();
  const { authenticated, logout, ready } = usePrivy();
  const { user: authUser, loading: authLoading, refetch } = useAuthUser();
  const { setup, loading: setupLoading, error: setupError } = useSetup();

  const needsSetup =
    ready &&
    authenticated &&
    !authLoading &&
    authUser != null &&
    (!authUser.has_polymarket_credentials || !authUser.isAccountUpgraded);

  async function handleSetup() {
    try {
      await setup();
      await refetch();
      router.push("/");
    } catch {
      // Error is already set in useSetup
    }
  }

  if (!needsSetup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] bg-background p-8 dark:border-white/[.145]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Welcome to Omen</h1>
          <button
            onClick={logout}
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Let&apos;s finish setting up your account.
          </p>
        </div>
        {setupError && (
          <p className="text-xs text-red-500">
            Something went wrong: {setupError}. Please try again.
          </p>
        )}
        <Button onClick={handleSetup} disabled={setupLoading}>
          {setupLoading ? "Setting up..." : "Get Started"}
        </Button>
      </div>
    </div>
  );
}
