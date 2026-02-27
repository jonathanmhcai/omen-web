import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  ExpressionSpecification,
} from "mapbox-gl";

type CircleLayer = Omit<CircleLayerSpecification, "source">;
type SymbolLayer = Omit<SymbolLayerSpecification, "source">;
type FillLayer = Omit<FillLayerSpecification, "source" | "source-layer">;
type LineLayer = Omit<LineLayerSpecification, "source" | "source-layer">;
type Expression = ExpressionSpecification;

function selectedColor(country: string | null, selected: string, fallback: string): Expression | string {
  if (!country) return fallback;
  return ["case", ["==", ["get", "country"], country], selected, fallback];
}

function selectedStroke(country: string | null, selected: number, fallback: number): Expression | number {
  if (!country) return fallback;
  return ["case", ["==", ["get", "country"], country], selected, fallback] as any;
}

const CLUSTER_RADIUS = ["interpolate", ["linear"], ["get", "totalVolume24hr"], 0, 6, 100000, 14, 1000000, 22, 5000000, 36, 30000000, 56] as any;

export function getClusterLayers(pulse: number): CircleLayer[] {
  // pulse 0–1 over 2s; linear outward only
  const t = pulse;
  const pingScale = 1.0 + t * 0.5;
  const pingOpacity = 0.15 * (1 - t);

  return [
    // Expanding ping ring
    {
      id: "clusters-ping",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#ef4444",
        "circle-radius": ["*", CLUSTER_RADIUS, pingScale],
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
        "circle-radius": CLUSTER_RADIUS,
        "circle-blur": 0.4,
        "circle-opacity": 0.4,
      },
    },
    // Core circle
    {
      id: "clusters",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#dc2626",
        "circle-radius": ["*", CLUSTER_RADIUS, 0.6],
        "circle-opacity": 0.75,
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

export function getUnclusteredPointLayers(selectedCountry: string | null, pulse: number): CircleLayer[] {
  const t = Math.sin(pulse * Math.PI);
  const pingScale = 1.0 + t * 0.5;
  const pingOpacity = 0.3 * (1 - t);
  const color = selectedCountry ? selectedColor(selectedCountry, "#1d4ed8", "#ef4444") : "#ef4444";
  const coreColor = selectedCountry ? selectedColor(selectedCountry, "#1e40af", "#dc2626") : "#dc2626";

  return [
    {
      id: "unclustered-ping",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color as any,
        "circle-radius": 7 * pingScale,
        "circle-opacity": pingOpacity,
      },
    },
    {
      id: "unclustered-glow",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": color as any,
        "circle-radius": 7,
        "circle-blur": 0.4,
        "circle-opacity": 0.4,
      },
    },
    {
      id: "unclustered-point",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": coreColor as any,
        "circle-radius": 4,
        "circle-opacity": 0.75,
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

export const INTERACTIVE_LAYER_IDS = ["clusters", "unclustered-point", "country-fill", "state-fill"];
