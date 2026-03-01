"use client";

import { createContext, useContext, type MutableRefObject } from "react";
import type * as GeoJSON from "geojson";
import type { PolymarketEvent } from "../lib/types";
import type { TradePing } from "./layers";

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
  onEvent: (event: PolymarketEvent, locationSlug: string) => void;
  onMarket: (conditionId: string, opts?: { outcomeIndex?: number; title?: string }) => void;
  onMarketClose: () => void;
  onPositionsToggle: () => void;
  onLiveTradesToggle: () => void;
  addTradePing: (lat: number, lng: number, usdValue: number) => void;
  tradePingsRef: MutableRefObject<TradePing[]>;
  flyToLocationRef: MutableRefObject<((slug: string) => void) | null>;
  toggleDarkMode: () => void;
  toggleProjection: () => void;
}

export const MapPageContext = createContext<MapPageContextValue | null>(null);

export function useMapPageContext(): MapPageContextValue {
  const ctx = useContext(MapPageContext);
  if (!ctx) throw new Error("useMapPageContext must be used within MapPageContext.Provider");
  return ctx;
}
