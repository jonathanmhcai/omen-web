"use client";

import { useEffect, useState } from "react";
import { AdminStats, AdminStatsWindow } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminStats(window: AdminStatsWindow) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/admin/stats?window=${window}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Not authenticated");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((body: AdminStats) => {
        setStats(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, window]);

  return { stats, loading, error };
}
