"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { User } from "../lib/types";
import { API_BASE, SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

async function authenticateWithPrivy(setSessionToken: (token: string) => void): Promise<string> {
  const privyToken = await getAccessToken();
  if (!privyToken) {
    throw new Error("No access token from Privy");
  }

  const res = await fetch(`${API_BASE}/auth/privy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${privyToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Auth failed");
  }

  const data = await res.json();
  const sessionToken = data.session_token as string;
  setSessionToken(sessionToken);
  return sessionToken;
}

async function fetchMe(sessionToken: string): Promise<User> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (res.status === 401) {
    throw new Error("Session token expired or invalid");
  }

  if (res.status === 404) {
    throw new Error("User account not found");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Request failed");
  }

  return res.json();
}

const REFETCH_INTERVAL = 10_000;

export function useAuthUser() {
  const { authenticated } = usePrivy();
  const queryClient = useQueryClient();
  const [sessionToken, setSessionToken, clearSessionToken] = useCookieString(SESSION_TOKEN_KEY);

  // Invalidate on login, clear on logout
  useEffect(() => {
    if (authenticated) {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    } else {
      queryClient.removeQueries({ queryKey: ["authUser"] });
      clearSessionToken();
    }
  }, [authenticated, queryClient, clearSessionToken]);

  const { data, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["authUser"],
    queryFn: async () => {
      let token = sessionToken;

      if (!token) {
        token = await authenticateWithPrivy(setSessionToken);
      }

      try {
        return await fetchMe(token);
      } catch (err) {
        if (err instanceof Error && err.message === "Session token expired or invalid") {
          clearSessionToken();
          const freshToken = await authenticateWithPrivy(setSessionToken);
          return await fetchMe(freshToken);
        }
        throw err;
      }
    },
    enabled: authenticated,
    refetchInterval: REFETCH_INTERVAL,
    retry: false,
  });

  return {
    user: data ?? null,
    loading: authenticated ? isLoading : false,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
