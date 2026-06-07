"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import UsersTable from "../../components/admin/users-table/UsersTable";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";
import type { Filters } from "../../lib/admin-query";

export default function UsersClient() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_seen_at", desc: true },
  ]);
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const [redeemedOnly, setRedeemedOnly] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(localSearch), 150);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  const filters: Filters | undefined = useMemo(() => {
    if (!redeemedOnly) return undefined;
    return { redeemed_invite: true };
  }, [redeemedOnly]);

  const {
    users,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  } = useAdminUsers({ sorting, filters, search: search || undefined, limit: 15 });

  return (
    <UsersTable
      users={users}
      loading={loading}
      error={error}
      page={page}
      hasMore={hasMore}
      total={total}
      onNextPage={nextPage}
      onPrevPage={prevPage}
      onFirstPage={firstPage}
      sorting={sorting}
      onSortingChange={setSorting}
      searchQuery={localSearch}
      onSearchChange={setLocalSearch}
      redeemedOnly={redeemedOnly}
      onRedeemedOnlyChange={setRedeemedOnly}
    />
  );
}
