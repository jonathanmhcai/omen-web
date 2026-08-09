"use client";

import { useAuthUser } from "./useAuthUser";

/**
 * Whether this user gets trading/wallet surfaces (balance, deposit,
 * positions, key export). True only after they've redeemed an invite
 * code — sign-in alone creates an account in a browse/newsletter-only
 * state, and the server's fleet workers ignore unredeemed accounts, so
 * the client must not show money UI or trigger money-adjacent fetches
 * (e.g. bridge-intake allocation) for them.
 *
 * Returns false while /me is loading: money UI appears once auth
 * resolves rather than flashing for users who turn out to be ungated.
 *
 * Distinct from the "web trading isn't built yet" notice
 * (TradingUnavailableModal), which applies to ALL users.
 */
export function useTradingEnabled(): boolean {
  const { user } = useAuthUser();
  return user?.has_redeemed_invite_code ?? false;
}
