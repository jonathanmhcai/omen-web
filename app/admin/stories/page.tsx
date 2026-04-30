"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import StoriesTable from "../../components/admin/stories-table/StoriesTable";
import { useAdminStories } from "../../hooks/admin/useAdminStories";
import type { Filters } from "../../lib/admin-query";

export default function StoriesPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "latest_media_at", desc: true },
  ]);
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearch(localSearch), 150);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  const filters: Filters | undefined = useMemo(() => {
    if (!activeOnly) return undefined;
    return { status: "active" };
  }, [activeOnly]);

  const {
    stories,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  } = useAdminStories({
    sorting,
    filters,
    search: search || undefined,
    limit: 20,
  });

  return (
    <StoriesTable
      stories={stories}
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
      activeOnly={activeOnly}
      onActiveOnlyChange={setActiveOnly}
    />
  );
}
