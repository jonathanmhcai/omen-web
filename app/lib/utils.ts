export function formatFriendlyDate(dateString: string): string {
  if (!dateString) return "\u2014";
  const now = new Date();
  const d = new Date(dateString);
  const diffMs = now.getTime() - d.getTime();
  const absDiffMs = Math.abs(diffMs);
  const future = diffMs < 0;
  const suffix = future ? "from now" : "ago";

  const minutes = Math.floor(absDiffMs / 60_000);
  const hours = Math.floor(absDiffMs / 3_600_000);
  const days = Math.floor(absDiffMs / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ${suffix}`;
  if (hours < 24) return `${hours}h ${suffix}`;
  if (days < 30) return `${days}d ${suffix}`;
  if (months < 12) return `${months}mo ${suffix}`;
  return `${years}y ${suffix}`;
}

export function formatExactDate(dateString: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "\u2014";
  const now = new Date();
  const d = new Date(dateString);
  const diffMs = now.getTime() - d.getTime();
  const absDiffMs = Math.abs(diffMs);
  const future = diffMs < 0;
  const suffix = future ? "from now" : "ago";

  const minutes = Math.floor(absDiffMs / 60_000);
  const hours = Math.floor(absDiffMs / 3_600_000);
  const days = Math.floor(absDiffMs / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ${suffix}`;
  if (hours < 24) return `${hours}h ${suffix}`;
  if (days < 7) return `${days}d ${suffix}`;
  if (weeks < 5) return `${weeks}w ${suffix}`;
  if (months < 12) return `${months}mo ${suffix}`;
  return `${years}y ${suffix}`;
}

export function formatNumber(value: number): string {
  if (value == null) return "\u2014";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
