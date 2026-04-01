import { type SortingState } from "@tanstack/react-table";

export type FilterValue = string | number | boolean;
export type Filters = Record<string, FilterValue>;

/**
 * Serialize TanStack Table SortingState and filters into URLSearchParams
 * for the admin query API pattern.
 *
 * Sort format: sort=col:dir,col:dir
 * Filter format: field=value or field_op=value
 * Search: q=term
 */
export function buildAdminQueryParams({
  limit,
  offset,
  sorting,
  filters,
  search,
}: {
  limit: number;
  offset: number;
  sorting?: SortingState;
  filters?: Filters;
  search?: string;
}): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  // Sort
  if (sorting && sorting.length > 0) {
    const sortStr = sorting
      .map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`)
      .join(",");
    params.set("sort", sortStr);
  }

  // Filters
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    }
  }

  // Search
  if (search?.trim()) {
    params.set("q", search.trim());
  }

  return params;
}
