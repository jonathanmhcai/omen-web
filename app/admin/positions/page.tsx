"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import PositionsTable from "../../components/admin/positions-table/PositionsTable";
import { useAdminPositions } from "../../hooks/admin/useAdminPositions";

export default function PositionsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: true },
    { id: "opened_at", desc: true },
  ]);
  const {
    positions,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  } = useAdminPositions({ sorting, limit: 15 });

  return (
    <PositionsTable
      positions={positions}
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
