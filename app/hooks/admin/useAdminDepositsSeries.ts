"use client";

import { useEffect, useState } from "react";
import { AdminDepositsSeries, AdminStatsWindow } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminDepositsSeries(window: AdminStatsWindow) {
  const [series, setSeries] = useState<AdminDepositsSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken) return;

    setLoading(true);
    setError(null);

    // Pass the browser tz so buckets align with the viewer's clock
    // (server buckets in this zone and returns naive local-wall-clock stamps).
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    fetch(
      `${API_BASE}/admin/stats/deposits-series?window=${window}&tz=${encodeURIComponent(tz)}`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    )
      .then((res) => {
        if (res.status === 401) throw new Error("Not authenticated");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((body: AdminDepositsSeries) => {
        setSeries(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, window]);

  return { series, loading, error };
}
