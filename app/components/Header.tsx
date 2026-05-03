"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import SettingsMenu from "./SettingsMenu";

export default function Header({
  wordmark = "Omen",
  wordmarkHref = "/",
  children,
}: {
  wordmark?: string;
  wordmarkHref?: string;
  children?: React.ReactNode;
}) {
  const { ready, authenticated, login } = usePrivy();
  const showLogin = ready && !authenticated;

  return (
    <nav className="flex items-end border-b border-border bg-background px-6">
      <Link
        href={wordmarkHref}
        className="mr-6 pb-3 pt-4 font-semibold leading-none"
        style={{ fontSize: "24px" }}
      >
        {wordmark}
      </Link>
      {children}
      <div className="ml-auto flex items-center pb-2">
        {showLogin ? (
          <Button size="sm" onClick={login}>
            Log In
          </Button>
        ) : (
          <SettingsMenu />
        )}
      </div>
    </nav>
  );
}
