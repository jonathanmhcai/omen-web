import { Settings, Shield, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Clicking while signed out opens the Privy modal instead. */
  requiresAuth: boolean;
  adminOnly: boolean;
  /** Opens in a new tab with a trailing ↗ and no active state. */
  external: boolean;
  /** Inline bar renders just the icon (label kept for the mobile
   *  dropdown and aria-label). */
  iconOnly: boolean;
}

/**
 * Primary nav items used by `TopNav` for both of its surfaces: inline
 * links (lg+) and the ☰ dropdown (below lg). Shared so the two can't
 * drift on item set, labels, or auth gates. `external` items open in a
 * new tab and render with a trailing ↗ instead of an active state — the
 * flag is about how the link opens, not whether the href leaves the site
 * (Admin is in-app but gets its own tab, since it's a separate shell).
 *
 * The daily brief lives at `/` and is reached via the wordmark, so it
 * has no item of its own.
 *
 * Typed against the interface, not `as const`: literal narrowing has
 * broken the build twice when a data tweak made a TopNav branch
 * impossible (a comparison against a removed href, then every
 * non-external item becoming iconOnly).
 */
export const NAV: readonly NavItem[] = [
  // Hidden for now — re-add the named lucide icons to the import when
  // restoring. The `/stories` and `/traders` index routes are deprecated
  // (see components/deprecated/), so those two need their pages back too.
  // { href: "/stories", label: "News", icon: Newspaper, requiresAuth: false, adminOnly: false, external: false, iconOnly: false },
  // { href: "/traders", label: "Traders", icon: Users, requiresAuth: false, adminOnly: false, external: false, iconOnly: false },
  // { href: "/profile", label: "Profile", icon: User, requiresAuth: true, adminOnly: false, external: false, iconOnly: false },
  // { href: "https://omen.trading/", label: "App", icon: Smartphone, requiresAuth: false, adminOnly: false, external: true, iconOnly: false },
  { href: "/admin", label: "Admin", icon: Shield, requiresAuth: true, adminOnly: true, external: true, iconOnly: false },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true, adminOnly: false, external: false, iconOnly: true },
];

/** Active-state test. A `/` item would need an exact match — a prefix
 *  test matches every route. */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
