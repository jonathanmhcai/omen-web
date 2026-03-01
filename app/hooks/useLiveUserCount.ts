import { useEffect, useState } from "react";
import { API_BASE } from "../lib/constants";

export function useLiveUserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/live-count`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setCount(data.count);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects — just clear count while disconnected
      setCount(null);
    };

    return () => es.close();
  }, []);

  return count;
}
