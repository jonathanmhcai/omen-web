"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import UsersTable from "../../components/admin/users-table/UsersTable";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";

export default function UsersPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_seen_at", desc: true },
  ]);
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
  } = useAdminUsers({ sorting, limit: 15 });

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
    />
  );
}
