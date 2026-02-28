"use client";

import { createContext, useContext } from "react";
import type * as GeoJSON from "geojson";
import type { PolymarketEvent } from "../lib/types";

export interface MapPageContextValue {
  geojson: GeoJSON.GeoJSON;
  eventsByLocation: Map<string, PolymarketEvent[]>;
  volume24hrByLocation: Map<string, number>;
  selectedLocation: string | null;
  darkMode: boolean;
  projection: "mercator" | "globe";
  loading: boolean;
  onLocationSelect: (location: string, events: PolymarketEvent[]) => void;
  onLocationDeselect: () => void;
  onMarket: (conditionId: string, opts?: { outcomeIndex?: number; title?: string }) => void;
  onMarketClose: () => void;
  onPositionsToggle: () => void;
  onLiveTradesToggle: () => void;
  toggleDarkMode: () => void;
  toggleProjection: () => void;
}

export const MapPageContext = createContext<MapPageContextValue | null>(null);

export function useMapPageContext(): MapPageContextValue {
  const ctx = useContext(MapPageContext);
  if (!ctx) throw new Error("useMapPageContext must be used within MapPageContext.Provider");
  return ctx;
}
