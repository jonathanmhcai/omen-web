"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { CookiesProvider } from "react-cookie";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookiesProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
        config={{
          loginMethods: ["email", "google", "apple"],
        }}
      >
        {children}
      </PrivyProvider>
    </CookiesProvider>
  );
}
