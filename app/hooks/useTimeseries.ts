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

export async function fetchTimeseries(
  tokenId: string,
  options: UseTimeseriesOptions = {}
): Promise<TimeseriesResponse> {
  const params = new URLSearchParams({ market: tokenId });

  if (options.interval) {
    params.set("interval", options.interval);
  } else {
    if (options.startTs !== undefined) {
      params.set("startTs", options.startTs.toString());
    }
    if (options.endTs !== undefined) {
      params.set("endTs", options.endTs.toString());
    }
  }

  if (options.fidelity !== undefined) {
    params.set("fidelity", options.fidelity.toString());
  }

  const res = await fetch(`/api/timeseries?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch price history for token ${tokenId}: ${res.status}`);
  }
  return res.json();
}

export function timeseriesQueryOptions(
  tokenId: string,
  options: UseTimeseriesOptions = {}
) {
  return {
    queryKey: ["timeseries", tokenId, options] as const,
    queryFn: () => fetchTimeseries(tokenId, options),
    staleTime: (options.fidelity ?? 60) * 1000,
  };
}
