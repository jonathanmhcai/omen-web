# omen-web

Next.js web app — the web client for omen, a tradable news feed for
prediction market traders. Mirrors the mobile app's primary surface
(the signals feed at `/`), plus per-user pages. Auth via Privy; backed
by `omen-server`.

`/admin` is the internal dashboard for monitoring product health and
remains admin-gated.

## Layout

Three-column app shell (`app/components/AppShell.tsx`):

- **Left**: persistent nav (`Sidebar.tsx`) — wordmark, nav items, log
  in / account widget
- **Center**: the page (`max-w-xl`)
- **Right**: optional widgets — search, positions, app download —
  rendered today only on `/`

The right slot reserves its width even when empty so the left
sidebar's horizontal position is stable across pages.

## Conventions

- `useAuthUser` is the omen session (separate from Privy's user). Nav
  items marked `requiresAuth: true` open the Privy modal when clicked
  unauthed; per-user routes redirect to `/` when unauthed.
- The `/stories` server endpoint is public (`optionalAuth`), so the
  homepage feed renders for anonymous visitors too.
- Polymarket data: market events use `market.event_slug` for outbound
  links (`polymarket.com/event/{event_slug}`); the market's own slug
  only matches the event for single-market events.

## Where truth lives

- **API contract**: `../omen-server/`. Schema in
  `../omen-server/prisma/schema.prisma`.

## Sister repos

Under `~/Documents/git/`:

- `omen/` — React Native + Expo mobile app
- `omen-server/` — Node + Postgres backend
- `omen-website/` — marketing site
