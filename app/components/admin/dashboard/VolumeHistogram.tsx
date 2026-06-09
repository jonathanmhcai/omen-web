"use client";

import { useMemo } from "react";
import { AdminVolumeSeries } from "../../../lib/types";
import { formatNumber, formatShares } from "../../../lib/utils";
import BarSeriesChart from "./BarSeriesChart";

export type VolumeMetric = "notional" | "shares";

interface VolumeHistogramProps {
  series: AdminVolumeSeries | null;
  metric: VolumeMetric;
  loading?: boolean;
  error?: string | null;
}

export default function VolumeHistogram({
  series,
  metric,
  loading,
  error,
}: VolumeHistogramProps) {
  const data = useMemo(
    () =>
      series
        ? series.points.map((p) => ({
            bucket: p.bucket,
            value: Number(metric === "notional" ? p.volumeUsd : p.shares),
          }))
        : null,
    [series, metric],
  );

  return (
    <BarSeriesChart
      title="Trade volume over time"
      grain={series?.grain ?? "day"}
      data={data}
      loading={loading}
      error={error}
      emptyLabel="No trades in this window"
      formatValue={metric === "notional" ? formatNumber : formatShares}
      valueSuffix={metric === "shares" ? " shares" : ""}
    />
  );
}
