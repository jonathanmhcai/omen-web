"use client";

import { useEffect, useState } from "react";
import { AdminStoryDetail } from "../../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../../lib/constants";
import { useCookieString } from "../useCookieString";

export function useAdminStory(storyId: string | undefined) {
  const [data, setData] = useState<AdminStoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  useEffect(() => {
    if (!sessionToken || !storyId) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/admin/stories/${storyId}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.status === 404) {
          throw new Error("Story not found");
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((body) => {
        setData(body);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionToken, storyId]);

  return { data, loading, error };
}
