"use client";

import { useCallback } from "react";
import { useCookies } from "react-cookie";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

export function useCookieString(key: string): [string | null, (value: string) => void, () => void] {
  const [cookies, setCookie, removeCookie] = useCookies([key]);

  const value = cookies[key] ?? null;

  const setValue = useCallback(
    (val: string) => {
      setCookie(key, val, COOKIE_OPTIONS);
    },
    [key, setCookie]
  );

  const removeValue = useCallback(() => {
    removeCookie(key, { path: "/" });
  }, [key, removeCookie]);

  return [value, setValue, removeValue];
}
