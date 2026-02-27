"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CookiesProvider } from "react-cookie";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
          config={{
            loginMethods: ["email", "google", "apple"],
          }}
        >
          {children}
        </PrivyProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
}
