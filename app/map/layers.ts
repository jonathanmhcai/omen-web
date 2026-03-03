import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  ExpressionSpecification,
} from "mapbox-gl";
import type * as GeoJSON from "geojson";

type CircleLayer = Omit<CircleLayerSpecification, "source">;
type SymbolLayer = Omit<SymbolLayerSpecification, "source">;
type FillLayer = Omit<FillLayerSpecification, "source" | "source-layer">;
type LineLayer = Omit<LineLayerSpecification, "source" | "source-layer">;
type Expression = ExpressionSpecification;

function selectedColor(country: string | null, selected: string, fallback: string): Expression | string {
  if (!country) return fallback;
  return ["case", ["==", ["get", "country"], country], selected, fallback];
}

const CLUSTER_RADIUS = ["interpolate", ["linear"], ["get", "totalVolume24hr"], 0, 6, 100000, 14, 1000000, 22, 5000000, 36, 30000000, 56] as any;

export function getClusterLayers(pulse: number, reveal: number): CircleLayer[] {
  const t = pulse;
  const pingScale = 1.0 + t * 0.3;
  // Bell curve: 0 at both ends, peaks in middle — no jarring pop on reset
  const pingOpacity = 0.15 * 4 * t * (1 - t) * reveal;

  return [
    // Expanding ping ring
    {
      id: "clusters-ping",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#ef4444",
        "circle-radius": ["*", CLUSTER_RADIUS, pingScale * reveal],
        "circle-opacity": pingOpacity,
      },
    },
    // Soft outer glow
    {
      id: "clusters-glow",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#ef4444",
        "circle-radius": ["*", CLUSTER_RADIUS, reveal],
        "circle-blur": 0.4,
        "circle-opacity": 0.4 * reveal,
      },
    },
    // Core circle
    {
      id: "clusters",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#dc2626",
        "circle-radius": ["*", CLUSTER_RADIUS, 0.6 * reveal],
        "circle-opacity": 0.75 * reveal,
      },
    },
  ];
}

export function getClusterCountLayer(): SymbolLayer {
  return {
    id: "cluster-count",
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  };
}

export function getUnclusteredPointLayers(selectedCountry: string | null, pulse: number, reveal: number): CircleLayer[] {
  const t = pulse;
  const pingScale = 1.0 + t * 0.3;
  // Bell curve: 0 at both ends, peaks in middle
  const pingOpacity = 0.3 * 4 * t * (1 - t) * reveal;
  const color = selectedCountry ? selectedColor(selectedCountry, "#1d4ed8", "#ef4444") : "#ef4444";
  const coreColor = selectedCountry ? selectedColor(selectedCountry, "#1e40af", "#dc2626") : "#dc2626";

  return [
    {
      id: "unclustered-ping",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color as any,
        "circle-radius": 7 * pingScale * reveal,
        "circle-opacity": pingOpacity,
      },
    },
    {
      id: "unclustered-glow",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color as any,
        "circle-radius": 7 * reveal,
        "circle-blur": 0.4,
        "circle-opacity": 0.4 * reveal,
      },
    },
    {
      id: "unclustered-point",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": coreColor as any,
        "circle-radius": 4 * reveal,
        "circle-opacity": 0.75 * reveal,
      },
    },
  ];
}

export function getCountryFillLayer(iso2: string | null): FillLayer {
  return {
    id: "country-fill",
    type: "fill",
    paint: {
      "fill-color": "#1d4ed8",
      "fill-opacity": iso2
        ? ["case", ["==", ["get", "ISO_A2"], iso2], 0.08, 0.01] as any
        : 0.01,
    },
  };
}

export function getCountryLineLayer(iso2: string | null): LineLayer {
  return {
    id: "country-line",
    type: "line",
    paint: {
      "line-color": "#1d4ed8",
      "line-width": 2,
      "line-opacity": iso2
        ? ["case", ["==", ["get", "ISO_A2"], iso2], 0.5, 0] as any
        : 0,
    },
  };
}

export function getStateFillLayer(stateAbbr: string | null): FillLayer {
  return {
    id: "state-fill",
    type: "fill",
    paint: {
      "fill-color": "#1d4ed8",
      "fill-opacity": stateAbbr
        ? ["case", ["==", ["get", "STUSPS"], stateAbbr], 0.08, 0.01] as any
        : 0.01,
    },
  };
}

export function getStateLineLayer(stateAbbr: string | null): LineLayer {
  return {
    id: "state-line",
    type: "line",
    paint: {
      "line-color": "#1d4ed8",
      "line-width": 2,
      "line-opacity": stateAbbr
        ? ["case", ["==", ["get", "STUSPS"], stateAbbr], 0.5, 0] as any
        : 0,
    },
  };
}

// ── Trade ping layers ──

const PING_DURATION = 1200; // ms
const PING_MAX_RADIUS = 50;

export interface TradePing {
  lng: number;
  lat: number;
  timestamp: number;
  usdValue: number;
}

export function getTradePingLayers(pings: TradePing[]): {
  geojson: GeoJSON.FeatureCollection;
  layers: CircleLayer[];
} {
  const now = Date.now();
  const active = pings.filter((p) => now - p.timestamp < PING_DURATION);

  const features: GeoJSON.Feature[] = active.map((p) => {
    const age = (now - p.timestamp) / PING_DURATION; // 0 → 1
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { age },
    };
  });

  return {
    geojson: { type: "FeatureCollection", features },
    layers: [
      // Expanding ring — starts at dot radius (4px), expands outward
      {
        id: "trade-ping-ring",
        type: "circle",
        paint: {
          "circle-color": "#ef4444",
          "circle-radius": ["+", 4, ["*", PING_MAX_RADIUS, ["get", "age"]]] as any,
          "circle-opacity": ["*", 0.8, ["-", 1, ["get", "age"]]] as any,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#dc2626",
          "circle-stroke-opacity": ["*", 1, ["-", 1, ["get", "age"]]] as any,
        },
      },
      // Bright core flash
      {
        id: "trade-ping-core",
        type: "circle",
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": ["*", 10, ["-", 1, ["get", "age"]]] as any,
          "circle-opacity": ["*", 1, ["-", 1, ["get", "age"]]] as any,
        },
      },
    ],
  };
}

export const INTERACTIVE_LAYER_IDS = ["clusters", "unclustered-point", "country-fill", "state-fill"];
