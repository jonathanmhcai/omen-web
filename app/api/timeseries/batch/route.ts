import { NextRequest, NextResponse } from "next/server";

const CLOB_PRICES_HISTORY_URL = "https://clob.polymarket.com/prices-history";
const MAX_BATCH_SIZE = 100;

type BatchRequestItem = {
  market: string;
  interval?: string;
  fidelity?: number;
  startTs?: number;
  endTs?: number;
};

type BatchResultItem =
  | { history: { t: number; p: number }[] }
  | { error: string };

function buildParams(item: BatchRequestItem): URLSearchParams {
  const params = new URLSearchParams({ market: item.market });
  if (item.interval) {
    params.set("interval", item.interval);
  } else {
    if (item.startTs !== undefined) params.set("startTs", String(item.startTs));
    if (item.endTs !== undefined) params.set("endTs", String(item.endTs));
  }
  if (item.fidelity !== undefined) {
    params.set("fidelity", String(item.fidelity));
  }
  return params;
}

function isValidItem(value: unknown): value is BatchRequestItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.market === "string" && v.market.length > 0;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const requests = (body as { requests?: unknown } | null)?.requests;
  if (!Array.isArray(requests)) {
    return NextResponse.json(
      { error: "requests must be an array" },
      { status: 400 }
    );
  }
  if (requests.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (requests.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `batch size ${requests.length} exceeds max ${MAX_BATCH_SIZE}` },
      { status: 400 }
    );
  }

  const startedAt = Date.now();
  const results: BatchResultItem[] = await Promise.all(
    requests.map(async (item): Promise<BatchResultItem> => {
      if (!isValidItem(item)) {
        return { error: "invalid request item: missing market" };
      }
      try {
        const params = buildParams(item);
        const res = await fetch(
          `${CLOB_PRICES_HISTORY_URL}?${params.toString()}`
        );
        if (!res.ok) {
          return { error: `Polymarket CLOB error: ${res.status}` };
        }
        return (await res.json()) as {
          history: { t: number; p: number }[];
        };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "fetch failed",
        };
      }
    })
  );

  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[timeseries/batch] n=${requests.length} elapsed=${elapsedMs}ms ` +
      `errors=${results.filter((r) => "error" in r).length}`
  );

  return NextResponse.json({ results });
}
