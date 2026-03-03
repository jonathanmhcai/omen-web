"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthUser } from "../hooks/useAuthUser";
import { useSetup } from "../hooks/useSetup";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SetupModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const { authenticated, logout, ready } = usePrivy();
  const { user: authUser, loading: authLoading, refetch } = useAuthUser();
  const { setup, loading: setupLoading, error: setupError } = useSetup();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(!!refCode);
  const displayCode = inviteCode ?? refCode ?? "";

  const needsSetup =
    ready &&
    authenticated &&
    !authLoading &&
    authUser != null &&
    (!authUser.has_polymarket_credentials || !authUser.isAccountUpgraded);

  async function handleSetup(code?: string) {
    try {
      const result = await setup(code);
      if (result?.bonusUsdc) {
        toast.success(`Redeemed invite code for $${result.bonusUsdc}`, {
          description: "Funds will arrive within seconds...",
        });
      }
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

        {setupError && (
          <p className="text-xs text-red-500">
            Something went wrong: {setupError}. Please try again.
          </p>
        )}

        {setupLoading ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Setting up your account...</p>
          </div>
        ) : showCodeInput ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter your invite code below.
            </p>
            <input
              type="text"
              placeholder="Invite code"
              value={displayCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && displayCode.trim()) {
                  handleSetup(displayCode.trim());
                }
              }}
              autoFocus
              className="w-full rounded-xl border border-border bg-muted/50 py-2.5 px-3 text-sm outline-none focus:border-ring"
            />
            <Button
              onClick={() => handleSetup(displayCode.trim())}
              disabled={!displayCode.trim()}
            >
              Submit
            </Button>
            <button
              onClick={() => {
                setShowCodeInput(false);
                setInviteCode(null);
              }}
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Do you have an invite code?
            </p>
            <Button onClick={() => setShowCodeInput(true)} variant="outline">
              Yes, I have a code
            </Button>
            <Button onClick={() => handleSetup()}>
              No, continue without one
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
