export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  privy_user_id?: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  has_polymarket_credentials: boolean;
  has_redeemed_invite_code: boolean;
  isAdmin: boolean;
  isPreview: boolean;
  is_usdc_allowances_set: boolean;
  is_ctf_token_allowances_set: boolean;
  hasValidPushToken: boolean;
  isAccountUpgraded?: boolean;
  needsSetup?: boolean;
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

export interface PolymarketMarket {
  id: string;
  conditionId: string;
  question: string;
  groupItemTitle?: string;
  outcomes: string; // JSON string array e.g. '["Yes", "No"]'
  outcomePrices: string; // JSON string array e.g. '["0.6", "0.4"]'
  volume: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  clobTokenIds: string; // JSON string array
  orderPriceMinTickSize: number;
  negRisk: boolean;
  endDate?: string;
  image?: string;
  description?: string;
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
  markets?: PolymarketMarket[];
  series?: PolymarketSeries[];
  seriesSlug?: string;
}

export interface AdminUser {
  id: string;
  privy_user_id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
  emails: string[];
  wallet_address: string | null;
  last_seen_at: string;
  usdc_balance: string;
  invite_code: string | null;
  has_push_token: boolean;
  push_enabled: boolean;
  following_orders_enabled: boolean;
}
