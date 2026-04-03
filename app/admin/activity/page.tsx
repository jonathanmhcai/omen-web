"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import ActivityTable from "../../components/admin/activity-table/ActivityTable";
import { useAdminActivity } from "../../hooks/admin/useAdminActivity";

export default function ActivityPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);

  const {
    activity,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  } = useAdminActivity({ sorting, limit: 15 });

  return (
    <ActivityTable
      activity={activity}
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
