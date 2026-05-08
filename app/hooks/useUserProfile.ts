"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  markets_traded: number;
  is_following: boolean;
  is_alert_subscribed: boolean;
  usdc_balance: number;
  createdAt: string;
}

export function useUserProfile(userId: string | undefined) {
  const [sessionToken] = useCookieString(SESSION_TOKEN_KEY);

  return useQuery<UserProfile>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    enabled: !!sessionToken && !!userId,
  });
}
