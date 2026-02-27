"use client";

import { createContext, useContext } from "react";
import type * as GeoJSON from "geojson";
import type { PolymarketEvent, PolymarketMarket } from "../lib/types";

export interface MapPageContextValue {
  geojson: GeoJSON.GeoJSON;
  eventsByLocation: Map<string, PolymarketEvent[]>;
  volume24hrByLocation: Map<string, number>;
  selectedLocation: string | null;
  darkMode: boolean;
  loading: boolean;
  onLocationSelect: (location: string, events: PolymarketEvent[]) => void;
  onLocationDeselect: () => void;
  onTrade: (market: PolymarketMarket, outcomeIndex: number) => void;
  onTradeClose: () => void;
}

export const MapPageContext = createContext<MapPageContextValue | null>(null);

export function useMapPageContext(): MapPageContextValue {
  const ctx = useContext(MapPageContext);
  if (!ctx) throw new Error("useMapPageContext must be used within MapPageContext.Provider");
  return ctx;
}
