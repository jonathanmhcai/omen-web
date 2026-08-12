# omen-web

Next.js web app — the web client for omen, a tradable news feed for
prediction market traders. Mirrors the mobile app's primary surface
(the signals feed at `/`), plus per-user pages. Auth via Privy; backed
by `omen-server`.

`/admin` is the internal dashboard for monitoring product health and
remains admin-gated.

## Layout

App shell (`app/components/AppShell.tsx`):

- **Top**: sticky nav bar (`TopNav.tsx`) — wordmark left; nav items,
  balance / log in on the right (inline links at `lg+`, ☰ dropdown
  below)
- **Center**: the page (`max-w-xl`)
- **Right**: optional widgets — search, positions, app download —
  rendered today only on `/`

An empty left spacer mirrors the right column's width so the main
column sits at the same viewport-centered position on every page.

`SiteChrome` (`/`, /traders) shares the same `TopNav` bar, plus a
footer; its `max-w-4xl` container is mirrored by `Footer` so header
and footer content edges align.

`/` is the daily brief (`?user=<handle>` renders that trader's brief).
`/daily-brief` 307s to it — sent emails link there — and Next carries
the query string over. The former card landing is kept, unrouted, at
`components/deprecated/LandingCards.tsx`.

## Conventions

- `useAuthUser` is the omen session (separate from Privy's user). Nav
  items marked `requiresAuth: true` open the Privy modal when clicked
  unauthed; per-user routes redirect to `/` when unauthed. `/settings` is
  the exception: it prompts to sign in instead, because the daily brief
  emails link there and a redirect would strand that visitor.
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
