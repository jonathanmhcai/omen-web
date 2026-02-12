"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Button from "../components/button/Button";
import EventTable, { EventFilters } from "../components/event-table/EventTable";
import UsersTable from "../components/users-table/UsersTable";
import { useAuthUser } from "../hooks/useAuthUser";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useEvents } from "../hooks/useEvents";
import { useSearchEvents } from "../hooks/useSearchEvents";
import { Loader } from "lucide-react";
import { type SortingState } from "@tanstack/react-table";
import { DEFAULT_EXCLUDED_TAG_IDS } from "../lib/tags";

type Tab = "events" | "users";

const DEFAULT_VOLUME_MIN = 500_000;

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const { login, logout, ready, authenticated, user } = usePrivy();
  const { user: authUser, loading: authLoading, error: authError } = useAuthUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [darkMode, setDarkMode] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: Tab = tabParam === "users" ? "users" : "events";
  const setActiveTab = useCallback((tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/admin?${params.toString()}`);
  }, [router, searchParams]);
  const [filters, setFilters] = useState<EventFilters>({ active: true, archived: true, featured: false, endDateMin: new Date(), volumeMin: DEFAULT_VOLUME_MIN, excludedTags: DEFAULT_EXCLUDED_TAG_IDS });
  const [sorting, setSorting] = useState<SortingState>([{ id: "endDate", desc: false }]);
  const [searchQuery, setSearchQuery] = useState("");

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
  const sortCol = sorting[0];
  const excludeTagIds = filters.excludedTags.map((t) => t.id);
  const { events, loading, error, page, hasMore, nextPage, prevPage, firstPage } = useEvents({ active: filters.active, archived: filters.archived, featured: filters.featured, endDateMin: filters.endDateMin, volumeMin: filters.volumeMin, excludeTagIds, order: sortCol?.id, ascending: sortCol ? !sortCol.desc : undefined });
  const { events: searchEvents, loading: searchLoading, error: searchError } = useSearchEvents(searchQuery);
  const isSearching = searchQuery.trim().length > 0;
  const [usersSorting, setUsersSorting] = useState<SortingState>([{ id: "last_seen_at", desc: true }]);
  const usersSortCol = usersSorting[0];
  const { users, loading: usersLoading, error: usersError, page: usersPage, hasMore: usersHasMore, nextPage: usersNextPage, prevPage: usersPrevPage, firstPage: usersFirstPage } = useAdminUsers({ order: usersSortCol?.id, ascending: usersSortCol ? !usersSortCol.desc : undefined });

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

  if (authenticated && authUser && !authUser.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/[.08] p-8 dark:border-white/[.145]">
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You do not have admin access.</p>
          <Button variant="secondary" onClick={logout}>Log Out</Button>
        </div>
      </div>
    );
  }

  if (authenticated && authUser?.isAdmin) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-between p-6">
          <span className="font-semibold" style={{ fontSize: "24px" }}>
            Omen Admin
          </span>
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
        <nav className="flex gap-1 border-b border-border px-6">
          {(["events", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4">
          {activeTab === "events" && (
            <EventTable events={isSearching ? searchEvents : events} loading={isSearching ? searchLoading : loading} error={isSearching ? searchError : error} page={page} hasMore={isSearching ? false : hasMore} onNextPage={nextPage} onPrevPage={prevPage} onFirstPage={firstPage} filters={filters} onFiltersChange={setFilters} sorting={sorting} onSortingChange={setSorting} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          )}
          {activeTab === "users" && (
            <UsersTable users={users} loading={usersLoading} error={usersError} page={usersPage} hasMore={usersHasMore} onNextPage={usersNextPage} onPrevPage={usersPrevPage} onFirstPage={usersFirstPage} sorting={usersSorting} onSortingChange={setUsersSorting} />
          )}
        </div>
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
