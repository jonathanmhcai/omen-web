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

export function getClusterLayer(): CircleLayer {
  return {
    id: "clusters",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#ef4444",
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  };
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

export function getUnclusteredPointLayer(selectedCountry: string | null): CircleLayer {
  return {
    id: "unclustered-point",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": selectedColor(selectedCountry, "#1d4ed8", "#ef4444") as any,
      "circle-radius": 7,
      "circle-stroke-width": selectedStroke(selectedCountry, 3, 2) as any,
      "circle-stroke-color": "#ffffff",
    },
  };
}

export function getCountryFillLayer(iso2: string | null): FillLayer {
  return {
    id: "country-fill",
    type: "fill",
    paint: {
      "fill-color": "#1d4ed8",
      "fill-opacity": iso2
        ? ["case", ["==", ["get", "ISO_A2"], iso2], 0.08, 0] as any
        : 0,
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

export const INTERACTIVE_LAYER_IDS = ["clusters", "unclustered-point"];
