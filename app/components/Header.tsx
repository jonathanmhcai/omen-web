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
    <nav className="flex items-center border-b border-border bg-background px-6">
      <Link
        href={wordmarkHref}
        className="mr-4 shrink-0 whitespace-nowrap py-3.5 text-xl font-semibold leading-none md:mr-6 md:text-2xl"
      >
        {wordmark}
      </Link>
      {children}
      <div
        className={`ml-auto flex items-center${showLogin ? "" : " -mr-3"}`}
      >
        {showLogin ? (
          <Button size="sm" onClick={login}>
            Log in
          </Button>
        ) : (
          <SettingsMenu />
        )}
      </div>
    </nav>
  );
}
