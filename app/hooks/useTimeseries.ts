"use client";

export type TimeseriesInterval = "1m" | "1h" | "6h" | "1d" | "1w" | "max";

export interface TimeseriesPoint {
  t: number;
  p: number;
}

export interface TimeseriesResponse {
  history: TimeseriesPoint[];
}

export interface UseTimeseriesOptions {
  startTs?: number;
  endTs?: number;
  interval?: TimeseriesInterval;
  fidelity?: number;
}

type BatchRequestItem = {
  market: string;
  interval?: TimeseriesInterval;
  fidelity?: number;
  startTs?: number;
  endTs?: number;
};

type Pending = {
  key: string;
  request: BatchRequestItem;
  resolve: (r: TimeseriesResponse) => void;
  reject: (e: Error) => void;
};

let queue: Pending[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function serializeKey(item: BatchRequestItem): string {
  return JSON.stringify([
    item.market,
    item.interval ?? null,
    item.fidelity ?? null,
    item.startTs ?? null,
    item.endTs ?? null,
  ]);
}

async function flushBatch() {
  flushTimer = null;
  const pending = queue;
  queue = [];

  const byKey = new Map<
    string,
    { item: BatchRequestItem; waiters: Pending[] }
  >();
  for (const p of pending) {
    const existing = byKey.get(p.key);
    if (existing) existing.waiters.push(p);
    else byKey.set(p.key, { item: p.request, waiters: [p] });
  }
  const groups = Array.from(byKey.values());

  try {
    const res = await fetch("/api/timeseries/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requests: groups.map((g) => g.item) }),
    });
    if (!res.ok) {
      throw new Error(`batch request failed: ${res.status}`);
    }
    const json = (await res.json()) as {
      results: ({ history: TimeseriesPoint[] } | { error: string })[];
    };
    if (!Array.isArray(json.results) || json.results.length !== groups.length) {
      throw new Error("batch response shape mismatch");
    }
    json.results.forEach((result, i) => {
      const waiters = groups[i].waiters;
      if ("error" in result) {
        const err = new Error(result.error);
        for (const w of waiters) w.reject(err);
      } else {
        for (const w of waiters) w.resolve(result);
      }
    });
  } catch (err) {
    const e = err instanceof Error ? err : new Error("batch request failed");
    for (const g of groups) for (const w of g.waiters) w.reject(e);
  }
}

export function fetchTimeseries(
  tokenId: string,
  options: UseTimeseriesOptions = {}
): Promise<TimeseriesResponse> {
  const request: BatchRequestItem = { market: tokenId };
  if (options.interval) {
    request.interval = options.interval;
  } else {
    if (options.startTs !== undefined) request.startTs = options.startTs;
    if (options.endTs !== undefined) request.endTs = options.endTs;
  }
  if (options.fidelity !== undefined) request.fidelity = options.fidelity;

  const key = serializeKey(request);
  return new Promise((resolve, reject) => {
    queue.push({ key, request, resolve, reject });
    if (flushTimer === null) {
      flushTimer = setTimeout(flushBatch, 0);
    }
  });
}

export function timeseriesQueryOptions(
  tokenId: string,
  options: UseTimeseriesOptions = {}
) {
  return {
    queryKey: ["timeseries", tokenId, options] as const,
    queryFn: () => fetchTimeseries(tokenId, options),
  };
}
