"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EventTweet } from "../hooks/useEventTweets";
import type { TimeseriesPoint } from "../hooks/useTimeseries";
import { TweetMarkers } from "./event/TweetMarkers";

/**
 * Presentational scrub chart — data in, no fetching, no domain knowledge.
 * Renders one or more time-series lines with continuous (pixel-space)
 * scrubbing: a dashed cursor line, the hovered date above it, and per-series
 * value labels at the cursor. Optional point markers (e.g. buy/sell/redeem)
 * sit on the lines, and tweets render in a band below via TweetMarkers
 * (clustering + popover, driven by the same cursor).
 *
 * Adapted from EventChart's SVG engine so both surfaces share one chart.
 */

const PADDING_X = 8;
const PADDING_TOP = 20;
// Reserve the bottom strip for the tweet-marker band + x-axis labels
// (matches EventChart so TweetMarkers' MARKER_BOTTOM lands correctly).
const PADDING_BOTTOM = 52;
const Y_AXIS_WIDTH = 36;

export type ScrubSeries = {
  key: string;
  label: string;
  color: string;
  points: TimeseriesPoint[];
};
export type ScrubMarker = { t: number; p: number; color: string; tooltip?: ReactNode };

interface PathSample {
  x: number;
  y: number;
  p: number;
}
interface BuiltPath extends ScrubSeries {
  d: string;
  samples: PathSample[];
  endX: number;
  endY: number;
}
interface HoverInfo {
  d: string;
  dotX: number;
  dotY: number;
  interpP: number;
}

export function ScrubChart({
  series,
  markers = [],
  tweets = [],
  height = 224,
  yTicks = [0, 0.25, 0.5, 0.75, 1],
  formatY = (p) => `${Math.round(p * 100)}`,
  formatValue = (p) => `${Math.round(p * 100)}%`,
}: {
  series: ScrubSeries[];
  markers?: ScrubMarker[];
  tweets?: EventTweet[];
  height?: number;
  yTicks?: number[];
  formatY?: (p: number) => string;
  formatValue?: (p: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const [width, setWidth] = useState(0);
  const [cursorX, setCursorX] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  const innerLeft = Y_AXIS_WIDTH;
  const innerRight = width - PADDING_X;
  const innerTop = PADDING_TOP;
  const innerBottom = height - PADDING_BOTTOM;
  const innerW = innerRight - innerLeft;
  const innerH = innerBottom - innerTop;

  const { paths, markerPts, tMin, tMax } = useMemo(() => {
    let tMin = Infinity;
    let tMax = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.t < tMin) tMin = p.t;
        if (p.t > tMax) tMax = p.t;
      }
    }
    if (!isFinite(tMin) || !isFinite(tMax) || tMin === tMax || width === 0) {
      return {
        paths: [] as BuiltPath[],
        markerPts: [] as { x: number; y: number; color: string; tooltip?: ReactNode }[],
        tMin: 0,
        tMax: 0,
      };
    }
    const xFor = (t: number) => innerLeft + ((t - tMin) / (tMax - tMin)) * innerW;
    const yFor = (p: number) => innerTop + (1 - p) * innerH;
    const paths: BuiltPath[] = series.map((s) => {
      if (s.points.length === 0) return { ...s, d: "", samples: [], endX: 0, endY: 0 };
      const samples = s.points.map((pt) => ({ x: xFor(pt.t), y: yFor(pt.p), p: pt.p }));
      let d = `M ${samples[0].x} ${samples[0].y}`;
      for (let i = 1; i < samples.length; i++) d += ` L ${samples[i].x} ${samples[i].y}`;
      const last = samples[samples.length - 1];
      return { ...s, d, samples, endX: last.x, endY: last.y };
    });
    const markerPts = markers.map((m) => ({
      x: xFor(m.t),
      y: yFor(m.p),
      color: m.color,
      tooltip: m.tooltip,
    }));
    return { paths, markerPts, tMin, tMax };
  }, [series, markers, innerLeft, innerW, innerTop, innerH, width]);

  function updateCursor(e: React.PointerEvent<HTMLDivElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setCursorX(x < innerLeft || x > innerRight ? null : x);
    });
  }
  function clearCursor() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setCursorX(null);
  }

  const hasPaths = paths.some((p) => p.d);
  const showCursor = cursorX != null && hasPaths && tMax > tMin;
  const hovers = useMemo<(HoverInfo | null)[]>(() => {
    if (!showCursor || cursorX == null) return paths.map(() => null);
    return paths.map((p) => computeHover(p.samples, cursorX, innerTop, innerH));
  }, [paths, cursorX, showCursor, innerTop, innerH]);

  const cursorTime =
    showCursor && cursorX != null && tMax > tMin
      ? tMin + ((cursorX - innerLeft) / (innerRight - innerLeft)) * (tMax - tMin)
      : null;
  const xTicks = tMax > tMin ? [tMin, tMin + (tMax - tMin) / 2, tMax] : [];

  // Marker whose dot is nearest the cursor (within MARKER_HIT_PX) — drives the
  // shares/notional tooltip on hover.
  const MARKER_HIT_PX = 12;
  const activeMarker = useMemo(() => {
    if (cursorX == null) return null;
    let best: (typeof markerPts)[number] | null = null;
    let bestD = MARKER_HIT_PX + 1;
    for (const m of markerPts) {
      if (!m.tooltip) continue;
      const d = Math.abs(m.x - cursorX);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }, [cursorX, markerPts]);

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-pan-y"
      style={{ height }}
      onPointerMove={updateCursor}
      onPointerDown={updateCursor}
      onPointerLeave={clearCursor}
      onPointerCancel={clearCursor}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") clearCursor();
      }}
    >
      {width > 0 && (
        <svg ref={svgRef} width={width} height={height} className="block">
          {yTicks.map((t) => {
            const y = innerTop + (1 - t) * innerH;
            return (
              <g key={`y-${t}`}>
                <line
                  x1={innerLeft}
                  y1={y}
                  x2={innerRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                />
                <text
                  x={innerLeft - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  style={{ fontSize: 11 }}
                >
                  {formatY(t)}
                </text>
              </g>
            );
          })}

          {xTicks.map((t, i) => {
            const x = innerLeft + ((t - tMin) / (tMax - tMin)) * innerW;
            const label = new Date(t * 1000).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return (
              <text
                key={`x-${i}`}
                x={x}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {label}
              </text>
            );
          })}

          {paths.map((p, i) => {
            if (!p.d) return null;
            const hover = hovers[i];
            const dotX = hover?.dotX ?? p.endX;
            const dotY = hover?.dotY ?? p.endY;
            return (
              <g key={p.key}>
                {hover && (
                  <path
                    d={p.d}
                    stroke={p.color}
                    strokeWidth={2}
                    strokeOpacity={0.25}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <path
                  d={hover?.d ?? p.d}
                  stroke={p.color}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={dotX} cy={dotY} r={3.5} fill={p.color} />
              </g>
            );
          })}

          {markerPts.map((m, i) => (
            <circle
              key={`m-${i}`}
              cx={m.x}
              cy={m.y}
              r={5}
              fill={m.color}
              className="stroke-background"
              strokeWidth={1.5}
            />
          ))}

          {showCursor && cursorX != null && (
            <g pointerEvents="none">
              <line
                x1={cursorX}
                y1={innerTop}
                x2={cursorX}
                y2={innerBottom}
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {cursorTime != null && (
                <text
                  x={clampLabelX(cursorX, innerLeft, innerRight)}
                  y={innerTop - 8}
                  textAnchor={labelAnchor(cursorX, innerLeft, innerRight)}
                  className="fill-muted-foreground"
                  style={{ fontSize: 11 }}
                >
                  {formatCursorTime(cursorTime)}
                </text>
              )}
              {paths.map((p, i) => {
                const hover = hovers[i];
                if (!hover) return null;
                const flip = innerRight - hover.dotX < 80;
                return (
                  <text
                    key={`hl-${p.key}`}
                    x={flip ? hover.dotX - 8 : hover.dotX + 8}
                    y={hover.dotY - 6}
                    textAnchor={flip ? "end" : "start"}
                    fill={p.color}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {formatValue(hover.interpP)}
                  </text>
                );
              })}
            </g>
          )}
        </svg>
      )}

      {activeMarker && (
        <div
          className="pointer-events-none absolute z-20 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
          style={{
            left: activeMarker.x,
            top: activeMarker.y - 8,
            transform:
              innerRight - activeMarker.x < 90
                ? "translate(-100%, -100%)"
                : "translate(-50%, -100%)",
          }}
        >
          {activeMarker.tooltip}
        </div>
      )}

      {width > 0 && tweets.length > 0 && tMax > tMin && (
        <TweetMarkers
          tweets={tweets}
          innerLeft={innerLeft}
          innerW={innerW}
          tMin={tMin}
          tMax={tMax}
          cursorX={cursorX}
          interval="max"
          intervalOptions={["max"]}
          onIntervalChange={() => {}}
        />
      )}
    </div>
  );
}

/** Hover state for one line at the cursor x (clamped to the endpoints). */
function computeHover(
  samples: PathSample[],
  cursorX: number,
  innerTop: number,
  innerH: number
): HoverInfo | null {
  if (samples.length === 0) return null;
  const first = samples[0];
  const last = samples[samples.length - 1];
  let dotX: number;
  let dotY: number;
  let d: string;
  if (cursorX <= first.x) {
    dotX = first.x;
    dotY = first.y;
    d = `M ${first.x} ${first.y}`;
  } else if (cursorX >= last.x) {
    dotX = last.x;
    dotY = last.y;
    let buf = `M ${first.x} ${first.y}`;
    for (let j = 1; j < samples.length; j++) buf += ` L ${samples[j].x} ${samples[j].y}`;
    d = buf;
  } else {
    let i = 1;
    while (i < samples.length && samples[i].x < cursorX) i++;
    const a = samples[i - 1];
    const b = samples[i];
    const t = (cursorX - a.x) / (b.x - a.x);
    dotY = a.y + (b.y - a.y) * t;
    dotX = cursorX;
    let buf = `M ${first.x} ${first.y}`;
    for (let j = 1; j < i; j++) buf += ` L ${samples[j].x} ${samples[j].y}`;
    buf += ` L ${cursorX} ${dotY}`;
    d = buf;
  }
  const interpP = 1 - (dotY - innerTop) / innerH;
  return { d, dotX, dotY, interpP };
}

function formatCursorTime(t: number): string {
  const date = new Date(t * 1000);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const dayLabel = isToday
    ? "Today"
    : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${dayLabel} ${hours}:${minStr} ${ampm}`;
}

function clampLabelX(x: number, left: number, right: number): number {
  const margin = 4;
  if (x - left < 60) return Math.max(left, x) + margin;
  if (right - x < 60) return Math.min(right, x) - margin;
  return x;
}

function labelAnchor(x: number, left: number, right: number): "start" | "middle" | "end" {
  if (x - left < 60) return "start";
  if (right - x < 60) return "end";
  return "middle";
}
