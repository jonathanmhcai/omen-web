"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { CookiesProvider } from "react-cookie";
import { Cookies } from "react-cookie";
import PostHogTracking from "./components/PostHogTracking";

export default function Providers({
  children,
  cookieHeader,
}: {
  children: React.ReactNode;
  cookieHeader?: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  // Server render parses the request's Cookie header (threaded from the
  // root layout) so useCookies-driven UI — the TopNav auth affordances —
  // is correct in the first HTML. The client instance reads
  // document.cookie itself, which the browser guarantees matches what it
  // just sent, so SSR and hydration agree.
  const [cookiesInstance] = useState(() =>
    typeof document === "undefined" ? new Cookies(cookieHeader) : new Cookies()
  );
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDarkMode(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <CookiesProvider cookies={cookiesInstance}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
          config={{
            loginMethods: ["google", "apple", "email"],
            embeddedWallets: {
              ethereum: {
                createOnLogin: "users-without-wallets",
              },
            },
            appearance: {
              theme: darkMode ? "dark" : "light",
              accentColor: "#007AFF",
            },
          }}
        >
          <Suspense fallback={null}>
            <PostHogTracking />
          </Suspense>
          {children}
        </PrivyProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
}
