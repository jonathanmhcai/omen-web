"use client";

import { useEffect, useRef, useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import InviteCodesTable from "../../components/admin/invite-codes-table/InviteCodesTable";
import { useAdminInviteCodes } from "../../hooks/admin/useAdminInviteCodes";

export default function InviteCodesPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(localSearch), 150);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  const {
    codes,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
    refresh,
  } = useAdminInviteCodes({ sorting, search: search || undefined });

  return (
    <InviteCodesTable
      codes={codes}
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
      onCreated={refresh}
      searchQuery={localSearch}
      onSearchChange={setLocalSearch}
    />
  );
}
