"use client";

import { useMemo } from "react";
import { TimeseriesPoint } from "../hooks/useTimeseries";

export function MarketSparkline({
  points,
  width,
  height,
  loading = false,
  upColor,
  downColor,
  flatColor,
  markerTimestamp,
  markerColor,
}: {
  points: TimeseriesPoint[];
  width: number;
  height: number;
  loading?: boolean;
  upColor: string;
  downColor: string;
  flatColor: string;
  markerTimestamp?: number;
  markerColor: string;
}) {
  const { pathD, color, endX, endY, isFlat, markerX } = useMemo(() => {
    if (loading || points.length < 2) {
      return {
        pathD: `M 0 ${height / 2} L ${width} ${height / 2}`,
        color: flatColor,
        endX: width,
        endY: height / 2,
        isFlat: true,
        markerX: null as number | null,
      };
    }

    const first = points[0].p;
    const last = points[points.length - 1].p;
    const goingUp = last >= first;

    let minP = points[0].p;
    let maxP = points[0].p;
    for (const pt of points) {
      if (pt.p < minP) minP = pt.p;
      if (pt.p > maxP) maxP = pt.p;
    }
    const span = maxP - minP || 1;
    const padded = span * 1.1;
    const center = (minP + maxP) / 2;
    const yMin = center - padded / 2;

    const xStep = width / (points.length - 1);
    const yFor = (price: number) => height - ((price - yMin) / padded) * height;

    let d = `M 0 ${yFor(points[0].p)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${i * xStep} ${yFor(points[i].p)}`;
    }

    const finalX = (points.length - 1) * xStep;
    const finalY = yFor(last);

    let computedMarkerX: number | null = null;
    if (markerTimestamp != null) {
      const tFirst = points[0].t;
      const tLast = points[points.length - 1].t;
      if (markerTimestamp >= tFirst && markerTimestamp <= tLast) {
        const tSpan = tLast - tFirst || 1;
        computedMarkerX = ((markerTimestamp - tFirst) / tSpan) * width;
      }
    }

    return {
      pathD: d,
      color: goingUp ? upColor : downColor,
      endX: finalX,
      endY: finalY,
      isFlat: false,
      markerX: computedMarkerX,
    };
  }, [points, width, height, loading, upColor, downColor, flatColor, markerTimestamp]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {markerX != null && (
        <line
          x1={markerX}
          y1={0}
          x2={markerX}
          y2={height}
          stroke={markerColor}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isFlat ? "3 3" : undefined}
      />
      {!isFlat && <circle cx={endX} cy={endY} r={3} fill={color} />}
    </svg>
  );
}
