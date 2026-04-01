"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import InviteCodesTable from "../../components/admin/invite-codes-table/InviteCodesTable";
import { useAdminInviteCodes } from "../../hooks/admin/useAdminInviteCodes";

export default function InviteCodesPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
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
  } = useAdminInviteCodes({ sorting });

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
    />
  );
}
