"use client";

import { useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import EventTable, {
  EventFilters,
} from "../../components/admin/event-table/EventTable";
import { useEvents } from "../../hooks/useEvents";
import { useSearchEvents } from "../../hooks/useSearchEvents";
import { DEFAULT_EXCLUDED_TAG_IDS } from "../../lib/tags";

const DEFAULT_VOLUME_MIN = 500_000;

export default function EventsPage() {
  const [filters, setFilters] = useState<EventFilters>({
    active: true,
    archived: true,
    featured: false,
    endDateMin: new Date(),
    volumeMin: DEFAULT_VOLUME_MIN,
    excludedTags: DEFAULT_EXCLUDED_TAG_IDS,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "endDate", desc: false },
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const sortCol = sorting[0];
  const excludeTagIds = filters.excludedTags.map((t) => t.id);
  const {
    events,
    loading,
    error,
    page,
    hasMore,
    nextPage,
    prevPage,
    firstPage,
  } = useEvents({
    active: filters.active,
    archived: filters.archived,
    featured: filters.featured,
    endDateMin: filters.endDateMin,
    volumeMin: filters.volumeMin,
    excludeTagIds,
    order: sortCol?.id,
    ascending: sortCol ? !sortCol.desc : undefined,
  });
  const {
    events: searchEvents,
    loading: searchLoading,
    error: searchError,
  } = useSearchEvents(searchQuery);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <EventTable
      events={isSearching ? searchEvents : events}
      loading={isSearching ? searchLoading : loading}
      error={isSearching ? searchError : error}
      page={page}
      hasMore={isSearching ? false : hasMore}
      onNextPage={nextPage}
      onPrevPage={prevPage}
      onFirstPage={firstPage}
      filters={filters}
      onFiltersChange={setFilters}
      sorting={sorting}
      onSortingChange={setSorting}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );
}
