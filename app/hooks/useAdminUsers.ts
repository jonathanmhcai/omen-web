"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminUser } from "../lib/types";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

interface UseAdminUsersOptions {
  limit?: number;
  order?: string;
  ascending?: boolean;
}

export function useAdminUsers({
  limit = 10,
  order,
  ascending,
}: UseAdminUsersOptions = {}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  // Reset to first page when sort changes
  useEffect(() => {
    setPage(0);
  }, [order, ascending]);

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(page * limit),
    });
    if (order) {
      params.set("order", order);
      params.set("ascending", String(ascending ?? false));
    }

    fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Not authenticated");
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((body) => {
        setUsers(body.data);
        setHasMore(body.data.length === limit);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, limit, page, order, ascending]);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const firstPage = useCallback(() => setPage(0), []);

  return { users, loading, error, page, hasMore, nextPage, prevPage, firstPage };
}
