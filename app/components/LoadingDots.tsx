"use client";

import { useEffect, useState } from "react";

/** "Loading" with cycling dots (. → .. → ...). The dots sit in a fixed-width
 *  span so the text doesn't shift as they flip through. */
export default function LoadingDots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x % 3) + 1), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm text-muted-foreground">
      Loading
      <span className="inline-block w-4 text-left">{".".repeat(n)}</span>
    </span>
  );
}
