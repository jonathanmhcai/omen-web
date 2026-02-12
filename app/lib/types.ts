export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  privy_user_id?: string;
  has_polymarket_credentials: boolean;
  has_redeemed_invite_code: boolean;
  isAdmin: boolean;
  isPreview: boolean;
  is_usdc_allowances_set: boolean;
  is_ctf_token_allowances_set: boolean;
  hasValidPushToken: boolean;
  isAccountUpgraded?: boolean;
  notification_settings?: {
    push_enabled: boolean;
  };
}

export interface PolymarketSeries {
  id: string;
  slug: string;
  title: string;
  ticker?: string;
}

export interface PolymarketEvent {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  startDate: string;
  endDate: string;
  creationDate: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  slug: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  tags: { id: string; label: string; slug: string }[];
  series?: PolymarketSeries[];
  seriesSlug?: string;
}

export interface AdminUser {
  id: string;
  privy_user_id: string;
  created_at: string;
  emails: string[];
  wallet_address: string | null;
  last_seen_at: string;
  usdc_balance: string;
  invite_code: string | null;
}
