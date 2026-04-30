# omen-web

Next.js web app. Today's primary use is the **internal admin dashboard
(`/admin`) for monitoring product health**. User-facing surfaces are
limited: `/wallet` lets a user export their private key, and the
Mapbox map view is WIP behind a coming-soon gate.

Hits the same `omen-server` API as the mobile app.

## Product context

Omen is a tradable news feed for prediction market traders — clusters
breaking news into stories and links each story to the Polymarket
markets it could move, with directional context. The pitch: Bloomberg
Terminal energy, news-as-signal not price-as-signal.

The web client's current center of gravity is internal: the admin
dashboard is the day-to-day window into how the product is performing.
User-facing features (the map) are deferred until the core product
loop is ready.

## Where truth lives

- **Admin dashboard**: `app/admin/` — sub-routes for `activity`,
  `events`, `invite-codes`, `positions`, `users`. Layout in
  `app/admin/layout.tsx`. This is the active surface.
- **Wallet (key export)**: `app/wallet/page.tsx`.
- **Coming-soon gate**: `app/ComingSoon.tsx` (renders for users
  hitting the user-facing routes pre-launch).
- **Map (WIP)**: `app/map/`. Key files: `geo.ts`, `page.tsx`,
  `EventSidebar.tsx`, `HoverTooltip.tsx`, `layers.ts`. Backed by
  GeoJSON in `app/lib/`:
  - `country-boundaries.json` (`ISO_A2` property)
  - `us-state-boundaries.json` (`STUSPS` property)
  - `us-state-coordinates.json`
  - `matchLocation()` in `app/map/geo.ts` handles country + state
    matching with DC fallback.
- **API contract**: `../omen-server/`. Schema in
  `../omen-server/prisma/schema.prisma`.

## Conventions worth knowing upfront

- **Map is gated, admin is not.** When making changes, default to
  treating `/admin` as the live surface and `/map` as work-in-progress.
- Location slugs (used by the map): countries use the raw slug (e.g.
  `united-states`), states use `us-` prefix (e.g. `us-texas`).
- Polymarket events filtered by tag in the map view.

## Sister repos

Under `~/Documents/git/`:

- `omen-server/` — Node + Postgres backend
- `omen/` — React Native + Expo mobile app (primary user-facing client)
- `omen-website/` — marketing site
