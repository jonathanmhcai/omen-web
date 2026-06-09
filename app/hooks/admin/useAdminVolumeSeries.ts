"use client";

import { useEffect, useState } from "react";
import { AdminVolumeSeries, AdminStatsWindow } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminVolumeSeries(window: AdminStatsWindow) {
  const [series, setSeries] = useState<AdminVolumeSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken) return;

    setLoading(true);
    setError(null);

    // Pass the browser tz so hour/day buckets align with the viewer's clock
    // (server buckets in this zone and returns naive local-wall-clock stamps).
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    fetch(
      `${API_BASE}/admin/stats/volume-series?window=${window}&tz=${encodeURIComponent(tz)}`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    )
      .then((res) => {
        if (res.status === 401) throw new Error("Not authenticated");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((body: AdminVolumeSeries) => {
        setSeries(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, window]);

  return { series, loading, error };
}
