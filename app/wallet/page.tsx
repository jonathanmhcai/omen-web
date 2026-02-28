"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Button from "../components/button/Button";
import { useAuthUser } from "../hooks/useAuthUser";
import { Loader } from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const { login, ready, authenticated } = usePrivy();
  const { user: authUser, loading: authLoading } = useAuthUser();
  // Redirect fully set up users to /
  const isFullySetUp = authUser?.has_polymarket_credentials && authUser?.isAccountUpgraded;
  useEffect(() => {
    if (authenticated && isFullySetUp) {
      router.replace("/");
    }
  }, [authenticated, isFullySetUp, router]);

  const footer = (
    <p className="text-gray-600 text-xs pt-6">
      <a href="https://omen.trading/terms" className="underline">
        Terms of Service
      </a>
      {" · "}
      <a href="https://omen.trading/privacy" className="underline">
        Privacy Policy
      </a>
      {" · "}
      <a href="mailto:support@omen.trading" className="underline">
        support@omen.trading
      </a>
    </p>
  );

  if (!ready) return null;

  // Authenticated: show spinner while loading or redirecting
  if (authenticated && (authLoading || isFullySetUp)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader className="h-10 w-10 animate-spin duration-1000" />
      </div>
    );
  }

  // Not authenticated — login
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
