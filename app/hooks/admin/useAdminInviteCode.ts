"use client";

import { useEffect, useState } from "react";
import { AdminInviteCodeDetail } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminInviteCode(id: string | undefined) {
  const [code, setCode] = useState<AdminInviteCodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!sessionToken || !id) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/admin/invite-codes/${id}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 404) {
          throw new Error("Invite code not found");
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((body) => {
        setCode(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, id, refreshKey]);

  return { code, loading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
