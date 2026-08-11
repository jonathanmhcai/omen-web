import { CalendarDays, Home, Settings, Shield } from "lucide-react";

/**
 * Primary nav items used by both `Sidebar` (desktop, lg+) and
 * `MobileNav` (single icon + dropdown, below lg). Shared so the two
 * surfaces can't drift on item set, labels, or auth gates.
 */
export const NAV = [
  { href: "/stories", label: "Home", icon: Home, requiresAuth: false, adminOnly: false },
  { href: "/daily-brief", label: "Daily brief", icon: CalendarDays, requiresAuth: false, adminOnly: false },
  // Hidden for now — re-add `User` to the lucide import when restoring.
  // { href: "/profile", label: "Profile", icon: User, requiresAuth: true, adminOnly: false },
  { href: "/admin", label: "Admin", icon: Shield, requiresAuth: true, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true, adminOnly: false },
] as const;

export type NavItem = (typeof NAV)[number];
