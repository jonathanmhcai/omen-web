/**
 * Tweet display types for the chart tweet-marker overlay.
 *
 * These lived in `useStories`/`useEventTweets` until the news pipeline was
 * removed (2026-09-14). The markers themselves survived that removal: the
 * trader profile still plots a trader's own market tweets, served from the
 * curated `/traders/:handle/market-tweets` payload rather than from any
 * story data. See `TweetMarkers`, `ScrubChart`, `TraderHighlights`.
 */

export type TweetMediaKind = "photo" | "video" | "gif";
export type TweetAuthorVerifiedType = "blue" | "business" | "government" | null;

export interface TweetMedia {
  url: string;
  width: number | null;
  height: number | null;
  kind: TweetMediaKind;
}

/** One tweet as the marker overlay renders it. */
export interface DisplayTweet {
  tweet_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_verified_type: TweetAuthorVerifiedType;
  body: string;
  posted_at: string;
  permalink: string;
  media: TweetMedia[];
}

/**
 * A tweet with its post time pre-resolved to Unix **seconds** — the same
 * unit the price chart's `t` axis uses, so markers can be placed via the
 * chart's x scale without per-render date parsing.
 */
export type EventTweet = DisplayTweet & { tSeconds: number };
