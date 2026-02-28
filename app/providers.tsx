"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CookiesProvider } from "react-cookie";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const check = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
          config={{
            loginMethods: ["email", "google", "apple"],
            embeddedWallets: {
              ethereum: {
                createOnLogin: "users-without-wallets",
              },
            },
            appearance: {
              theme: darkMode ? "dark" : "light",
            },
          }}
        >
          {children}
        </PrivyProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
}
