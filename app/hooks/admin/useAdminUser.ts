"use client";

import { useEffect, useState } from "react";
import { AdminUser } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminUser(userId: string | undefined) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken || !userId) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 404) {
          throw new Error("User not found");
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((body) => {
        setUser(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, userId]);

  return { user, loading, error };
}
