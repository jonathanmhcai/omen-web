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
  icon?: string;
  description?: string;
}

export interface PolymarketEvent {
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  icon?: string;
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

export interface AdminUserAccount {
  kind: string;
  wallet_address: string | null;
  deposit_wallet_address: string | null;
  funder_address: string | null;
}

export interface AdminUser {
  id: string;
  privy_user_id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
  emails: string[];
  /** Managed account's wallet/deposit addresses (primary identity). */
  wallet_address: string | null;
  deposit_wallet_address: string | null;
  /** All Polymarket accounts, managed first. Drives the funding-wallet column. */
  accounts: AdminUserAccount[];
  last_seen_at: string;
  usdc_balance: string;
  /** Live USDC.e balance. Populated only by the user-detail endpoint. */
  usdce_balance: string | null;
  /** Live pUSD balance. Populated only by the user-detail endpoint. */
  pusd_balance: string | null;
  invite_code: string | null;
  invite_code_id: string | null;
  /**
   * [bonus-lock] Invite bonus locked out of this user's withdrawals, atomic
   * 6-decimal, both legs summed. Detail endpoint only (null on the list).
   * "0" is the normal state.
   */
  bonus_locked_atomic: string | null;
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
  cur_price: number | null;
  current_value: number | null;
  cash_pnl: number | null;
  percent_pnl: number | null;
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

export interface AdminInviteCodeRedemption {
  user_id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  redeemed_at: string;
  referee_bonus_asset_transfer_id: string | null;
  referrer_bonus_asset_transfer_id: string | null;
  /** [bonus-lock] NULL = that leg's bonus is still locked out of withdrawals. */
  referee_bonus_released_at: string | null;
  referrer_bonus_released_at: string | null;
}

export interface AdminInviteCodeDetail extends AdminInviteCode {
  referrer_user_id: string | null;
  referrer_username: string | null;
  referrer_display_name: string | null;
  redemptions: AdminInviteCodeRedemption[];
}

export interface AdminDeposit {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  provider: string;
  /** Coinbase payment method (APPLE_PAY / ACH_BANK_ACCOUNT / …); null otherwise. */
  payment_method: string | null;
  amount_usd: string;
  currency: string;
  status: string;
  created_at: string;
  settled_at: string | null;
  failure_reason: string | null;
}

/**
 * On-chain ERC-20 transfer surfaced on the admin dashboard. `direction` is
 * derived server-side relative to the user's wallet, and `classification`
 * mirrors the server's `classify()` discriminated union — kind plus an
 * optional `source` ('bridge' | 'direct') for kind=deposit.
 */
export type AdminTransferClassification =
  | { kind: "deposit"; source: "bridge" | "direct" }
  | { kind: "bonus" }
  | { kind: "withdrawal" }
  | { kind: "collateral_swap" }
  | { kind: "polymarket_buy" }
  | { kind: "polymarket_sell" }
  | { kind: "polymarket_redeem" };

export interface AdminTransfer {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  chain: string;
  tx_hash: string;
  block_timestamp: string;
  from_address: string;
  to_address: string;
  asset_address: string;
  asset_symbol: string | null;
  amount_atomic: string;
  amount_usd: string;
  direction: "in" | "out";
  classification: AdminTransferClassification;
  created_at: string;
}

export type AdminStatsWindow = "24h" | "7d" | "30d" | "all";

export interface AdminStats {
  window: AdminStatsWindow;
  /** Builder fees earned in window, from Polymarket's ledger (we store none).
   *  null means the CLOB was unreachable, not that we earned nothing. */
  builderRevenueUsd: string | null;
  builderRevenueUsdPrior: string | null;
  totalCustodiedUsd: string;
  totalCustodiedUsdPrior: string | null;
  /** Settled fiat deposits in window (onramp only). */
  depositsUsd: string;
  depositsUsdPrior: string | null;
  tradeVolumeUsd: string;
  tradeVolumeUsdPrior: string | null;
  /** Shares traded — matches how Polymarket reports volume. */
  tradeVolumeShares: string;
  tradeVolumeSharesPrior: string | null;
  activeTraders: number;
  activeTradersPrior: number | null;
  newFirstTimeTraders: number;
  newFirstTimeTradersPrior: number | null;
}

export type AdminVolumeGrain = "hour" | "day" | "week";

export interface AdminVolumeSeriesPoint {
  /** Bucket start, ISO 8601 (UTC). */
  bucket: string;
  /** Dollar notional traded (size × price). */
  volumeUsd: string;
  /** Shares traded — matches how Polymarket reports "volume". */
  shares: string;
}

export interface AdminVolumeSeries {
  window: AdminStatsWindow;
  grain: AdminVolumeGrain;
  points: AdminVolumeSeriesPoint[];
}

export interface AdminDepositsSeriesPoint {
  /** Bucket start, naive local-wall-clock (in the requested tz). */
  bucket: string;
  /** Settled fiat deposits in the bucket. */
  depositsUsd: string;
}

export interface AdminDepositsSeries {
  window: AdminStatsWindow;
  grain: AdminVolumeGrain;
  points: AdminDepositsSeriesPoint[];
}
