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
