"use client";

import { useMemo } from "react";
import { AdminDepositsSeries } from "../../../lib/types";
import { formatNumber } from "../../../lib/utils";
import BarSeriesChart from "./BarSeriesChart";

interface DepositsHistogramProps {
  series: AdminDepositsSeries | null;
  loading?: boolean;
  error?: string | null;
}

export default function DepositsHistogram({
  series,
  loading,
  error,
}: DepositsHistogramProps) {
  const data = useMemo(
    () =>
      series
        ? series.points.map((p) => ({
            bucket: p.bucket,
            value: Number(p.depositsUsd),
          }))
        : null,
    [series],
  );

  return (
    <BarSeriesChart
      title="Deposits over time"
      grain={series?.grain ?? "day"}
      data={data}
      loading={loading}
      error={error}
      emptyLabel="No deposits in this window"
      formatValue={formatNumber}
      fill="#16a34a"
    />
  );
}
