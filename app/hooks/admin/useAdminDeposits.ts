"use client";

import { useCallback, useEffect, useState } from "react";
import { type SortingState } from "@tanstack/react-table";
import { AdminDeposit } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { buildAdminQueryParams, type Filters } from "../../lib/admin-query";
import { useCookieString } from "../useCookieString";

interface UseAdminDepositsOptions {
  limit?: number;
  sorting?: SortingState;
  filters?: Filters;
  search?: string;
}

export function useAdminDeposits({
  limit = 15,
  sorting,
  filters,
  search,
}: UseAdminDepositsOptions = {}) {
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const sortKey = JSON.stringify(sorting);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(0);
  }, [sortKey, filterKey, search]);

  useEffect(() => {
    if (!sessionToken) return;

    setLoading(true);
    setError(null);

    const params = buildAdminQueryParams({
      limit,
      offset: page * limit,
      sorting,
      filters,
      search,
    });

    fetch(`${API_BASE}/admin/deposits?${params}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Not authenticated");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((body) => {
        setDeposits(body.data);
        setHasMore(body.data.length === limit);
        setTotal(body.total ?? null);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, limit, page, sortKey, filterKey, search]);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const firstPage = useCallback(() => setPage(0), []);

  return {
    deposits,
    loading,
    error,
    page,
    hasMore,
    total,
    nextPage,
    prevPage,
    firstPage,
  };
}
