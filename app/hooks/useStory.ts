"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";
import { Story } from "./useStories";

export function useStory(id: string | undefined) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useQuery<Story>({
    queryKey: ["story", id, sessionToken ? "auth" : "anon"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
      const res = await fetch(
        `${API_BASE}/stories/${encodeURIComponent(id!)}`,
        { headers }
      );
      if (res.status === 404) throw new Error("Story not found");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });
}
