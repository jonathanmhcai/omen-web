import { cn } from "@/lib/utils";

/**
 * A trader's Polymarket profile image, or — when they have none — a
 * gradient generated from their wallet, in the spirit of Polymarket's own
 * default avatars. Deterministic: the same wallet always gets the same
 * colors, on every surface and every render, with no stored state.
 *
 * `className` carries the size (`h-7 w-7`) and any positioning; the circle
 * and object-fit are handled here.
 */
export default function TraderAvatar({
  src,
  wallet,
  alt = "",
  className,
}: {
  src?: string | null;
  wallet: string;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full bg-muted object-cover", className)}
      />
    );
  }

  const h = hash(wallet.toLowerCase());
  // Two hues at least 100° apart, so the blob always reads against the base.
  const hueA = h % 360;
  const hueB = (hueA + 100 + ((h >>> 9) % 140)) % 360;
  const blobX = 25 + ((h >>> 3) % 50);
  const blobY = 55 + ((h >>> 6) % 35);
  // Stable per wallet. Two avatars for the same trader share ids, which is
  // harmless — the definitions they'd collide with are identical.
  const base = `av-${h.toString(36)}-a`;
  const blob = `av-${h.toString(36)}-b`;

  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("rounded-full", className)}
      role={alt ? "img" : "presentation"}
      aria-label={alt || undefined}
    >
      <defs>
        <radialGradient id={base} cx="30%" cy="25%" r="85%">
          <stop offset="0%" stopColor={`hsl(${hueA} 70% 66%)`} />
          <stop offset="100%" stopColor={`hsl(${(hueA + 25) % 360} 68% 46%)`} />
        </radialGradient>
        <radialGradient id={blob} cx={`${blobX}%`} cy={`${blobY}%`} r="55%">
          <stop offset="0%" stopColor={`hsl(${hueB} 65% 52%)`} />
          <stop offset="100%" stopColor={`hsl(${hueB} 65% 52%)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="80" height="80" fill={`url(#${base})`} />
      <rect width="80" height="80" fill={`url(#${blob})`} />
    </svg>
  );
}

/** FNV-1a, 32-bit. Just needs to be stable and well-spread, not secure. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
