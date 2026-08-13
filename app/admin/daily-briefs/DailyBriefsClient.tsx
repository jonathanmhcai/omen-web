"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import DailyBriefsTable from "../../components/admin/daily-briefs-table/DailyBriefsTable";
import { useAdminDailyBriefs } from "../../hooks/admin/useAdminDailyBriefs";

export default function DailyBriefsClient() {
  // Paused first: a signup that stopped is the row worth acting on, and
  // `active` sorts false-before-true ascending.
  const [sorting, setSorting] = useState<SortingState>([
    { id: "active", desc: false },
    { id: "updated_at", desc: true },
  ]);

  const {
    briefs,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  } = useAdminDailyBriefs({ sorting, limit: 25 });

  return (
    <DailyBriefsTable
      briefs={briefs}
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
