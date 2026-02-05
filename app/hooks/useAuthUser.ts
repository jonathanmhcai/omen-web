"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { User } from "../lib/types";
import { SESSION_TOKEN_KEY } from "../lib/constants";
import { useCookieString } from "./useCookieString";

async function authenticateWithPrivy(setSessionToken: (token: string) => void): Promise<string> {
  const privyToken = await getAccessToken();
  if (!privyToken) {
    throw new Error("No access token from Privy");
  }

  const res = await fetch("/api/auth/privy", {
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

async function fetchMe(sessionToken: string, clearSessionToken: () => void): Promise<User> {
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (res.status === 401) {
    clearSessionToken();
    throw new Error("Session token expired or invalid");
  }

  if (res.status === 404) {
    clearSessionToken();
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
  const { authenticated, logout } = usePrivy();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionToken, setSessionToken, clearSessionToken] = useCookieString(SESSION_TOKEN_KEY);

  const fetchUser = useCallback(async () => {
    try {
      let token = sessionToken;

      if (!token) {
        token = await authenticateWithPrivy(setSessionToken);
      }

      const me = await fetchMe(token, clearSessionToken);
      setUser(me);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      if (message === "Session token expired or invalid") {
        // Try once more with a fresh token
        try {
          const token = await authenticateWithPrivy(setSessionToken);
          const me = await fetchMe(token, clearSessionToken);
          setUser(me);
          setError(null);
          return;
        } catch {
          // Fall through to error handling
        }
      }

      if (message === "User account not found") {
        logout();
      }

      setUser(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [logout, sessionToken, setSessionToken, clearSessionToken]);

  useEffect(() => {
    if (!authenticated) {
      setUser(null);
      setLoading(false);
      setError(null);
      clearSessionToken();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchUser();
    intervalRef.current = setInterval(fetchUser, REFETCH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authenticated, fetchUser, clearSessionToken]);

  return { user, loading, error };
}
