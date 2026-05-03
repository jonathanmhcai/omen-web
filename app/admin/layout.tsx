"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "../hooks/useAuthUser";
import { Loader } from "lucide-react";
import Link from "next/link";
import Header from "../components/Header";

const TABS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Positions", href: "/admin/positions" },
  { label: "Activity", href: "/admin/activity" },
  { label: "Invite Codes", href: "/admin/invite-codes" },
  { label: "Events", href: "/admin/events" },
  { label: "Stories", href: "/admin/stories" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { login, logout, ready, authenticated } = usePrivy();
  const {
    user: authUser,
    loading: authLoading,
    error: authError,
  } = useAuthUser();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    const tab = TABS.find((t) => pathname.startsWith(t.href));
    document.title = tab ? `${tab.label} - Omen Admin` : "Omen Admin";
  }, [pathname]);

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
          <p className="text-sm text-red-500">
            Authentication error: {authError}
          </p>
          <Button variant="outline" onClick={logout}>
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  if (authenticated && authUser && !authUser.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You do not have admin access.
          </p>
          <Button variant="outline" onClick={logout}>
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  if (authenticated && authUser?.isAdmin) {
    return (
      <div className="min-h-screen">
        <Header wordmark="Omen Admin" wordmarkHref="/admin">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-3 text-sm font-medium ${pathname.startsWith(tab.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </Header>
        <div className="px-6 py-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Omen Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to get started.
          </p>
        </div>
        <Button onClick={login}>Log In</Button>
      </div>
    </div>
  );
}
