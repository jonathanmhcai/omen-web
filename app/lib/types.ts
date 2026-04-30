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
  push_social: boolean;
  push_trades: boolean;
  push_subscriptions: boolean;
  push_resolutions: boolean;
  completed_onboarding_steps: string[];
  all_onboarding_steps?: { key: string; required: boolean }[];
}

export interface AdminPosition {
  id: string;
  user_id: string;
  market_id: string;
  clob_token_id: string;
  status: "open" | "closed";
  shares: number;
  avg_entry_price: number;
  outcome: string | null;
  opened_at: string | null;
  closed_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  display_name: string | null;
  market_title: string | null;
  market_end_date: string | null;
}

export interface AdminActivity {
  id: string;
  user_id: string;
  type: string;
  side: string | null;
  timestamp: string;
  title: string | null;
  outcome: string | null;
  size: number | null;
  price: number | null;
  usdc_size: number | null;
  transaction_hash: string;
  asset: string;
  condition_id: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminInviteCode {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  archived: boolean;
  bonus_usdc_atomic: string | null;
  referrer_bonus_usdc_atomic: string | null;
  referrer_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStory {
  id: string;
  status: "candidate" | "active";
  headline: string;
  media_count: number;
  distinct_author_count: number;
  linked_event_count: number;
  linked_market_count: number;
  top_event_similarity: number | null;
  top_event_title: string | null;
  avg_join_similarity: number | null;
  latest_media_at: string;
  promoted_at: string | null;
  created_at: string;
}

export interface AdminStoryDetailStory {
  id: string;
  status: "candidate" | "active";
  headline: string;
  media_count: number;
  distinct_author_count: number;
  latest_media_at: string;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
  centroid_model: string | null;
  centroid_embedded_at: string | null;
}

export interface AdminStoryTweet {
  story_tweet_id: string;
  twitter_event_id: string;
  tweet_id: string;
  author_handle: string | null;
  effective_author_id: string | null;
  similarity: number | null;
  posted_at: string | null;
  body: string;
  joined_at: string;
}

export interface AdminStoryEvent {
  link_id: string;
  polymarket_event_id: string;
  polymarket_id: string;
  slug: string;
  title: string | null;
  similarity: number;
  end_date: string | null;
  closed: boolean | null;
  archived: boolean | null;
  volume_24hr: string | null;
  matched_at: string;
}

export interface AdminStoryMarket {
  link_id: string;
  polymarket_market_id: string;
  polymarket_id: string;
  slug: string;
  question: string | null;
  parent_event_title: string | null;
  parent_event_slug: string | null;
  similarity: number;
  end_date: string | null;
  closed: boolean | null;
  archived: boolean | null;
  volume_num: string | null;
  matched_at: string;
}

export interface AdminStoryDetail {
  story: AdminStoryDetailStory;
  tweets: AdminStoryTweet[];
  events: AdminStoryEvent[];
  markets: AdminStoryMarket[];
}
