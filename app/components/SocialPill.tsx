import Link from "next/link";

/** A bordered social/link pill: icon + label, opening in a new tab. Used for
 *  the Polymarket / X / Substack / YouTube links on the trader profile. */
export default function SocialPill({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted"
    >
      {icon}
      {label}
    </Link>
  );
}
