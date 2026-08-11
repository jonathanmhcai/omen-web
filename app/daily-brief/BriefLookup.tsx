"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Handle input for the daily brief. Submitting navigates to
 * /daily-brief?user=<handle> (lowercased so shared links dedupe against the
 * server's per-handle cache) — the URL is the state, so results are
 * shareable and back/reload behave.
 */
export default function BriefLookup({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit() {
    const v = value.trim().toLowerCase();
    if (!v) return;
    router.push(`/daily-brief?user=${encodeURIComponent(v)}`);
  }

  return (
    <form
      className="flex w-full max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Polymarket username or 0x address"
        className="w-full rounded-md border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        View
      </button>
    </form>
  );
}
