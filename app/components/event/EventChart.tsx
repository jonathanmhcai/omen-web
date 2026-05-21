"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  TimeseriesInterval,
  TimeseriesPoint,
  TimeseriesResponse,
  timeseriesQueryOptions,
} from "../../hooks/useTimeseries";
import { useEventTweets } from "../../hooks/useEventTweets";
import { PolymarketEvent } from "../../lib/types";
import { getMarketsSortedByYesProbability } from "../../lib/market";
import { TweetMarkers } from "./TweetMarkers";

const SERIES_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ea580c"];
// Container height = data band + tweet-marker band + x-axis label row.
// PADDING_BOTTOM reserves the bottom strip for markers (22px markers + a
// small gap above the axis labels). Keeping innerH the same as before
// the marker band was added — data area is unchanged.
const CHART_HEIGHT = 288;
const PADDING_X = 8;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 52;
const Y_AXIS_WIDTH = 36;
const TOP_SERIES_LIMIT = 4;
const INTRO_DURATION_MS = 800;

const INTERVAL_OPTIONS: TimeseriesInterval[] = ["1h", "6h", "1d", "1w", "max"];
const INTERVAL_LABELS: Record<TimeseriesInterval, string> = {
  "1m": "1M",
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  max: "MAX",
};

function getFidelityForInterval(interval: TimeseriesInterval): number {
  switch (interval) {
    case "1m":
    case "1h":
    case "6h":
      return 1;
    case "1d":
      return 15;
    case "1w":
      return 30;
    case "max":
      return 60;
  }
}

interface Bounds {
  innerLeft: number;
  innerRight: number;
  innerTop: number;
  innerBottom: number;
  innerW: number;
  innerH: number;
}

function getChartBounds(width: number, height: number): Bounds {
  const innerLeft = Y_AXIS_WIDTH;
  const innerRight = width - PADDING_X;
  const innerTop = PADDING_TOP;
  const innerBottom = height - PADDING_BOTTOM;
  return {
    innerLeft,
    innerRight,
    innerTop,
    innerBottom,
    innerW: innerRight - innerLeft,
    innerH: innerBottom - innerTop,
  };
}

// Module-level set tracking which charts have already played the intro
// animation. Keyed by event id so the animation only plays once per chart,
// even if the component remounts (e.g. on navigation back to the page).
const chartsIntroPlayed = new Set<string>();

interface PathSample {
  x: number;
  y: number;
  /** Raw probability 0..1, kept so the legend can interpolate without
   *  round-tripping through pixel coordinates. */
  p: number;
}

interface ChartPath {
  key: string;
  label: string;
  color: string;
  d: string;
  endX: number;
  endY: number;
  /** Pixel-space samples used for hover interpolation. Empty if no data. */
  samples: PathSample[];
}

interface Series {
  key: string;
  label: string;
  color: string;
  currentPrice: number;
  points: TimeseriesPoint[];
}

interface HoverInfo {
  d: string;
  dotX: number;
  dotY: number;
  /** Interpolated probability at the cursor x. */
  interpP: number;
}

export function EventChart({ event }: { event: PolymarketEvent }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const topMarkets = useMemo(() => {
    if (!event.markets) return [];
    return getMarketsSortedByYesProbability(event.markets).slice(0, TOP_SERIES_LIMIT);
  }, [event.markets]);

  const [selectedInterval, setSelectedInterval] = useState<TimeseriesInterval>("1d");

  const seriesQueries = useQueries({
    queries: topMarkets.map(({ tokenIds, yesIndex }) => ({
      ...timeseriesQueryOptions(tokenIds[yesIndex] ?? "", {
        interval: selectedInterval,
        fidelity: getFidelityForInterval(selectedInterval),
      }),
      enabled: !!tokenIds[yesIndex],
      placeholderData: (prev: TimeseriesResponse | undefined) => prev,
    })),
  });

  const series: Series[] = useMemo(() => {
    return topMarkets.map((m, i) => {
      const data = seriesQueries[i]?.data as TimeseriesResponse | undefined;
      // We plot the YES-side outcome of each market; the label should
      // describe that outcome. For multi-outcome markets the outcome is
      // already descriptive ("Trump"); for binary Yes/No markets we fall
      // back to the market's group label ("Trump" within an election event).
      const outcome = (m.outcomes[m.yesIndex] ?? "").trim();
      const isPlainYes = outcome.toLowerCase() === "yes";
      const label =
        (!isPlainYes && outcome) ||
        m.market.groupItemTitle ||
        outcome ||
        `Market ${m.market.id}`;
      return {
        key: m.market.id,
        label,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        currentPrice: m.yesPrice,
        points: data?.history ?? [],
      };
    });
  }, [topMarkets, seriesQueries]);

  const isLoading = seriesQueries.some((q) => q.isLoading);

  const { tweets } = useEventTweets(String(event.id));

  const bounds = useMemo(() => getChartBounds(width, CHART_HEIGHT), [width]);
  const { paths, tMin, tMax } = useChartGeometry(series, bounds, width);

  // Cursor + intro state lives on the parent so both the chart svg and the
  // legend can react to scrubbing in lockstep.
  const eventIdStr = String(event.id);
  const hasPaths = paths.some((p) => p.d);
  const alreadyPlayedAtMount = useRef(chartsIntroPlayed.has(eventIdStr)).current;
  const [animateMounted, setAnimateMounted] = useState(false);
  const [introDone, setIntroDone] = useState(alreadyPlayedAtMount);

  useLayoutEffect(() => {
    if (alreadyPlayedAtMount) return;
    if (animateMounted) return;
    if (!hasPaths) return;
    chartsIntroPlayed.add(eventIdStr);
    setAnimateMounted(true);
  }, [hasPaths, eventIdStr, animateMounted, alreadyPlayedAtMount]);

  useEffect(() => {
    if (!animateMounted) return;
    const id = window.setTimeout(() => setIntroDone(true), INTRO_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [animateMounted]);

  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);

  const { innerLeft, innerRight } = bounds;

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setCursorX(x < innerLeft || x > innerRight ? null : x);
    });
  }
  function onMouseLeave() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setCursorX(null);
  }
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Compute hover info per path once per render and reuse for both the
  // line render (clipped path + dot) and the label render (color, percent).
  const showCursorOverlay =
    introDone && cursorX != null && hasPaths && tMax > tMin;
  const hoverInfos = useMemo<(HoverInfo | null)[]>(() => {
    if (!showCursorOverlay || cursorX == null) {
      return paths.map(() => null);
    }
    return paths.map((p) => computeHoverInfo(p, cursorX, bounds));
  }, [paths, cursorX, showCursorOverlay, bounds]);

  const displayedPrices = useMemo(() => {
    return paths.map((p, i) => {
      const interp = hoverInfos[i]?.interpP;
      if (interp != null) return interp;
      return series[i]?.currentPrice ?? 0;
    });
  }, [paths, series, hoverInfos]);

  if (topMarkets.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No tradable markets
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Legend series={series} displayedPrices={displayedPrices} />
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: CHART_HEIGHT }}
      >
        {width > 0 && (
          <ChartSVG
            svgRef={svgRef}
            eventId={eventIdStr}
            paths={paths}
            hoverInfos={hoverInfos}
            width={width}
            height={CHART_HEIGHT}
            bounds={bounds}
            isLoading={isLoading && !hasPaths}
            tMin={tMin}
            tMax={tMax}
            animateMounted={animateMounted}
            introDone={introDone}
            cursorX={cursorX}
            showCursorOverlay={showCursorOverlay}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          />
        )}
        {/* Tweet markers overlay — positioned absolutely on top of the
         *  SVG. Pointer-events: none on the wrapper so non-marker
         *  areas still hit the chart's hover handler; markers
         *  themselves re-enable pointer events for their tooltip. */}
        {width > 0 && tweets.length > 0 && tMax > tMin && (
          <TweetMarkers
            tweets={tweets}
            innerLeft={bounds.innerLeft}
            innerW={bounds.innerW}
            tMin={tMin}
            tMax={tMax}
            interval={selectedInterval}
            intervalOptions={INTERVAL_OPTIONS}
            onIntervalChange={setSelectedInterval}
          />
        )}
      </div>
      <div className="flex justify-end">
        <IntervalSelector
          selected={selectedInterval}
          onChange={(i) => {
            setSelectedInterval(i);
            setCursorX(null);
          }}
        />
      </div>
    </div>
  );
}

function useChartGeometry(series: Series[], bounds: Bounds, width: number) {
  return useMemo(() => {
    if (width === 0) return { paths: [] as ChartPath[], tMin: 0, tMax: 0 };

    const { innerLeft, innerW, innerTop, innerH } = bounds;

    let tMin = Infinity;
    let tMax = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p.t < tMin) tMin = p.t;
        if (p.t > tMax) tMax = p.t;
      }
    }
    if (!isFinite(tMin) || !isFinite(tMax) || tMin === tMax) {
      return { paths: [] as ChartPath[], tMin: 0, tMax: 0 };
    }

    const xFor = (t: number) =>
      innerLeft + ((t - tMin) / (tMax - tMin)) * innerW;
    const yFor = (p: number) => innerTop + (1 - p) * innerH;

    const paths: ChartPath[] = series.map((s) => {
      if (s.points.length === 0) {
        return {
          key: s.key,
          label: s.label,
          color: s.color,
          d: "",
          endX: 0,
          endY: 0,
          samples: [],
        };
      }
      const samples: PathSample[] = s.points.map((pt) => ({
        x: xFor(pt.t),
        y: yFor(pt.p),
        p: pt.p,
      }));
      let d = `M ${samples[0].x} ${samples[0].y}`;
      for (let i = 1; i < samples.length; i++) {
        d += ` L ${samples[i].x} ${samples[i].y}`;
      }
      const last = samples[samples.length - 1];
      return {
        key: s.key,
        label: s.label,
        color: s.color,
        d,
        endX: last.x,
        endY: last.y,
        samples,
      };
    });

    return { paths, tMin, tMax };
  }, [series, bounds, width]);
}

/** Compute hover state for one line at the cursor x. */
function computeHoverInfo(
  p: ChartPath,
  cursorX: number,
  bounds: Bounds
): HoverInfo | null {
  const { samples } = p;
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
    // Past the last sample — use the full line and pin the dot to the end.
    dotX = last.x;
    dotY = last.y;
    d = p.d;
  } else {
    // Find the segment containing cursorX and linearly interpolate.
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

  const interpP = 1 - (dotY - bounds.innerTop) / bounds.innerH;
  return { d, dotX, dotY, interpP };
}

function IntervalSelector({
  selected,
  onChange,
}: {
  selected: TimeseriesInterval;
  onChange: (i: TimeseriesInterval) => void;
}) {
  return (
    <div className="flex">
      {INTERVAL_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-1.5 py-1.5 text-xs font-medium transition-colors",
            opt === selected
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {INTERVAL_LABELS[opt]}
        </button>
      ))}
    </div>
  );
}

function ChartSVG({
  svgRef,
  eventId,
  paths,
  hoverInfos,
  width,
  height,
  bounds,
  isLoading,
  tMin,
  tMax,
  animateMounted,
  introDone,
  cursorX,
  showCursorOverlay,
  onMouseMove,
  onMouseLeave,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  eventId: string;
  paths: ChartPath[];
  hoverInfos: (HoverInfo | null)[];
  width: number;
  height: number;
  bounds: Bounds;
  isLoading: boolean;
  tMin: number;
  tMax: number;
  animateMounted: boolean;
  introDone: boolean;
  cursorX: number | null;
  showCursorOverlay: boolean;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
}) {
  const { innerLeft, innerRight, innerTop, innerBottom, innerH } = bounds;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks =
    tMax > tMin ? [tMin, tMin + (tMax - tMin) / 2, tMax] : [];

  const cursorTime =
    showCursorOverlay && cursorX != null && tMax > tMin
      ? tMin + ((cursorX - innerLeft) / (innerRight - innerLeft)) * (tMax - tMin)
      : null;

  const clipId = `chart-intro-${eventId}`;
  // Extend clip past innerRight so the end-circle (radius 3.5) and any
  // round line-cap aren't half-clipped at the right edge.
  const clipFullWidth = Math.max(0, width - innerLeft);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="block"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={innerLeft}
            y={innerTop - 20}
            height={innerH + 40}
            width={animateMounted ? 0 : clipFullWidth}
          >
            {animateMounted && (
              <animate
                attributeName="width"
                from="0"
                to={clipFullWidth}
                dur={`${INTRO_DURATION_MS / 1000}s`}
                fill="freeze"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.215 0.61 0.355 1"
              />
            )}
          </rect>
        </clipPath>
      </defs>

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
              {Math.round(t * 100)}
            </text>
          </g>
        );
      })}

      {xTicks.map((t, i) => {
        const x =
          innerLeft + ((t - tMin) / (tMax - tMin)) * (innerRight - innerLeft);
        const date = new Date(t * 1000);
        const label = date.toLocaleDateString(undefined, {
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

      {isLoading && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 12 }}
        >
          Loading…
        </text>
      )}

      <g clipPath={`url(#${clipId})`}>
        {paths.map((p, i) => {
          if (!p.d) return null;
          const hover = hoverInfos[i];
          const dotX = hover?.dotX ?? p.endX;
          const dotY = hover?.dotY ?? p.endY;
          const showPulse = introDone && !showCursorOverlay;
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
              {showPulse ? (
                <PulseDot cx={p.endX} cy={p.endY} color={p.color} />
              ) : (
                <circle cx={dotX} cy={dotY} r={3.5} fill={p.color} />
              )}
            </g>
          );
        })}
      </g>

      {showCursorOverlay && cursorX != null && (
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
            const hover = hoverInfos[i];
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
                {p.label} {Math.round(hover.interpP * 100)}%
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
}

function PulseDot({
  cx,
  cy,
  color,
}: {
  cx: number;
  cy: number;
  color: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={3.5} fill={color} fillOpacity={0.6}>
        <animate
          attributeName="r"
          from="3.5"
          to="11"
          dur="1.25s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="fill-opacity"
          from="0.6"
          to="0"
          dur="1.25s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={3.5} fill={color} />
    </g>
  );
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
  // Keep label tucked next to cursor when possible; nudge inward at the edges.
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

function Legend({
  series,
  displayedPrices,
}: {
  series: Series[];
  displayedPrices: number[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {series.map((s, i) => {
        const price = displayedPrices[i] ?? s.currentPrice;
        return (
          <div key={s.key} className="flex items-center gap-1.5 min-w-0">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {s.label}
            </span>
            <span className="text-xs font-semibold tabular-nums">
              {Math.round(price * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
